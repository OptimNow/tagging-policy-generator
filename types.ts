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

// Organized by typical spend impact for FinOps prioritization
export const AWS_RESOURCE_TYPES = [
  // Compute - typically 40-60% of spend
  'ec2:instance',
  'ec2:volume',
  'ec2:snapshot',
  'lambda:function',
  'ecs:service',
  'ecs:task',
  'eks:cluster',
  'eks:nodegroup',

  // Storage - typically 10-20% of spend
  's3:bucket',
  'efs:file-system',
  'fsx:file-system',

  // Database - typically 15-25% of spend
  'rds:db',
  'rds:cluster',
  'dynamodb:table',
  'elasticache:cluster',
  'redshift:cluster',
  'opensearch:domain',

  // AI/ML - growing rapidly
  'sagemaker:endpoint',
  'sagemaker:notebook-instance',
  'bedrock:provisioned-model-throughput',

  // Networking - often overlooked but significant
  'elasticloadbalancing:loadbalancer',
  'ec2:natgateway',

  // Analytics & Streaming
  'kinesis:stream',
  'glue:job',
];