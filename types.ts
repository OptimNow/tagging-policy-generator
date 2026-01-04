export interface TagNamingRules {
  case_sensitivity: boolean;
  allow_special_characters: boolean;
  max_key_length: number;
  max_value_length: number;
}

export interface RequiredTag {
  name: string;
  description: string;
  allowed_values: string[] | null;
  validation_regex: string | null;
  applies_to: string[];
}

export interface OptionalTag {
  name: string;
  description: string;
  allowed_values: string[] | null;
}

export interface Policy {
  version: string;
  last_updated: string;
  required_tags: RequiredTag[];
  optional_tags: OptionalTag[];
  tag_naming_rules: TagNamingRules;
}

export const AWS_RESOURCE_TYPES = [
  'ec2:instance',
  'ec2:volume',
  'ec2:snapshot',
  'rds:db',
  's3:bucket',
  'lambda:function',
  'ecs:service',
  'ecs:task'
];