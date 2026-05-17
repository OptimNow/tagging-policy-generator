import { Policy, RequiredTag, OptionalTag } from '../types';

// ---------------------------------------------------------------------------
// ARM deployment template shapes (export target)
// ---------------------------------------------------------------------------

interface ArmParameterDefinition {
  type: 'String' | 'Array' | 'Object' | 'Boolean' | 'Integer';
  metadata: { displayName: string; description: string };
  defaultValue?: string | string[] | number | boolean;
  allowedValues?: string[];
}

interface AzureCustomPolicyDefinition {
  type: 'Microsoft.Authorization/policyDefinitions';
  apiVersion: '2021-06-01';
  name: string;
  properties: {
    displayName: string;
    policyType: 'Custom';
    mode: 'Indexed' | 'All';
    description: string;
    metadata: Record<string, string>;
    parameters: Record<string, ArmParameterDefinition>;
    policyRule: {
      if: Record<string, unknown>;
      then: { effect: string };
    };
  };
}

interface AzurePolicyReference {
  policyDefinitionReferenceId: string;
  policyDefinitionId: string;
  parameters: Record<string, { value: string | string[] }>;
}

interface AzurePolicySetDefinition {
  type: 'Microsoft.Authorization/policySetDefinitions';
  apiVersion: '2021-06-01';
  name: string;
  dependsOn?: string[];
  properties: {
    displayName: string;
    policyType: 'Custom';
    description: string;
    metadata: Record<string, string>;
    policyDefinitions: AzurePolicyReference[];
  };
}

type AzureResource = AzureCustomPolicyDefinition | AzurePolicySetDefinition;

