import { Policy, RequiredTag, OptionalTag } from '../types';

export function convertAwsPolicyToMcp(awsPolicyString: string): Policy {
  let awsPolicy;
  try {
    awsPolicy = JSON.parse(awsPolicyString);
  } catch (e) {
    throw new Error("Invalid JSON format");
  }

  const tags = awsPolicy.tags || {};
  const requiredTags: RequiredTag[] = [];
  const optionalTags: OptionalTag[] = [];
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const [key, config] of Object.entries(tags) as [string, any][]) {
    const tagName = config.tag_key?.['@@assign'] || key;
    const allowedValues = config.tag_value?.['@@assign'] || null;
    const enforcedFor = config.enforced_for?.['@@assign'] || [];
    
    const appliesTo = enforcedFor.length > 0
      ? parseEnforcedFor(enforcedFor)
      : ['ec2:instance', 's3:bucket', 'lambda:function']; // Default fallback (only supported types)
    
    const description = `Converted from AWS Organizations tag policy - ${key}`;

    if (enforcedFor.length > 0) {
      requiredTags.push({
        name: tagName,
        description,
        allowed_values: allowedValues,
        validation_regex: null,
        applies_to: appliesTo
      });
    } else {
      optionalTags.push({
        name: tagName,
        description,
        allowed_values: allowedValues
      });
    }
  }
  
  return {
    version: "1.0",
    last_updated: new Date().toISOString(),
    required_tags: requiredTags,
    optional_tags: optionalTags,
    tag_naming_rules: {
      case_sensitivity: false,
      allow_special_characters: false,
      max_key_length: 128,
      max_value_length: 256
    }
  };
}

function parseEnforcedFor(enforcedFor: string[]): string[] {
  const appliesTo: string[] = [];
  // Map AWS service wildcards to specific resource types
  // Using AWS's actual enforced_for resource type names
  const serviceMap: Record<string, string[]> = {
    // Compute
    'ec2': ['ec2:instance', 'ec2:volume', 'ec2:snapshot', 'ec2:natgateway'],
    'lambda': ['lambda:function'],
    'ecs': ['ecs:service', 'ecs:task-definition'],
    'eks': ['eks:cluster', 'eks:nodegroup'],

    // Storage
    's3': ['s3:bucket'],
    'elasticfilesystem': ['elasticfilesystem:file-system'],
    'efs': ['elasticfilesystem:file-system'], // alias
    'fsx': ['fsx:file-system'],

    // Database
    'rds': ['rds:db-instance', 'rds:cluster'],
    'dynamodb': ['dynamodb:table'],
    'elasticache': ['elasticache:cluster'],
    'redshift': ['redshift:cluster'],
    'es': ['es:domain'],
    'opensearch': ['es:domain'], // alias - OpenSearch uses es: prefix in tag policies

    // AI/ML
    'sagemaker': ['sagemaker:endpoint', 'sagemaker:notebook-instance'],
    'bedrock': ['bedrock:provisioned-model-throughput'],

    // Networking
    'elasticloadbalancing': ['elasticloadbalancing:loadbalancer'],

    // Analytics & Streaming
    'kinesis': ['kinesis:stream'],
    'glue': ['glue:job']
  };

  for (const resource of enforcedFor) {
    if (resource.includes(':ALL_SUPPORTED')) {
      const service = resource.split(':')[0];
      if (serviceMap[service]) {
        appliesTo.push(...serviceMap[service]);
      } else {
        appliesTo.push(`${service}:resource`); // Fallback
      }
    } else {
      appliesTo.push(resource);
    }
  }

  return [...new Set(appliesTo)]; // Remove duplicates
}

// AWS Tag Policy format structure
interface AwsTagPolicy {
  tags: {
    [tagName: string]: {
      tag_key: { '@@assign': string };
      tag_value?: { '@@assign': string[] };
      enforced_for?: { '@@assign': string[] };
    };
  };
}

/**
 * Convert our policy format to AWS Organizations Tag Policy format.
 *
 * Note: AWS Tag Policies do not support regex validation, so validation_regex
 * fields will be ignored in the export. Only allowed_values will be converted.
 */
export function convertMcpToAwsPolicy(policy: Policy): AwsTagPolicy {
  const awsPolicy: AwsTagPolicy = { tags: {} };

  // Process required tags (these have enforced_for)
  for (const tag of policy.required_tags) {
    const tagConfig: AwsTagPolicy['tags'][string] = {
      tag_key: { '@@assign': tag.name }
    };

    // Add allowed values if specified
    if (tag.allowed_values && tag.allowed_values.length > 0) {
      tagConfig.tag_value = { '@@assign': tag.allowed_values };
    }

    // Add enforced_for if applies_to is specified
    if (tag.applies_to && tag.applies_to.length > 0) {
      tagConfig.enforced_for = { '@@assign': tag.applies_to };
    }

    awsPolicy.tags[tag.name] = tagConfig;
  }

  // Process optional tags (no enforced_for)
  for (const tag of policy.optional_tags) {
    const tagConfig: AwsTagPolicy['tags'][string] = {
      tag_key: { '@@assign': tag.name }
    };

    // Add allowed values if specified
    if (tag.allowed_values && tag.allowed_values.length > 0) {
      tagConfig.tag_value = { '@@assign': tag.allowed_values };
    }

    // Optional tags don't have enforced_for in AWS format
    awsPolicy.tags[tag.name] = tagConfig;
  }

  return awsPolicy;
}

/**
 * Check if the policy has features that won't be preserved in AWS format
 */
export function getAwsExportWarnings(policy: Policy): string[] {
  const warnings: string[] = [];

  const tagsWithRegex = policy.required_tags.filter(t => t.validation_regex);
  if (tagsWithRegex.length > 0) {
    const tagNames = tagsWithRegex.map(t => t.name).join(', ');
    warnings.push(`Regex validation will be lost for: ${tagNames}. AWS Tag Policies don't support regex patterns.`);
  }

  return warnings;
}