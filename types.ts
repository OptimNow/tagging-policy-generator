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

// Resource categories organized by typical spend impact for FinOps prioritization
export interface ResourceCategory {
  name: string;
  description: string;
  resources: string[];
}

export const RESOURCE_CATEGORIES: ResourceCategory[] = [
  {
    name: 'Compute',
    description: '40-60% of typical spend',
    resources: [
      'ec2:instance',
      'ec2:volume',
      'ec2:snapshot',
      'lambda:function',
      'ecs:service',
      'ecs:task',
      'eks:cluster',
      'eks:nodegroup',
    ]
  },
  {
    name: 'Storage',
    description: '10-20% of typical spend',
    resources: [
      's3:bucket',
      'efs:file-system',
      'fsx:file-system',
    ]
  },
  {
    name: 'Database',
    description: '15-25% of typical spend',
    resources: [
      'rds:db',
      'rds:cluster',
      'dynamodb:table',
      'elasticache:cluster',
      'redshift:cluster',
      'opensearch:domain',
    ]
  },
  {
    name: 'AI/ML',
    description: 'Growing rapidly',
    resources: [
      'sagemaker:endpoint',
      'sagemaker:notebook-instance',
      'bedrock:provisioned-model-throughput',
    ]
  },
  {
    name: 'Networking',
    description: 'Often overlooked',
    resources: [
      'elasticloadbalancing:loadbalancer',
      'ec2:natgateway',
    ]
  },
  {
    name: 'Analytics',
    description: 'Data & streaming',
    resources: [
      'kinesis:stream',
      'glue:job',
    ]
  },
];

// Flat list of all resource types (derived from categories)
export const AWS_RESOURCE_TYPES = RESOURCE_CATEGORIES.flatMap(cat => cat.resources);