export interface AzureArmTemplate {
  $schema: string;
  contentVersion: string;
  metadata: Record<string, string>;
  resources: AzureResource[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CUSTOM_DEF_REQUIRE_TAG = 'require-tag-on-resources';
const CUSTOM_DEF_REQUIRE_TAG_AND_VALUE = 'require-tag-and-value-on-resources';
const INITIATIVE_NAME = 'tagging-governance-initiative';

// Subscription-scope ARM template schema: required when the template
// contains Microsoft.Authorization/policyDefinitions or policySetDefinitions,
// which cannot be deployed at resource-group scope. Users wanting
// management-group scope should swap this for the
// managementGroupDeploymentTemplate.json schema and `az deployment mg create`.
const ARM_TEMPLATE_SCHEMA = 'https://schema.management.azure.com/schemas/2018-05-01/subscriptionDeploymentTemplate.json#';

interface BuiltinInheritancePolicy {
  guid: string;
  displayName: string;
  refIdSuffix: string;  // e.g. 'inherit-from-rg-if-missing'
  description: string;
}

const BUILTIN_INHERITANCE_POLICIES: BuiltinInheritancePolicy[] = [
  {
    guid: 'cd3aa116-8754-49c9-a813-ad46512ece54',
    displayName: 'Inherit a tag from the resource group',
    refIdSuffix: 'inherit-from-rg',
    description: 'Adds or replaces the tag and value from the parent resource group. Overwrites resource-level values.',
  },
  {
    guid: 'ea3f2387-9b95-492a-a190-fcdc54f7b070',
    displayName: 'Inherit a tag from the resource group if missing',
    refIdSuffix: 'inherit-from-rg-if-missing',
    description: 'Adds the tag from the parent resource group only when the resource has no value for it.',
  },
  {
    guid: 'b27a0cbd-a167-4064-ae47-28c309da4a4f',
    displayName: 'Inherit a tag from the subscription',
    refIdSuffix: 'inherit-from-sub',
    description: 'Adds or replaces the tag and value from the containing subscription. Overwrites resource-level values.',
  },
  {
    guid: '40df99da-1232-49b1-a39a-6571f4e27e24',
    displayName: 'Inherit a tag from the subscription if missing',
    refIdSuffix: 'inherit-from-sub-if-missing',
    description: 'Adds the tag from the containing subscription only when the resource has no value for it.',
  },
];

const BUILTIN_INHERITANCE_GUIDS = new Set(BUILTIN_INHERITANCE_POLICIES.map(p => p.guid));

// Reserved Azure tag name prefixes that should not be used.
const AZURE_RESERVED_TAG_PREFIXES = ['microsoft', 'azure', 'windows'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// ARM-safe reference ID: keeps letters, digits, hyphens, underscores.
// Azure policyDefinitionReferenceId must be 1-128 chars from [A-Za-z0-9-_].
function sanitizeReferenceId(input: string): string {
  return input.replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 128) || 'ref';
}

function customDefResourceIdExpression(name: string): string {
  return `[resourceId('Microsoft.Authorization/policyDefinitions', '${name}')]`;
}

function builtinPolicyDefinitionId(guid: string): string {
  return `/providers/Microsoft.Authorization/policyDefinitions/${guid}`;
}

// ---------------------------------------------------------------------------
// Builders: parametrized custom definitions
// ---------------------------------------------------------------------------

function buildRequireTagDefinition(): AzureCustomPolicyDefinition {
  return {
    type: 'Microsoft.Authorization/policyDefinitions',
    apiVersion: '2021-06-01',
    name: CUSTOM_DEF_REQUIRE_TAG,
    properties: {
      displayName: 'Require a tag on resources',
      policyType: 'Custom',
      mode: 'Indexed',
      description: 'Requires that a tag with the specified name be present on resources. The effect parameter controls whether non-compliant resources are denied or audited.',
      metadata: {
        category: 'Tags',
        version: '1.0.0',
        generatedBy: 'OptimNow Tagging Policy Generator',
      },
      parameters: {
        tagName: {
          type: 'String',
          metadata: {
            displayName: 'Tag Name',
            description: 'Name of the tag whose presence is required.',
          },
        },
        effect: {
          type: 'String',
          metadata: {
            displayName: 'Effect',
            description: 'Enforcement effect when the tag is missing.',
          },
          allowedValues: ['audit', 'deny', 'disabled'],
          defaultValue: 'deny',
        },
      },
      policyRule: {
        if: {
          field: "[concat('tags[', parameters('tagName'), ']')]",
          exists: 'false',
        },
        then: {
          effect: "[parameters('effect')]",
        },
      },
    },
  };
}

function buildRequireTagAndValueDefinition(): AzureCustomPolicyDefinition {
  return {
    type: 'Microsoft.Authorization/policyDefinitions',
    apiVersion: '2021-06-01',
    name: CUSTOM_DEF_REQUIRE_TAG_AND_VALUE,
    properties: {
      displayName: 'Require a tag and value on resources',
      policyType: 'Custom',
      mode: 'Indexed',
      description: 'Requires that a tag with the specified name be present on resources and that its value belong to an allowed list. The effect parameter controls whether non-compliant resources are denied or audited.',
      metadata: {
        category: 'Tags',
        version: '1.0.0',
        generatedBy: 'OptimNow Tagging Policy Generator',
      },
      parameters: {
        tagName: {
          type: 'String',
          metadata: {
            displayName: 'Tag Name',
            description: 'Name of the tag to enforce.',
          },
        },
        allowedValues: {
          type: 'Array',
          metadata: {
            displayName: 'Allowed Values',
            description: 'List of allowed tag values.',
          },
        },
        effect: {
          type: 'String',
          metadata: {
            displayName: 'Effect',
            description: 'Enforcement effect when the tag is missing or its value is not in the allowed list.',
          },
          allowedValues: ['audit', 'deny', 'disabled'],
          defaultValue: 'deny',
        },
      },
      policyRule: {
        if: {
          anyOf: [
            {
              field: "[concat('tags[', parameters('tagName'), ']')]",
              exists: 'false',
            },
            {
              field: "[concat('tags[', parameters('tagName'), ']')]",
              notIn: "[parameters('allowedValues')]",
            },
          ],
        },
        then: {
          effect: "[parameters('effect')]",
        },
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Builders: initiative references
// ---------------------------------------------------------------------------

function buildEnforcementReference(
  tag: RequiredTag | OptionalTag,
  effect: 'deny' | 'audit'
): AzurePolicyReference {
  const hasAllowedValues = !!(tag.allowed_values && tag.allowed_values.length > 0);
  const customDefName = hasAllowedValues
    ? CUSTOM_DEF_REQUIRE_TAG_AND_VALUE
    : CUSTOM_DEF_REQUIRE_TAG;
  const verb = effect === 'deny' ? 'require' : 'audit';
  const refId = sanitizeReferenceId(
    `${verb}-${tag.name}${hasAllowedValues ? '-with-values' : ''}`
  );

  const parameters: AzurePolicyReference['parameters'] = {
    tagName: { value: tag.name },
    effect: { value: effect },
  };
  if (hasAllowedValues) {
    parameters.allowedValues = { value: tag.allowed_values as string[] };
  }

  return {
    policyDefinitionReferenceId: refId,
    policyDefinitionId: customDefResourceIdExpression(customDefName),
    parameters,
  };
}

function buildInheritanceReference(
  tagName: string,
  builtin: BuiltinInheritancePolicy
): AzurePolicyReference {
  return {
    policyDefinitionReferenceId: sanitizeReferenceId(`${tagName}-${builtin.refIdSuffix}`),
    policyDefinitionId: builtinPolicyDefinitionId(builtin.guid),
    parameters: {
      tagName: { value: tagName },
    },
  };
}

// ---------------------------------------------------------------------------
// Export: MCP Policy -> ARM deployment template
// ---------------------------------------------------------------------------

export function convertMcpToAzurePolicy(policy: Policy): AzureArmTemplate {
  const allTags: Array<{ tag: RequiredTag | OptionalTag; effect: 'deny' | 'audit' }> = [
    ...policy.required_tags.map(tag => ({ tag, effect: 'deny' as const })),
    ...policy.optional_tags.map(tag => ({ tag, effect: 'audit' as const })),
  ];

  const anyTagUsesAllowedValues = allTags.some(
    ({ tag }) => tag.allowed_values && tag.allowed_values.length > 0
  );

  // Custom definitions
  const resources: AzureResource[] = [];
  resources.push(buildRequireTagDefinition());
  if (anyTagUsesAllowedValues) {
    resources.push(buildRequireTagAndValueDefinition());
  }

  // Initiative references: enforcement first, then inheritance per tag per built-in.
  const enforcementRefs: AzurePolicyReference[] = allTags.map(({ tag, effect }) =>
    buildEnforcementReference(tag, effect)
  );
  const inheritanceRefs: AzurePolicyReference[] = allTags.flatMap(({ tag }) =>
    BUILTIN_INHERITANCE_POLICIES.map(builtin => buildInheritanceReference(tag.name, builtin))
  );

  const initiativeDependsOn: string[] = [customDefResourceIdExpression(CUSTOM_DEF_REQUIRE_TAG)];
  if (anyTagUsesAllowedValues) {
    initiativeDependsOn.push(customDefResourceIdExpression(CUSTOM_DEF_REQUIRE_TAG_AND_VALUE));
  }

  const initiative: AzurePolicySetDefinition = {
    type: 'Microsoft.Authorization/policySetDefinitions',
    apiVersion: '2021-06-01',
    name: INITIATIVE_NAME,
    dependsOn: initiativeDependsOn,
    properties: {
      displayName: 'Tagging Governance Initiative',
      policyType: 'Custom',
      description: 'Enforces required tags, audits optional tags, and inherits tags from resource group and subscription scopes. Generated by OptimNow Tagging Policy Generator.',
      metadata: {
        category: 'Tags',
        version: policy.version,
        generatedBy: 'OptimNow Tagging Policy Generator',
      },
      policyDefinitions: [...enforcementRefs, ...inheritanceRefs],
    },
  };
  resources.push(initiative);

  return {
    $schema: ARM_TEMPLATE_SCHEMA,
    contentVersion: '1.0.0.0',
    metadata: {
      generatedBy: 'OptimNow Tagging Policy Generator',
      policyVersion: policy.version,
      deploymentScope: 'subscription (or management group with management-group schema)',
      cliExample: "az deployment sub create --location <region> --template-file azure_tagging_bundle.json",
    },
    resources,
  };
}

// ---------------------------------------------------------------------------
// Import: ARM bundle or standalone Policy Set Definition -> MCP Policy
// ---------------------------------------------------------------------------

const LEGACY_FORMAT_ERROR =
  "Unsupported Azure policy shape. The importer only accepts an ARM deployment template (with `resources[]`) or a standalone Microsoft.Authorization/policySetDefinitions object generated by this tool. Re-export from the latest tool version.";

export function convertAzurePolicyToMcp(azurePolicyString: string): Policy {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(azurePolicyString);
  } catch {
    throw new Error('Invalid JSON format. Please paste valid Azure Policy JSON.');
  }

  const policySetProperties = locatePolicySetProperties(parsed);
  if (!policySetProperties) {
    throw new Error(LEGACY_FORMAT_ERROR);
  }

  const refs = policySetProperties.policyDefinitions;
  if (!Array.isArray(refs)) {
    throw new Error(LEGACY_FORMAT_ERROR);
  }

  const requiredTags: RequiredTag[] = [];
  const optionalTags: OptionalTag[] = [];

  for (const ref of refs) {
    const refObj = ref as Record<string, unknown>;
    const definitionId = typeof refObj.policyDefinitionId === 'string' ? refObj.policyDefinitionId : '';
    if (referencesBuiltinInheritance(definitionId)) continue;  // scaffolding, not user intent

    const parameters = (refObj.parameters as Record<string, { value?: unknown }> | undefined) || {};
    const tagNameValue = parameters.tagName?.value;
    if (typeof tagNameValue !== 'string' || tagNameValue.length === 0) continue;

    const effectValue = parameters.effect?.value;
    const effect = typeof effectValue === 'string' ? effectValue.toLowerCase() : 'deny';

    const allowedValuesRaw = parameters.allowedValues?.value;
    const allowedValues = Array.isArray(allowedValuesRaw)
      ? allowedValuesRaw.filter((v): v is string => typeof v === 'string')
      : null;

    const refIdRaw = refObj.policyDefinitionReferenceId;
    const description = typeof refIdRaw === 'string' && refIdRaw.length > 0
      ? `Imported from ${refIdRaw}`
      : `Imported tag ${tagNameValue}`;

    if (effect === 'audit') {
      optionalTags.push({
        name: tagNameValue,
        description,
        allowed_values: allowedValues && allowedValues.length > 0 ? allowedValues : null,
      });
    } else {
      requiredTags.push({
        name: tagNameValue,
        description,
        allowed_values: allowedValues && allowedValues.length > 0 ? allowedValues : null,
        validation_regex: null,
        applies_to: [],
      });
    }
  }

  if (requiredTags.length === 0 && optionalTags.length === 0) {
    throw new Error(
      'No tag enforcement references found in the policy set. Ensure the initiative references the parametrized custom tag definitions.'
    );
  }

  return {
    version: '1.0',
    last_updated: new Date().toISOString(),
    cloud_provider: 'azure',
    required_tags: requiredTags,
    optional_tags: optionalTags,
    tag_naming_rules: {
      case_sensitivity: false,
      allow_special_characters: false,
      max_key_length: 512,
      max_value_length: 256,
    },
  };
}

function locatePolicySetProperties(
  parsed: Record<string, unknown>
): { policyDefinitions: unknown[] } | null {
  // Case 1: ARM deployment template with resources[]
  const resources = (parsed as { resources?: unknown }).resources;
  if (Array.isArray(resources)) {
    for (const resource of resources) {
      const r = resource as Record<string, unknown>;
      if (r.type === 'Microsoft.Authorization/policySetDefinitions') {
        const props = r.properties as Record<string, unknown> | undefined;
        if (props && Array.isArray(props.policyDefinitions)) {
          return { policyDefinitions: props.policyDefinitions as unknown[] };
        }
      }
    }
    return null;
  }

  // Case 2: standalone Microsoft.Authorization/policySetDefinitions object
  if (parsed.type === 'Microsoft.Authorization/policySetDefinitions') {
    const props = parsed.properties as Record<string, unknown> | undefined;
    if (props && Array.isArray(props.policyDefinitions)) {
      return { policyDefinitions: props.policyDefinitions as unknown[] };
    }
  }

  return null;
}

function referencesBuiltinInheritance(policyDefinitionId: string): boolean {
  for (const guid of BUILTIN_INHERITANCE_GUIDS) {
    if (policyDefinitionId.includes(guid)) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Single-tag portal-paste helper (used by TagForm "Copy as Azure Policy" button)
// ---------------------------------------------------------------------------

// Standalone policy-definition shape (legacy, used only by the portal helper).
interface AzurePolicyDefinitionStandalone {
  properties: {
    displayName: string;
    policyType: string;
    mode: string;
    description: string;
    metadata?: Record<string, string>;
    parameters: Record<string, {
      type: string;
      metadata: { displayName: string; description: string };
      defaultValue: string | string[];
    }>;
    policyRule: {
      if: Record<string, unknown>;
      then: { effect: string };
    };
  };
}

function buildPolicyDefinition(
  tagName: string,
  description: string,
  effect: string,
  allowedValues: string[] | null
): AzurePolicyDefinitionStandalone {
  const parameters: AzurePolicyDefinitionStandalone['properties']['parameters'] = {
    tagName: {
      type: 'String',
      metadata: {
        displayName: 'Tag Name',
        description: 'Name of the tag to enforce',
      },
      defaultValue: tagName,
    },
  };

  if (allowedValues && allowedValues.length > 0) {
    parameters.allowedValues = {
      type: 'Array',
      metadata: {
        displayName: 'Allowed Values',
        description: 'List of allowed tag values',
      },
      defaultValue: allowedValues,
    };
  }

  const policyRule: AzurePolicyDefinitionStandalone['properties']['policyRule'] =
    allowedValues && allowedValues.length > 0
      ? {
          if: {
            anyOf: [
              {
                field: "[concat('tags[', parameters('tagName'), ']')]",
                exists: 'false',
              },
              {
                field: "[concat('tags[', parameters('tagName'), ']')]",
                notIn: "[parameters('allowedValues')]",
              },
            ],
          },
          then: { effect },
        }
      : {
          if: {
            field: "[concat('tags[', parameters('tagName'), ']')]",
            exists: 'false',
          },
          then: { effect },
        };

  return {
    properties: {
      displayName: `${effect === 'deny' ? 'Require' : 'Audit'} ${tagName} tag on resources`,
      policyType: 'Custom',
      mode: 'Indexed',
      description,
      metadata: {
        category: 'Tags',
        version: '1.0.0',
        generatedBy: 'OptimNow Tagging Policy Generator',
      },
      parameters,
      policyRule,
    },
  };
}

// Generate Azure Portal-ready JSON for a single tag definition.
// Pasted into the Azure Portal Policy Rule editor: mode, parameters, policyRule.
export function generateAzurePortalJson(
  tagName: string,
  description: string,
  effect: string,
  allowedValues: string[] | null
): Record<string, unknown> {
  const def = buildPolicyDefinition(tagName, description, effect, allowedValues);
  return {
    mode: def.properties.mode,
    parameters: def.properties.parameters,
    policyRule: def.properties.policyRule,
  };
}

// ---------------------------------------------------------------------------
// Export warnings
// ---------------------------------------------------------------------------

export function getAzureExportWarnings(policy: Policy): string[] {
  const warnings: string[] = [];
  const allTags = [...policy.required_tags, ...policy.optional_tags];

  // Regex validation not supported
  const tagsWithRegex = policy.required_tags.filter(t => t.validation_regex);
  if (tagsWithRegex.length > 0) {
    const tagNames = tagsWithRegex.map(t => t.name).join(', ');
    warnings.push(`Regex validation will be lost for: ${tagNames}. Azure Policy doesn't support regex — use allowedValues or chain a separate Match() condition instead.`);
  }

  // Tag name length
  const longNames = allTags.filter(t => t.name.length > 512);
  if (longNames.length > 0) {
    warnings.push(`Tag names exceed Azure's 512-character limit: ${longNames.map(t => t.name).join(', ')}`);
  }

  // Reserved prefixes
  const reservedPrefixHits = allTags.filter(t =>
    AZURE_RESERVED_TAG_PREFIXES.some(p => t.name.toLowerCase().startsWith(p))
  );
  if (reservedPrefixHits.length > 0) {
    warnings.push(`Tag names use Azure reserved prefixes (microsoft/azure/windows): ${reservedPrefixHits.map(t => t.name).join(', ')}. Azure may reject these.`);
  }

  // Total tag count
  if (allTags.length > 50) {
    warnings.push(`Your policy defines ${allTags.length} tags. Azure resources support a maximum of 50 tags per resource.`);
  }

  // Storage account tag name limit
  const hasStorageResources = policy.required_tags.some(t =>
    t.applies_to?.some(r => r.includes('Microsoft.Storage'))
  );
  if (hasStorageResources) {
    const longStorageNames = allTags.filter(t => t.name.length > 128);
    if (longStorageNames.length > 0) {
      warnings.push(`Storage accounts limit tag names to 128 characters. These exceed that: ${longStorageNames.map(t => t.name).join(', ')}`);
    }
  }

  // Managed resource groups
  const hasManagedRgServices = policy.required_tags.some(t =>
    t.applies_to?.some(r =>
      r.includes('Microsoft.ContainerService/managedClusters') ||
      r.includes('Microsoft.Databricks/workspaces') ||
      r.includes('Microsoft.Synapse/workspaces') ||
      r.includes('Microsoft.MachineLearningServices/workspaces')
    )
  );
  if (hasManagedRgServices) {
    warnings.push('Selected resource types (AKS, Databricks, Synapse, Azure ML) create managed resource groups whose inner resources cannot be tagged directly. The bundle\'s inheritance references mitigate this for any resources Azure does expose to policy.');
  }

  // Inheritance + size guidance (new in this version)
  const tagCount = allTags.length;
  if (tagCount > 0) {
    const totalRefs = tagCount * 5;
    warnings.push(
      `Initiative will contain ${totalRefs} policy references (${tagCount} enforcement + ${tagCount * 4} inheritance). Deploy at management-group scope for org-wide coverage, or subscription scope for narrower rollout.`
    );
    warnings.push(
      'Tag inheritance is baked in via 4 built-in policies per tag: RG always (cd3aa116…), RG if-missing (ea3f2387…), Sub always (b27a0cbd…), Sub if-missing (40df99da…). The "always" variants OVERWRITE explicit resource-level tag values. Review and remove references that conflict with your governance model before deploying.'
    );
  }

  // FOCUS export gap
  warnings.push('Note: Even with high tag compliance, Azure FOCUS cost exports may show untagged billing lines for managed-RG and platform resources. Consider subscription-naming-convention-based transformations in Power BI for full cost attribution coverage.');

  return warnings;
}
