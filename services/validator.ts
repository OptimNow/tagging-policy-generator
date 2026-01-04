import { Policy } from '../types';

export function validatePolicy(policy: Policy): string[] {
  const errors: string[] = [];
  
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
  }

  // Validate Naming Rules
  if (policy.tag_naming_rules.max_key_length < 1) {
      errors.push("Max key length must be greater than 0");
  }
  if (policy.tag_naming_rules.max_value_length < 1) {
      errors.push("Max value length must be greater than 0");
  }
  
  return errors;
}