import { Policy, RequiredTag, OptionalTag, CategorizedExportWarnings, AZURE_RESOURCE_TYPES } from '../types';

// ---------------------------------------------------------------------------
// ARM deployment template shapes (export target)
// ---------------------------------------------------------------------------

interface ArmParameterDefinition {
  type: 'String' | 'Array' | 'Object' | 'Boolean' | 'Integer';
  metadata: { displayName: string; description: string };
  defaultValue?: string | string[] | number | boolean;
  allowedValues?: string[];
}

interface PolicyRule {
  if: Record<string, unknown>;
  then: { effect: string };
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
    policyRule: PolicyRule;
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

const GENERATED_BY = 'OptimNow Tagging Policy Generator';
const CUSTOM_DEF_REQUIRE_TAG = 'require-tag-on-resources';
const CUSTOM_DEF_REQUIRE_TAG_AND_VALUE = 'require-tag-and-value-on-resources';
const INITIATIVE_NAME = 'tagging-governance-initiative';
// Bumped when the custom definitions change shape (2.0.0 added resourceTypes).
const DEFINITION_VERSION = '2.0.0';

// Subscription-scope ARM template schema. It is required because the template
// contains policyDefinitions and policySetDefinitions, which can't be deployed
// at resource-group scope. A management-group deployment would need the
// managementGroupDeploymentTemplate.json schema and extensionResourceId()
// references instead of resourceId(), which this export does not produce.
const ARM_TEMPLATE_SCHEMA = 'https://schema.management.azure.com/schemas/2018-05-01/subscriptionDeploymentTemplate.json#';

// Built-in "Inherit a tag from the resource group if missing" (Modify, 'add').
// It is the only inheritance policy the bundle emits. The 'addOrReplace'
// variants overwrite values set on resources. Pairing it with the subscription
// variant makes two Modify policies write the same tag, which Azure denies as a
// conflict by default.
const INHERIT_FROM_RG_IF_MISSING = {
  guid: 'ea3f2387-9b95-492a-a190-fcdc54f7b070',
  refIdSuffix: 'inherit-from-rg-if-missing',
};

// Every tag-inheritance built-in this tool has referenced, including two IDs
// that versions before September 2026 emitted with wrong tails. The importer
// skips references to all of them: they are scaffolding, not user tags.
const KNOWN_INHERITANCE_GUIDS = [
  'ea3f2387-9b95-492a-a190-fcdc54f7b070', // resource group, if missing
  'cd3aa116-8754-49c9-a813-ad46512ece54', // resource group, add or replace
  'b27a0cbd-a167-4dfa-ae64-4337be671140', // subscription, add or replace
  '40df99da-1232-49b1-a39a-6da8d878f469', // subscription, if missing
  'b27a0cbd-a167-4064-ae47-28c309da4a4f', // wrong ID emitted by older versions
  '40df99da-1232-49b1-a39a-6571f4e27e24', // wrong ID emitted by older versions
];

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

// Distinct tag names can sanitise to the same ID ("Cost Center", "Cost-Center"),
// and ARM rejects an initiative with duplicate reference IDs. Suffix repeats.
function uniqueReferenceId(base: string, used: Set<string>): string {
  const clean = sanitizeReferenceId(base);
  let candidate = clean;
  for (let n = 2; used.has(candidate.toLowerCase()); n++) {
    const suffix = `-${n}`;
    candidate = clean.slice(0, 128 - suffix.length) + suffix;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

function customDefResourceIdExpression(name: string): string {
  return `[resourceId('Microsoft.Authorization/policyDefinitions', '${name}')]`;
}

function builtinPolicyDefinitionId(guid: string): string {
  return `/providers/Microsoft.Authorization/policyDefinitions/${guid}`;
}

// ARM evaluates every string that starts with '[' and ends with ']' as a
// template expression at deployment time. Policy-rule expressions such as
// "[parameters('effect')]" must reach Azure Policy unevaluated, and so must
// user values that happen to look like one ("[Unassigned]"). A second leading
// bracket tells ARM to keep the string literal and drop that bracket.
function escapeForArm(value: string): string {
  return value.startsWith('[') && value.endsWith(']') ? `[${value}` : value;
}

function unescapeFromArm(value: string): string {
  return value.startsWith('[[') ? value.slice(1) : value;
}

// ---------------------------------------------------------------------------
// Policy rule and parameters (shared by the ARM bundle and the portal snippet)
// ---------------------------------------------------------------------------

const TAG_FIELD = "[concat('tags[', parameters('tagName'), ']')]";

// The rule applies to the resource types listed in the resourceTypes parameter,
// or to every taggable type when that list is empty. It fires when the tag is
// missing or, with allowed values, when its value is not in the list.
// forArm escapes the expressions for embedding in an ARM template.
function buildPolicyRule(withValues: boolean, effect: string, forArm: boolean): PolicyRule {
  const x = (s: string) => (forArm ? escapeForArm(s) : s);
  const tagCondition = withValues
    ? {
        anyOf: [
          { field: x(TAG_FIELD), exists: 'false' },
          { field: x(TAG_FIELD), notIn: x("[parameters('allowedValues')]") },
        ],
      }
    : { field: x(TAG_FIELD), exists: 'false' };
  return {
    if: {
      allOf: [
        {
          anyOf: [
            { value: x("[length(parameters('resourceTypes'))]"), equals: 0 },
            { field: 'type', in: x("[parameters('resourceTypes')]") },
          ],
        },
        tagCondition,
      ],
    },
    then: { effect: x(effect) },
  };
}

function tagNameParameter(description: string): ArmParameterDefinition {
  return { type: 'String', metadata: { displayName: 'Tag Name', description } };
}

function resourceTypesParameter(): ArmParameterDefinition {
  return {
    type: 'Array',
    metadata: {
      displayName: 'Resource Types',
      description: 'Resource types the rule applies to, for example Microsoft.Compute/virtualMachines. Leave empty to apply the rule to every taggable resource type.',
    },
    defaultValue: [],
  };
}

function allowedValuesParameter(): ArmParameterDefinition {
  return { type: 'Array', metadata: { displayName: 'Allowed Values', description: 'List of allowed tag values.' } };
}

function effectParameter(description: string): ArmParameterDefinition {
  return {
    type: 'String',
    metadata: { displayName: 'Effect', description },
    allowedValues: ['audit', 'deny', 'disabled'],
    defaultValue: 'deny',
  };
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
      description: 'Requires that a tag with the specified name be present on resources of the listed types, or on every taggable resource when the list is empty. The effect parameter controls whether non-compliant resources are denied or audited.',
      metadata: { category: 'Tags', version: DEFINITION_VERSION, generatedBy: GENERATED_BY },
      parameters: {
        tagName: tagNameParameter('Name of the tag whose presence is required.'),
        resourceTypes: resourceTypesParameter(),
        effect: effectParameter('Enforcement effect when the tag is missing.'),
      },
      policyRule: buildPolicyRule(false, "[parameters('effect')]", true),
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
      description: 'Requires that a tag with the specified name be present on resources of the listed types, or on every taggable resource when the list is empty, and that its value belong to an allowed list. The effect parameter controls whether non-compliant resources are denied or audited.',
      metadata: { category: 'Tags', version: DEFINITION_VERSION, generatedBy: GENERATED_BY },
      parameters: {
        tagName: tagNameParameter('Name of the tag to enforce.'),
        allowedValues: allowedValuesParameter(),
        resourceTypes: resourceTypesParameter(),
        effect: effectParameter('Enforcement effect when the tag is missing or its value is not in the allowed list.'),
      },
      policyRule: buildPolicyRule(true, "[parameters('effect')]", true),
    },
  };
}

// ---------------------------------------------------------------------------
// Builders: initiative references
// ---------------------------------------------------------------------------

function buildEnforcementReference(
  tag: RequiredTag | OptionalTag,
  effect: 'deny' | 'audit',
  resourceTypes: string[],
  usedIds: Set<string>
): AzurePolicyReference {
  const hasAllowedValues = !!(tag.allowed_values && tag.allowed_values.length > 0);
  const customDefName = hasAllowedValues ? CUSTOM_DEF_REQUIRE_TAG_AND_VALUE : CUSTOM_DEF_REQUIRE_TAG;
  const verb = effect === 'deny' ? 'require' : 'audit';

  const parameters: AzurePolicyReference['parameters'] = {
    tagName: { value: escapeForArm(tag.name) },
    effect: { value: effect },
    resourceTypes: { value: resourceTypes.map(escapeForArm) },
  };
  if (hasAllowedValues) {
    parameters.allowedValues = { value: (tag.allowed_values as string[]).map(escapeForArm) };
  }

  return {
    policyDefinitionReferenceId: uniqueReferenceId(`${verb}-${tag.name}${hasAllowedValues ? '-with-values' : ''}`, usedIds),
    policyDefinitionId: customDefResourceIdExpression(customDefName),
    parameters,
  };
}

function buildInheritanceReference(tagName: string, usedIds: Set<string>): AzurePolicyReference {
  return {
    policyDefinitionReferenceId: uniqueReferenceId(`${tagName}-${INHERIT_FROM_RG_IF_MISSING.refIdSuffix}`, usedIds),
    policyDefinitionId: builtinPolicyDefinitionId(INHERIT_FROM_RG_IF_MISSING.guid),
    parameters: {
      tagName: { value: escapeForArm(tagName) },
    },
  };
}

// ---------------------------------------------------------------------------
// Export: MCP Policy -> ARM deployment template
// ---------------------------------------------------------------------------

export function convertMcpToAzurePolicy(policy: Policy): AzureArmTemplate {
  // Required tags are denied on their selected resource types. Optional tags
  // have no resource list in the policy model, so they are audited everywhere.
  const allTags: Array<{ tag: RequiredTag | OptionalTag; effect: 'deny' | 'audit'; resourceTypes: string[] }> = [
    ...(policy.required_tags || []).map(tag => ({ tag, effect: 'deny' as const, resourceTypes: tag.applies_to || [] })),
    ...(policy.optional_tags || []).map(tag => ({ tag, effect: 'audit' as const, resourceTypes: [] as string[] })),
  ];

  const anyTagUsesAllowedValues = allTags.some(
    ({ tag }) => tag.allowed_values && tag.allowed_values.length > 0
  );

  const resources: AzureResource[] = [buildRequireTagDefinition()];
  if (anyTagUsesAllowedValues) {
    resources.push(buildRequireTagAndValueDefinition());
  }

  // Initiative references: one rule per tag, then one inheritance policy per tag.
  const usedIds = new Set<string>();
  const enforcementRefs = allTags.map(({ tag, effect, resourceTypes }) =>
    buildEnforcementReference(tag, effect, resourceTypes, usedIds)
  );
  const inheritanceRefs = allTags.map(({ tag }) => buildInheritanceReference(tag.name, usedIds));

  const initiativeDependsOn: string[] = [customDefResourceIdExpression(CUSTOM_DEF_REQUIRE_TAG)];
  if (anyTagUsesAllowedValues) {
    initiativeDependsOn.push(customDefResourceIdExpression(CUSTOM_DEF_REQUIRE_TAG_AND_VALUE));
  }

  resources.push({
    type: 'Microsoft.Authorization/policySetDefinitions',
    apiVersion: '2021-06-01',
    name: INITIATIVE_NAME,
    dependsOn: initiativeDependsOn,
    properties: {
      displayName: 'Tagging Governance Initiative',
      policyType: 'Custom',
      description: 'Enforces required tags on their selected resource types, audits optional tags, and fills missing tags from the resource group. Generated by OptimNow Tagging Policy Generator.',
      metadata: {
        category: 'Tags',
        version: policy.version,
        generatedBy: GENERATED_BY,
      },
      policyDefinitions: [...enforcementRefs, ...inheritanceRefs],
    },
  });

  return {
    $schema: ARM_TEMPLATE_SCHEMA,
    contentVersion: '1.0.0.0',
    metadata: {
      generatedBy: GENERATED_BY,
      policyVersion: policy.version,
      deploymentScope: 'subscription',
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
  if (!parsed || typeof parsed !== 'object') {
    throw new Error(LEGACY_FORMAT_ERROR);
  }

  const policySetProperties = locatePolicySetProperties(parsed);
  if (!policySetProperties) {
    throw new Error(LEGACY_FORMAT_ERROR);
  }

  const requiredTags: RequiredTag[] = [];
  const optionalTags: OptionalTag[] = [];
  const seenTagNames = new Set<string>();

  for (const ref of policySetProperties.policyDefinitions) {
    if (!ref || typeof ref !== 'object') continue;
    const refObj = ref as Record<string, unknown>;
    const definitionId = typeof refObj.policyDefinitionId === 'string' ? refObj.policyDefinitionId : '';
    if (referencesBuiltinInheritance(definitionId)) continue;  // scaffolding, not user intent

    const parameters = (refObj.parameters as Record<string, { value?: unknown }> | undefined) || {};
    const tagNameValue = parameters.tagName?.value;
    if (typeof tagNameValue !== 'string' || tagNameValue.length === 0) continue;
    const tagName = unescapeFromArm(tagNameValue);
    if (seenTagNames.has(tagName.toLowerCase())) continue;
    seenTagNames.add(tagName.toLowerCase());

    const effectValue = parameters.effect?.value;
    const effect = typeof effectValue === 'string' ? effectValue.toLowerCase() : 'deny';

    const allowedValuesRaw = parameters.allowedValues?.value;
    const allowedValues = Array.isArray(allowedValuesRaw)
      ? allowedValuesRaw.filter((v): v is string => typeof v === 'string').map(unescapeFromArm)
      : [];

    const refIdRaw = refObj.policyDefinitionReferenceId;
    const description = typeof refIdRaw === 'string' && refIdRaw.length > 0
      ? `Imported from ${refIdRaw}`
      : `Imported tag ${tagName}`;

    if (effect === 'audit') {
      optionalTags.push({
        name: tagName,
        description,
        allowed_values: allowedValues.length > 0 ? allowedValues : null,
      });
    } else {
      const resourceTypesRaw = parameters.resourceTypes?.value;
      const resourceTypes = Array.isArray(resourceTypesRaw)
        ? resourceTypesRaw.filter((v): v is string => typeof v === 'string').map(unescapeFromArm)
        : [];
      requiredTags.push({
        name: tagName,
        description,
        allowed_values: allowedValues.length > 0 ? allowedValues : null,
        validation_regex: null,
        // An empty or missing list means "every taggable type": that is how the
        // rule behaves, and how bundles exported before resourceTypes existed
        // behaved. The editor represents it as the full Azure catalogue.
        applies_to: resourceTypes.length > 0 ? resourceTypes : [...AZURE_RESOURCE_TYPES],
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
      const r = (resource || {}) as Record<string, unknown>;
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
  const id = policyDefinitionId.toLowerCase();
  return KNOWN_INHERITANCE_GUIDS.some(guid => id.includes(guid));
}

// ---------------------------------------------------------------------------
// Single-tag portal-paste helper (used by the TagForm "Azure JSON" button)
// ---------------------------------------------------------------------------

// Generates Azure Portal-ready JSON for a single tag definition, pasted into the
// Portal's policy rule editor: mode, parameters, policyRule. Expressions are not
// escaped because the Portal passes them to Azure Policy directly. The
// description argument is kept for callers; the Portal takes the description in
// a separate field.
export function generateAzurePortalJson(
  tagName: string,
  description: string,
  effect: string,
  allowedValues: string[] | null,
  resourceTypes: string[] = []
): Record<string, unknown> {
  const withValues = !!(allowedValues && allowedValues.length > 0);
  const parameters: Record<string, { type: string; metadata: { displayName: string; description: string }; defaultValue: string | string[] }> = {
    tagName: {
      type: 'String',
      metadata: { displayName: 'Tag Name', description: 'Name of the tag to enforce' },
      defaultValue: tagName,
    },
    resourceTypes: {
      type: 'Array',
      metadata: { displayName: 'Resource Types', description: 'Resource types the rule applies to. Leave empty to apply it to every taggable resource type.' },
      defaultValue: resourceTypes,
    },
  };
  if (withValues) {
    parameters.allowedValues = {
      type: 'Array',
      metadata: { displayName: 'Allowed Values', description: 'List of allowed tag values' },
      defaultValue: allowedValues as string[],
    };
  }

  return {
    mode: 'Indexed',
    parameters,
    policyRule: buildPolicyRule(withValues, effect, false),
  };
}

// ---------------------------------------------------------------------------
// Export warnings
// ---------------------------------------------------------------------------

export function getAzureExportWarnings(policy: Policy): CategorizedExportWarnings {
  const limitations: string[] = [];
  const deploymentNotes: string[] = [];
  const requiredTags = policy.required_tags || [];
  const allTags = [...requiredTags, ...(policy.optional_tags || [])];

  // --- Limitations: feature loss when converting to Azure format ---

  const tagsWithRegex = requiredTags.filter(t => t.validation_regex);
  if (tagsWithRegex.length > 0) {
    const tagNames = tagsWithRegex.map(t => t.name).join(', ');
    limitations.push(`Regex validation will be dropped for ${tagNames}. Azure Policy has no regex support — use allowedValues instead, or chain a Match() condition in a custom policy.`);
  }

  if (allTags.some(t => t.description)) {
    limitations.push('Tag descriptions are not included in the bundle, because an Azure initiative has no field for them. Keep the JSON or Markdown export as the reference for what each tag means.');
  }

  const longNames = allTags.filter(t => t.name.length > 512);
  if (longNames.length > 0) {
    limitations.push(`Tag names exceed Azure's 512-character limit: ${longNames.map(t => t.name).join(', ')}.`);
  }

  const reservedPrefixHits = allTags.filter(t =>
    AZURE_RESERVED_TAG_PREFIXES.some(p => t.name.toLowerCase().startsWith(p))
  );
  if (reservedPrefixHits.length > 0) {
    limitations.push(`Tag names use Azure reserved prefixes (microsoft/azure/windows): ${reservedPrefixHits.map(t => t.name).join(', ')}. Azure will reject these.`);
  }

  if (allTags.length > 50) {
    limitations.push(`Your policy defines ${allTags.length} tags but Azure resources accept a maximum of 50 tags each.`);
  }

  const hasStorageResources = requiredTags.some(t =>
    t.applies_to?.some(r => r.includes('Microsoft.Storage'))
  );
  if (hasStorageResources) {
    const longStorageNames = allTags.filter(t => t.name.length > 128);
    if (longStorageNames.length > 0) {
      limitations.push(`Storage accounts cap tag names at 128 characters. These exceed it: ${longStorageNames.map(t => t.name).join(', ')}.`);
    }
  }

  // --- Deployment notes: operational guidance for the generated bundle ---

  const hasManagedRgServices = requiredTags.some(t =>
    t.applies_to?.some(r =>
      r.includes('Microsoft.ContainerService/managedClusters') ||
      r.includes('Microsoft.Databricks/workspaces') ||
      r.includes('Microsoft.Synapse/workspaces') ||
      r.includes('Microsoft.MachineLearningServices/workspaces')
    )
  );
  if (hasManagedRgServices) {
    deploymentNotes.push('You target AKS, Databricks, Synapse, or Azure ML. These create managed resource groups whose inner resources you cannot tag directly, so expect gaps in those groups.');
  }

  if (allTags.length > 0) {
    deploymentNotes.push(
      `The initiative contains ${allTags.length * 2} references: one tag rule and one inheritance policy per tag. Deploy it at subscription scope with az deployment sub create, then assign the initiative. Management-group deployment needs the management-group schema and extensionResourceId() references, which this bundle does not include.`
    );
    deploymentNotes.push(
      'Required tags are denied only on the resource types selected for each tag. Optional tags are audited on every taggable resource type.'
    );
    deploymentNotes.push(
      'Missing tags are copied from the resource group by the built-in policy "Inherit a tag from the resource group if missing" (ea3f2387…). It never overwrites a value set on a resource. Give the initiative assignment a managed identity with the Tag Contributor role, and run a remediation task to fill tags on existing resources.'
    );
  }

  deploymentNotes.push('Azure FOCUS cost exports may still show untagged billing lines for managed-RG and platform resources even at full tag compliance. Layer on subscription-naming-convention transformations in Power BI for full cost attribution coverage.');

  return { limitations, deploymentNotes };
}
