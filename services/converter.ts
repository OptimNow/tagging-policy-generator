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
      report_required_tag_for?: { '@@assign': string[] };
    };
  };
}

/**
 * Services that support enforced_for with ALL_SUPPORTED syntax.
 * Only these services can be used in the enforced_for field.
 * Reference: https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_supported-resources-enforcement.html
 * 
 * A service is included here only if its ALL_SUPPORTED entry has "Enforcement Mode: Yes"
 */
const SERVICES_WITH_ENFORCEMENT_SUPPORT = new Set([
  'ec2',
  's3', 
  'lambda',
  'dynamodb',
  'elasticache',
  'redshift',
  'rds',
  'eks',
  'ecs',
  'acm',
  'appmesh',
  'backup',
  'backup-gateway',
  'batch',
  'auditmanager',
  'elasticfilesystem',
  // Note: elasticloadbalancing does NOT support enforcement mode, only reporting
  // Add more as AWS adds support
]);

/**
 * Convert specific resource types to AWS service:ALL_SUPPORTED format for enforced_for.
 * AWS enforced_for only accepts service:ALL_SUPPORTED syntax, not specific resource types.
 * Only includes services that actually support enforcement.
 * 
 * Example: ['ec2:instance', 'rds:db', 'sagemaker:endpoint'] 
 *       -> ['ec2:ALL_SUPPORTED', 'rds:ALL_SUPPORTED'] (sagemaker excluded - no enforcement support)
 */
function convertToEnforcedForFormat(resourceTypes: string[]): string[] {
  const services = new Set<string>();
  
  for (const resource of resourceTypes) {
    // Extract service name from resource type (e.g., 'ec2:instance' -> 'ec2')
    const colonIndex = resource.indexOf(':');
    if (colonIndex > 0) {
      const service = resource.substring(0, colonIndex);
      // Only include services that support enforcement
      if (SERVICES_WITH_ENFORCEMENT_SUPPORT.has(service)) {
        services.add(service);
      }
    }
  }
  
  // Convert to service:ALL_SUPPORTED format
  return Array.from(services).map(service => `${service}:ALL_SUPPORTED`);
}

/**
 * Convert resource types to valid report_required_tag_for format.
 * Filters out invalid resource types that AWS doesn't recognize.
 * 
 * AWS only accepts specific resource type formats in report_required_tag_for.
 * Some resource types from our app may not be valid AWS tag policy resource types.
 */
function convertToReportRequiredFormat(resourceTypes: string[]): string[] {
  // Map our internal resource types to valid AWS tag policy resource types
  const resourceTypeMapping: Record<string, string> = {
    // RDS mappings - AWS uses 'rds:db' not 'rds:db-instance'
    'rds:db-instance': 'rds:db',
    'rds:db': 'rds:db',
    'rds:cluster': 'rds:cluster',
    
    // EKS mappings
    'eks:cluster': 'eks:cluster',
    'eks:nodegroup': 'eks:nodegroup',
    
    // EC2 mappings
    'ec2:instance': 'ec2:instance',
    'ec2:volume': 'ec2:volume',
    'ec2:natgateway': 'ec2:natgateway',
    'ec2:vpc': 'ec2:vpc',
    'ec2:subnet': 'ec2:subnet',
    'ec2:security-group': 'ec2:security-group',
    
    // S3 mappings
    's3:bucket': 's3:bucket',
    
    // Lambda mappings
    'lambda:function': 'lambda:function',
    
    // ECS mappings
    'ecs:service': 'ecs:service',
    'ecs:cluster': 'ecs:cluster',
    'ecs:task-definition': 'ecs:task-definition',
    
    // DynamoDB mappings
    'dynamodb:table': 'dynamodb:table',
    
    // ElastiCache mappings
    'elasticache:cluster': 'elasticache:cluster',
    
    // Redshift mappings
    'redshift:cluster': 'redshift:cluster',
    
    // ELB mappings
    'elasticloadbalancing:loadbalancer': 'elasticloadbalancing:loadbalancer',
    'elasticloadbalancing:targetgroup': 'elasticloadbalancing:targetgroup',
    
    // Glue mappings
    'glue:job': 'glue:job',
    
    // Kinesis mappings
    'kinesis:stream': 'kinesis:stream',
    
    // SageMaker mappings
    'sagemaker:endpoint': 'sagemaker:endpoint',
    'sagemaker:notebook-instance': 'sagemaker:notebook-instance',
    
    // Bedrock mappings - these may not be supported in tag policies yet
    'bedrock:agent': 'bedrock:agent',
    'bedrock:knowledge-base': 'bedrock:knowledge-base',
  };
  
  const validResourceTypes: string[] = [];
  
  for (const resource of resourceTypes) {
    const mapped = resourceTypeMapping[resource];
    if (mapped) {
      validResourceTypes.push(mapped);
    } else {
      // If not in mapping, try to use as-is (AWS may accept it)
      validResourceTypes.push(resource);
    }
  }
  
  return [...new Set(validResourceTypes)]; // Remove duplicates
}

/**
 * Convert our policy format to AWS Organizations Tag Policy format.
 *
 * AWS Tag Policy rules:
 * - enforced_for: Only accepts service:ALL_SUPPORTED format (e.g., 'rds:ALL_SUPPORTED')
 *   This prevents noncompliant tagging operations for the specified services.
 *   Only services with "Enforcement Mode: Yes" can be used here.
 * - report_required_tag_for: Accepts specific resource types (e.g., 'rds:db')
 *   This drives compliance reporting for the specified resource types.
 *
 * Note: AWS Tag Policies do not support regex validation, so validation_regex
 * fields will be ignored in the export. Only allowed_values will be converted.
 */
export function convertMcpToAwsPolicy(policy: Policy): AwsTagPolicy {
  const awsPolicy: AwsTagPolicy = { tags: {} };

  // Process required tags
  for (const tag of policy.required_tags) {
    const tagConfig: AwsTagPolicy['tags'][string] = {
      tag_key: { '@@assign': tag.name }
    };

    // Add allowed values if specified
    if (tag.allowed_values && tag.allowed_values.length > 0) {
      tagConfig.tag_value = { '@@assign': tag.allowed_values };
    }

    // Convert applies_to to proper AWS format
    if (tag.applies_to && tag.applies_to.length > 0) {
      // enforced_for: Use service:ALL_SUPPORTED format for services that support enforcement
      const enforcedForServices = convertToEnforcedForFormat(tag.applies_to);
      if (enforcedForServices.length > 0) {
        tagConfig.enforced_for = { '@@assign': enforcedForServices };
      }
      
      // report_required_tag_for: Use specific resource types for compliance reporting
      const reportRequiredFor = convertToReportRequiredFormat(tag.applies_to);
      if (reportRequiredFor.length > 0) {
        tagConfig.report_required_tag_for = { '@@assign': reportRequiredFor };
      }
    }

    awsPolicy.tags[tag.name] = tagConfig;
  }

  // Process optional tags (no enforced_for or report_required_tag_for)
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