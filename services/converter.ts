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
      : ['ec2:instance', 'rds:db', 's3:bucket', 'lambda:function']; // Default fallback if needed, though strictly AWS policies with no enforcement might just be tag policies without resource linkage.
    
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
  const serviceMap: Record<string, string[]> = {
    'ec2': ['ec2:instance', 'ec2:volume', 'ec2:snapshot'],
    's3': ['s3:bucket'],
    'rds': ['rds:db'],
    'lambda': ['lambda:function'],
    'ecs': ['ecs:service', 'ecs:task']
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