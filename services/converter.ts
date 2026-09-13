import { Policy, RequiredTag, OptionalTag, CategorizedExportWarnings, AWS_RESOURCE_TYPES } from '../types';

// AWS Organizations tag policy shape (export target and import source)
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

// ---------------------------------------------------------------------------
// Enforcement support
// ---------------------------------------------------------------------------
// From the AWS table "Resources that support enforcement in tag policies",
// checked on 12 September 2026:
// https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_supported-resources-enforcement.html
// Only the app's resource types are covered.

// Resource types whose own row has Enforcement Mode = Yes. They can be listed
// individually in enforced_for.
const ENFORCEABLE_RESOURCE_TYPES = new Set([
  'ec2:instance', 'ec2:volume', 'ec2:natgateway', 'ec2:vpc', 'ec2:subnet', 'ec2:security-group',
  'lambda:function',
  'ecs:service', 'ecs:cluster', 'ecs:task-definition',
  's3:bucket',
  'fsx:file-system',
  'dynamodb:table',
  'elasticache:cluster',
  'redshift:cluster',
  'elasticloadbalancing:loadbalancer', 'elasticloadbalancing:targetgroup',
]);

// Services whose "<service>:ALL_SUPPORTED" row has Enforcement Mode = Yes. The
// app's types that have no enforcement row of their own (rds:db, eks:cluster,
// eks:nodegroup, elasticfilesystem:file-system) can only be enforced through
// this wildcard, which covers every enforceable type of the service.
const SERVICES_WITH_WILDCARD_ENFORCEMENT = new Set([
  'ec2', 'lambda', 'ecs', 'eks', 's3', 'elasticfilesystem', 'fsx', 'rds', 'dynamodb', 'elasticache', 'redshift',
]);

// Names used by older exports and example files, mapped to the app's names.
const RESOURCE_TYPE_ALIASES: Record<string, string> = { 'rds:db-instance': 'rds:db' };
const SERVICE_ALIASES: Record<string, string> = { efs: 'elasticfilesystem' };

const WILDCARD_SUFFIX = ':ALL_SUPPORTED';

function serviceOf(resourceType: string): string {
  const service = resourceType.split(':')[0];
  return SERVICE_ALIASES[service] || service;
}

