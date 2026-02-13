import { Policy, RequiredTag, OptionalTag } from '../types';

// GCP Label Policy format for import/export
interface GcpLabelConfig {
  label_key: string;
  description: string;
  allowed_values: string[] | null;
  enforced_for: string[];
  required: boolean;
}

interface GcpLabelPolicy {
  label_policy: {
    labels: {
      [labelKey: string]: GcpLabelConfig;
    };
    naming_rules: {
      max_key_length: number;
      max_value_length: number;
      key_format: string;
      notes: string;
    };
  };
}

// Import: GCP Label Policy JSON -> MCP Format
export function convertGcpPolicyToMcp(gcpPolicyString: string): Policy {
  let gcpPolicy: GcpLabelPolicy;
  try {
    gcpPolicy = JSON.parse(gcpPolicyString);
  } catch {
    throw new Error("Invalid JSON format. Please paste valid GCP Label Policy JSON.");
  }

  if (!gcpPolicy.label_policy || !gcpPolicy.label_policy.labels) {
    throw new Error("Invalid GCP Label Policy format. Expected label_policy.labels object.");
  }

  const labels = gcpPolicy.label_policy.labels;
  const requiredTags: RequiredTag[] = [];
  const optionalTags: OptionalTag[] = [];

  for (const [key, config] of Object.entries(labels)) {
    const labelName = config.label_key || key;
    const description = config.description || `Converted from GCP Label Policy - ${key}`;
    const allowedValues = config.allowed_values || null;
    const enforcedFor = config.enforced_for || [];
    const isRequired = config.required !== false && enforcedFor.length > 0;

    if (isRequired) {
      requiredTags.push({
        name: labelName,
        description,
        allowed_values: allowedValues,
        validation_regex: null,
        applies_to: enforcedFor,
      });
    } else {
      optionalTags.push({
        name: labelName,
        description,
        allowed_values: allowedValues,
      });
    }
  }

  const namingRules = gcpPolicy.label_policy.naming_rules;

  return {
    version: "1.0",
    last_updated: new Date().toISOString(),
    cloud_provider: 'gcp',
    required_tags: requiredTags,
    optional_tags: optionalTags,
    tag_naming_rules: {
      case_sensitivity: false,
      allow_special_characters: false,
      max_key_length: namingRules?.max_key_length || 63,
      max_value_length: namingRules?.max_value_length || 63,
    },
  };
}

// Export: MCP Format -> GCP Label Policy
export function convertMcpToGcpPolicy(policy: Policy): GcpLabelPolicy {
  const labels: GcpLabelPolicy['label_policy']['labels'] = {};

  for (const tag of policy.required_tags) {
    const gcpKey = tag.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    labels[gcpKey] = {
      label_key: gcpKey,
      description: tag.description,
      allowed_values: tag.allowed_values,
      enforced_for: tag.applies_to || [],
      required: true,
    };
  }

  for (const tag of policy.optional_tags) {
    const gcpKey = tag.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    labels[gcpKey] = {
      label_key: gcpKey,
      description: tag.description,
      allowed_values: tag.allowed_values,
      enforced_for: [],
      required: false,
    };
  }

  return {
    label_policy: {
      labels,
      naming_rules: {
        max_key_length: Math.min(policy.tag_naming_rules.max_key_length, 63),
        max_value_length: Math.min(policy.tag_naming_rules.max_value_length, 63),
        key_format: "lowercase_with_underscores",
        notes: "GCP labels must be lowercase, start with a letter, and contain only lowercase letters, numbers, underscores, and hyphens. Maximum 64 labels per resource.",
      },
    },
  };
}

// Export warnings for features that won't be preserved in GCP format
export function getGcpExportWarnings(policy: Policy): string[] {
  const warnings: string[] = [];

  const tagsWithRegex = policy.required_tags.filter(t => t.validation_regex);
  if (tagsWithRegex.length > 0) {
    const tagNames = tagsWithRegex.map(t => t.name).join(', ');
    warnings.push(`Regex validation will be lost for: ${tagNames}. GCP Label Policies don't support regex patterns.`);
  }

  const allTags = [...policy.required_tags, ...policy.optional_tags];
  const upperCaseKeys = allTags.filter(t => t.name !== t.name.toLowerCase());
  if (upperCaseKeys.length > 0) {
    const names = upperCaseKeys.map(t => t.name).join(', ');
    warnings.push(`Label keys will be lowercased: ${names}. GCP labels must be lowercase.`);
  }

  if (policy.tag_naming_rules.max_key_length > 63) {
    warnings.push(`Max key length (${policy.tag_naming_rules.max_key_length}) exceeds GCP limit of 63. It will be capped.`);
  }
  if (policy.tag_naming_rules.max_value_length > 63) {
    warnings.push(`Max value length (${policy.tag_naming_rules.max_value_length}) exceeds GCP limit of 63. It will be capped.`);
  }

  return warnings;
}
