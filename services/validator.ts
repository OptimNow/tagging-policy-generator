import { Policy, getResourceTypes } from '../types';

export function validatePolicy(policy: Policy): string[] {
  const errors: string[] = [];
  const provider = policy.cloud_provider || 'aws';

  // Check required tags existence (optional based on prompt, but good practice)
  if (!policy.required_tags || policy.required_tags.length === 0) {
    // errors.push("At least one required tag is recommended."); // Not strictly an error according to prompt, but prompt says "At least one required tag must be defined" in validation section
    errors.push("At least one required tag must be defined");
  }

  const tagNames = new Set<string>();

  // Validate required tags
  for (const [index, tag] of (policy.required_tags || []).entries()) {
    const prefix = `Required tag #${index + 1}`;

    if (!tag.name || tag.name.trim() === '') {
      errors.push(`${prefix}: Name is required`);
    } else if (tagNames.has(tag.name.toLowerCase())) {
      errors.push(`${prefix}: Duplicate tag name "${tag.name}"`);
    } else {
      tagNames.add(tag.name.toLowerCase());
    }

    if (!tag.description || tag.description.trim() === '') {
      errors.push(`${prefix} (${tag.name || 'Unnamed'}): Description is required`);
    }

    if (!tag.applies_to || tag.applies_to.length === 0) {
      errors.push(`${prefix} (${tag.name || 'Unnamed'}): At least one resource type must be selected`);
    }

    if (tag.validation_regex) {
      try {
        new RegExp(tag.validation_regex);
      } catch (e) {
        errors.push(`${prefix} (${tag.name || 'Unnamed'}): Invalid regex pattern`);
      }
    }

    if (tag.allowed_values && tag.allowed_values.some(v => v.trim() === '')) {
         errors.push(`${prefix} (${tag.name || 'Unnamed'}): Allowed values cannot contain empty strings`);
    }

    // GCP-specific: label key naming rules
    if (provider === 'gcp' && tag.name) {
      if (!/^[a-z][a-z0-9_-]*$/.test(tag.name)) {
        errors.push(`${prefix} (${tag.name}): GCP label keys must be lowercase, start with a letter, and contain only lowercase letters, numbers, underscores, and hyphens`);
      }
      if (tag.name.length > 63) {
        errors.push(`${prefix} (${tag.name}): GCP label keys cannot exceed 63 characters`);
      }
    }

    // Azure-specific: tag key naming rules
    if (provider === 'azure' && tag.name) {
      if (tag.name.length > 512) {
        errors.push(`${prefix} (${tag.name}): Azure tag names cannot exceed 512 characters`);
      }
      if (/[<>%&\\?\/]/.test(tag.name)) {
        errors.push(`${prefix} (${tag.name}): Azure tag names cannot contain <, >, %, &, \\, ?, or /`);
      }
      if (/^(microsoft|azure|windows)/i.test(tag.name)) {
        errors.push(`${prefix} (${tag.name}): Azure tag names cannot use reserved prefixes (microsoft, azure, windows)`);
      }
    }

    // Validate resource types belong to the correct provider
    if (tag.applies_to && tag.applies_to.length > 0) {
      const validTypes = getResourceTypes(provider);
      const invalidTypes = tag.applies_to.filter(r => !validTypes.includes(r));
      if (invalidTypes.length > 0) {
        errors.push(`${prefix} (${tag.name || 'Unnamed'}): Invalid resource types for ${provider.toUpperCase()}: ${invalidTypes.join(', ')}`);
      }
    }
  }

  // Validate optional tags
  for (const [index, tag] of (policy.optional_tags || []).entries()) {
    const prefix = `Optional tag #${index + 1}`;

    if (!tag.name || tag.name.trim() === '') {
      errors.push(`${prefix}: Name is required`);
    } else if (tagNames.has(tag.name.toLowerCase())) {
      errors.push(`${prefix}: Duplicate tag name "${tag.name}"`);
    } else {
      tagNames.add(tag.name.toLowerCase());
    }

    if (tag.allowed_values && tag.allowed_values.some(v => v.trim() === '')) {
         errors.push(`${prefix} (${tag.name || 'Unnamed'}): Allowed values cannot contain empty strings`);
    }

    // GCP-specific: label key naming rules for optional tags
    if (provider === 'gcp' && tag.name) {
      if (!/^[a-z][a-z0-9_-]*$/.test(tag.name)) {
        errors.push(`${prefix} (${tag.name}): GCP label keys must be lowercase, start with a letter, and contain only lowercase letters, numbers, underscores, and hyphens`);
      }
    }

    // Azure-specific: tag key naming rules for optional tags
    if (provider === 'azure' && tag.name) {
      if (tag.name.length > 512) {
        errors.push(`${prefix} (${tag.name}): Azure tag names cannot exceed 512 characters`);
      }
      if (/[<>%&\\?\/]/.test(tag.name)) {
        errors.push(`${prefix} (${tag.name}): Azure tag names cannot contain <, >, %, &, \\, ?, or /`);
      }
      if (/^(microsoft|azure|windows)/i.test(tag.name)) {
        errors.push(`${prefix} (${tag.name}): Azure tag names cannot use reserved prefixes (microsoft, azure, windows)`);
      }
    }
  }

  // Validate Naming Rules
  if (policy.tag_naming_rules.max_key_length < 1) {
      errors.push("Max key length must be greater than 0");
  }
  if (policy.tag_naming_rules.max_value_length < 1) {
      errors.push("Max value length must be greater than 0");
  }

  // GCP-specific naming rule limits
  if (provider === 'gcp') {
    if (policy.tag_naming_rules.max_key_length > 63) {
      errors.push("GCP label keys have a maximum length of 63 characters");
    }
    if (policy.tag_naming_rules.max_value_length > 63) {
      errors.push("GCP label values have a maximum length of 63 characters");
    }
  }

  // Azure-specific naming rule limits
  if (provider === 'azure') {
    if (policy.tag_naming_rules.max_key_length > 512) {
      errors.push("Azure tag names have a maximum length of 512 characters");
    }
    if (policy.tag_naming_rules.max_value_length > 256) {
      errors.push("Azure tag values have a maximum length of 256 characters");
    }
    const totalTags = (policy.required_tags?.length || 0) + (policy.optional_tags?.length || 0);
    if (totalTags > 50) {
      errors.push(`Azure resources support a maximum of 50 tags. Your policy defines ${totalTags} tags.`);
    }
    const hasStorageResources = policy.required_tags?.some(t =>
      t.applies_to?.some(r => r.includes('Microsoft.Storage'))
    );
    if (hasStorageResources) {
      const allTags = [...(policy.required_tags || []), ...(policy.optional_tags || [])];
      const longNames = allTags.filter(t => t.name && t.name.length > 128);
      if (longNames.length > 0) {
        errors.push(`Azure Storage accounts limit tag names to 128 characters. These exceed that: ${longNames.map(t => t.name).join(', ')}`);
      }
    }
  }

  return errors;
}