function normaliseResourceType(entry: string): string {
  const colon = entry.indexOf(':');
  if (colon <= 0) return entry;
  const type = `${serviceOf(entry)}${entry.slice(colon)}`;
  return RESOURCE_TYPE_ALIASES[type] || type;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

// ---------------------------------------------------------------------------
// Import: AWS Organizations tag policy -> MCP Policy
// ---------------------------------------------------------------------------

export function convertAwsPolicyToMcp(awsPolicyString: string): Policy {
  let awsPolicy: unknown;
  try {
    awsPolicy = JSON.parse(awsPolicyString);
  } catch {
    throw new Error("Invalid JSON format");
  }

  const tags = awsPolicy && typeof awsPolicy === 'object' ? (awsPolicy as Record<string, unknown>).tags : undefined;
  if (!tags || typeof tags !== 'object' || Array.isArray(tags)) {
    throw new Error('Unrecognised format. Paste an AWS Organizations tag policy (with a top-level "tags" object) or a policy JSON saved from this tool.');
  }

  const requiredTags: RequiredTag[] = [];
  const optionalTags: OptionalTag[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const [key, rawConfig] of Object.entries(tags as Record<string, any>)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: Record<string, any> = rawConfig && typeof rawConfig === 'object' ? rawConfig : {};
    const tagKey = config.tag_key?.['@@assign'];
    const tagName = typeof tagKey === 'string' && tagKey ? tagKey : key;
    const allowed = stringList(config.tag_value?.['@@assign']);
    const enforcedFor = stringList(config.enforced_for?.['@@assign']);
    const reportFor = stringList(config.report_required_tag_for?.['@@assign']);
    const description = `Converted from AWS Organizations tag policy - ${key}`;

    // A tag is required when the policy enforces it or reports it as required.
    // Types AWS can't enforce appear only in report_required_tag_for.
    if (enforcedFor.length > 0 || reportFor.length > 0) {
      requiredTags.push({
        name: tagName,
        description,
        allowed_values: allowed.length > 0 ? allowed : null,
        validation_regex: null,
        applies_to: resolveAppliesTo(enforcedFor, reportFor),
      });
    } else {
      optionalTags.push({
        name: tagName,
        description,
        allowed_values: allowed.length > 0 ? allowed : null,
      });
    }
  }

  return {
    version: "1.0",
    last_updated: new Date().toISOString(),
    cloud_provider: 'aws' as const,
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

function resolveAppliesTo(enforcedFor: string[], reportFor: string[]): string[] {
  const result: string[] = [];
  const add = (type: string) => { if (!result.includes(type)) result.push(type); };

  // Exact resource types, from reporting first, then enforcement.
  for (const entry of [...reportFor, ...enforcedFor]) {
    if (!entry.endsWith(WILDCARD_SUFFIX)) add(normaliseResourceType(entry));
  }

  // A service wildcard widens the scope only for services the policy lists no
  // exact type for, so a policy exported by this tool returns the original
  // selection instead of every resource type of the service.
  for (const entry of enforcedFor) {
    if (!entry.endsWith(WILDCARD_SUFFIX)) continue;
    const service = serviceOf(entry);
    if (result.some(type => serviceOf(type) === service)) continue;
    const known = AWS_RESOURCE_TYPES.filter(type => serviceOf(type) === service);
    // Without app types for the service, keep the wildcard itself so the editor
    // shows it and the user can remove it.
    if (known.length > 0) known.forEach(add);
    else add(`${service}${WILDCARD_SUFFIX}`);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Export: MCP Policy -> AWS Organizations tag policy
// ---------------------------------------------------------------------------

interface EnforcementPlan {
  enforcedFor: string[];                              // enforced_for entries
  reportFor: string[];                                // report_required_tag_for entries
  widened: { service: string; selected: string[] }[]; // enforced only via service:ALL_SUPPORTED
  reportOnly: string[];                               // AWS can't enforce these types
  unknown: string[];                                  // not AWS tag policy resource types
}

function planEnforcement(appliesTo: string[]): EnforcementPlan {
  const normalised = [...new Set(appliesTo.map(normaliseResourceType))];
  const known = normalised.filter(type => AWS_RESOURCE_TYPES.includes(type));
  const unknown = normalised.filter(type => !AWS_RESOURCE_TYPES.includes(type));

  const specific: string[] = [];
  const widened = new Map<string, string[]>();
  const reportOnly: string[] = [];
  for (const type of known) {
    const service = serviceOf(type);
    if (ENFORCEABLE_RESOURCE_TYPES.has(type)) specific.push(type);
    else if (SERVICES_WITH_WILDCARD_ENFORCEMENT.has(service)) widened.set(service, [...(widened.get(service) || []), type]);
    else reportOnly.push(type);
  }

  // A service wildcard already covers that service's individual types.
  const enforcedFor = [
    ...specific.filter(type => !widened.has(serviceOf(type))),
    ...[...widened.keys()].map(service => `${service}${WILDCARD_SUFFIX}`),
  ];

  return {
    enforcedFor,
    reportFor: known,
    widened: [...widened].map(([service, selected]) => ({ service, selected })),
    reportOnly,
    unknown,
  };
}

/**
 * Convert our policy format to an AWS Organizations tag policy.
 *
 * - enforced_for lists each selected resource type that AWS can enforce on its
 *   own. Types that AWS can enforce only service-wide (rds:db, EKS, EFS) use
 *   "<service>:ALL_SUPPORTED", and getAwsExportWarnings says so.
 * - report_required_tag_for lists every selected resource type AWS recognises,
 *   which drives compliance reporting.
 *
 * AWS tag policies have no regex support, so validation_regex is dropped.
 */
export function convertMcpToAwsPolicy(policy: Policy): AwsTagPolicy {
  const awsPolicy: AwsTagPolicy = { tags: {} };

  for (const tag of policy.required_tags || []) {
    const tagConfig: AwsTagPolicy['tags'][string] = {
      tag_key: { '@@assign': tag.name }
    };

    if (tag.allowed_values && tag.allowed_values.length > 0) {
      tagConfig.tag_value = { '@@assign': tag.allowed_values };
    }

    const plan = planEnforcement(tag.applies_to || []);
    if (plan.enforcedFor.length > 0) {
      tagConfig.enforced_for = { '@@assign': plan.enforcedFor };
    }
    if (plan.reportFor.length > 0) {
      tagConfig.report_required_tag_for = { '@@assign': plan.reportFor };
    }

    awsPolicy.tags[tag.name] = tagConfig;
  }

  // Optional tags carry no enforced_for or report_required_tag_for.
  for (const tag of policy.optional_tags || []) {
    const tagConfig: AwsTagPolicy['tags'][string] = {
      tag_key: { '@@assign': tag.name }
    };

    if (tag.allowed_values && tag.allowed_values.length > 0) {
      tagConfig.tag_value = { '@@assign': tag.allowed_values };
    }

    awsPolicy.tags[tag.name] = tagConfig;
  }

  return awsPolicy;
}

/**
 * Lists what the AWS export can't carry or changes: dropped regexes, scope
 * widened to a service wildcard, types AWS can't enforce, and unknown types.
 */
export function getAwsExportWarnings(policy: Policy): CategorizedExportWarnings {
  const limitations: string[] = [];
  const deploymentNotes: string[] = [];
  const requiredTags = policy.required_tags || [];

  const tagsWithRegex = requiredTags.filter(t => t.validation_regex);
  if (tagsWithRegex.length > 0) {
    const tagNames = tagsWithRegex.map(t => t.name).join(', ');
    limitations.push(`Regex validation will be dropped for ${tagNames}. AWS Tag Policies have no regex support — rely on allowed_values instead.`);
  }

  const widened = new Map<string, { types: Set<string>; tags: Set<string> }>();
  const reportOnlyTypes = new Set<string>();
  const reportOnlyTags = new Set<string>();
  const unknown: string[] = [];

  for (const tag of requiredTags) {
    const plan = planEnforcement(tag.applies_to || []);
    for (const { service, selected } of plan.widened) {
      const entry = widened.get(service) || { types: new Set<string>(), tags: new Set<string>() };
      selected.forEach(type => entry.types.add(type));
      entry.tags.add(tag.name);
      widened.set(service, entry);
    }
    if (plan.reportOnly.length > 0) {
      plan.reportOnly.forEach(type => reportOnlyTypes.add(type));
      reportOnlyTags.add(tag.name);
    }
    plan.unknown.forEach(type => unknown.push(`${type} (${tag.name})`));
  }

  for (const [service, { types, tags }] of widened) {
    limitations.push(`AWS can't enforce tags on ${[...types].join(', ')} by itself, so ${[...tags].join(', ')} ${tags.size === 1 ? 'is' : 'are'} enforced through ${service}:ALL_SUPPORTED. That also covers every other ${service} resource type that supports enforcement.`);
  }
  if (reportOnlyTypes.size > 0) {
    limitations.push(`AWS tag policies can't enforce tags on ${[...reportOnlyTypes].join(', ')}. Missing ${[...reportOnlyTags].join(', ')} tags on these resources will show in compliance reports but won't be blocked.`);
  }
  if (unknown.length > 0) {
    limitations.push(`Left out of the policy because AWS tag policies don't recognise these resource types: ${unknown.join(', ')}.`);
  }

  return { limitations, deploymentNotes };
}
