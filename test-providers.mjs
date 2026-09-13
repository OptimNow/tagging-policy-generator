/**
 * Quick smoke test for GCP and Azure provider logic.
 * Run with: node test-providers.mjs
 *
 * Tests converter round-trips, validator rules, and template integrity.
 * Uses dynamic imports of the compiled TS (via tsx or esbuild).
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// We'll use esbuild to bundle the TS files for Node
// First, let's create a bundled test entry
const testEntry = `
import { getResourceCategories, getResourceTypes } from './types';
import { convertGcpPolicyToMcp, convertMcpToGcpPolicy, getGcpExportWarnings } from './services/gcp-converter';
import { convertAzurePolicyToMcp, convertMcpToAzurePolicy, getAzureExportWarnings } from './services/azure-converter';
import { validatePolicy } from './services/validator';
import { TEMPLATES } from './services/templates';
import { convertAwsPolicyToMcp, convertMcpToAwsPolicy, getAwsExportWarnings } from './services/converter';
import { tryParseNativePolicy } from './services/native-import';
import { readFileSync } from 'fs';

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    passed++;
    console.log('  PASS: ' + msg);
  } else {
    failed++;
    console.log('  FAIL: ' + msg);
  }
}

console.log('\\n========================================');
console.log('  GCP + Azure Provider Tests');
console.log('========================================\\n');

// ===== 1. Types / Resource Categories =====
console.log('--- 1. Resource Categories & Types ---');

const gcpCats = getResourceCategories('gcp');
const gcpTypes = getResourceTypes('gcp');
assert(gcpCats.length >= 7, 'GCP has >= 7 resource categories (got ' + gcpCats.length + ')');
assert(gcpTypes.length >= 30, 'GCP has >= 30 resource types (got ' + gcpTypes.length + ')');
assert(gcpTypes.every(t => t.includes('.googleapis.com/')), 'All GCP types use googleapis.com/ URI format');

const azureCats = getResourceCategories('azure');
const azureTypes = getResourceTypes('azure');
assert(azureCats.length >= 10, 'Azure has >= 10 resource categories (got ' + azureCats.length + ')');
assert(azureTypes.length >= 70, 'Azure has >= 70 resource types (got ' + azureTypes.length + ')');
assert(azureTypes.every(t => t.startsWith('Microsoft.')), 'All Azure types start with Microsoft.');

const awsCats = getResourceCategories('aws');
const awsTypes = getResourceTypes('aws');
assert(awsCats.length >= 5, 'AWS has >= 5 resource categories (got ' + awsCats.length + ')');
assert(awsTypes.length >= 25, 'AWS has >= 25 resource types (got ' + awsTypes.length + ')');

// No overlap between providers
const gcpSet = new Set(gcpTypes);
const azureSet = new Set(azureTypes);
const awsSet = new Set(awsTypes);
assert([...gcpSet].every(t => !azureSet.has(t)), 'No overlap between GCP and Azure resource types');
assert([...gcpSet].every(t => !awsSet.has(t)), 'No overlap between GCP and AWS resource types');
assert([...azureSet].every(t => !awsSet.has(t)), 'No overlap between Azure and AWS resource types');

// ===== 2. Templates =====
console.log('\\n--- 2. Templates ---');

const gcpTemplates = TEMPLATES.filter(t => t.provider === 'gcp');
const azureTemplates = TEMPLATES.filter(t => t.provider === 'azure');
const awsTemplates = TEMPLATES.filter(t => t.provider === 'aws');

assert(gcpTemplates.length === 4, 'GCP has 4 templates (got ' + gcpTemplates.length + ')');
assert(azureTemplates.length === 4, 'Azure has 4 templates (got ' + azureTemplates.length + ')');
assert(awsTemplates.length === 4, 'AWS has 4 templates (got ' + awsTemplates.length + ')');

// Verify template names match across providers
const expectedNames = ['Cost Allocation', 'Startup', 'Enterprise', 'Minimal Starter'];
for (const name of expectedNames) {
  assert(gcpTemplates.some(t => t.name === name), 'GCP has "' + name + '" template');
  assert(azureTemplates.some(t => t.name === name), 'Azure has "' + name + '" template');
}

// Verify Azure templates use Azure resource types
for (const tmpl of azureTemplates) {
  const policy = {
    version: '1.0',
    last_updated: new Date().toISOString(),
    cloud_provider: 'azure',
    tag_naming_rules: { case_sensitivity: false, allow_special_characters: false, max_key_length: 512, max_value_length: 256 },
    required_tags: tmpl.policy.required_tags || [],
    optional_tags: tmpl.policy.optional_tags || [],
  };
  const allResources = policy.required_tags.flatMap(t => t.applies_to || []);
  const invalidRes = allResources.filter(r => !azureSet.has(r));
  assert(invalidRes.length === 0, 'Azure template "' + tmpl.name + '" uses only valid Azure types' + (invalidRes.length > 0 ? ' (invalid: ' + invalidRes.join(', ') + ')' : ''));
}

// Verify GCP templates use GCP resource types
for (const tmpl of gcpTemplates) {
  const allResources = (tmpl.policy.required_tags || []).flatMap(t => t.applies_to || []);
  const invalidRes = allResources.filter(r => !gcpSet.has(r));
  assert(invalidRes.length === 0, 'GCP template "' + tmpl.name + '" uses only valid GCP types' + (invalidRes.length > 0 ? ' (invalid: ' + invalidRes.join(', ') + ')' : ''));
}

// ===== 3. GCP Converter =====
console.log('\\n--- 3. GCP Converter ---');

// GCP Import
const gcpPolicyJson = JSON.stringify({
  label_policy: {
    labels: {
      cost_center: {
        label_key: "cost_center",
        description: "Cost center for billing",
        allowed_values: ["eng", "sales"],
        enforced_for: ["compute.googleapis.com/Instance"],
        required: true
      },
      team: {
        label_key: "team",
        description: "Team name",
        allowed_values: null,
        enforced_for: [],
        required: false
      }
    },
    naming_rules: {
      max_key_length: 63,
      max_value_length: 63
    }
  }
});

try {
  const imported = convertGcpPolicyToMcp(gcpPolicyJson);
  assert(imported.cloud_provider === 'gcp', 'GCP import sets cloud_provider to gcp');
  assert(imported.required_tags.length === 1, 'GCP import: 1 required tag (got ' + imported.required_tags.length + ')');
  assert(imported.optional_tags.length === 1, 'GCP import: 1 optional tag (got ' + imported.optional_tags.length + ')');
  assert(imported.required_tags[0].name === 'cost_center', 'GCP import: required tag name = cost_center');
  assert(imported.required_tags[0].applies_to.includes('compute.googleapis.com/Instance'), 'GCP import: applies_to contains compute instance');
  assert(imported.tag_naming_rules.max_key_length === 63, 'GCP import: max_key_length = 63');
} catch (e) {
  failed++;
  console.log('  FAIL: GCP import threw: ' + e.message);
}

// GCP Export
const gcpTestPolicy = {
  version: '1.0',
  last_updated: new Date().toISOString(),
  cloud_provider: 'gcp',
  required_tags: [{
    name: 'cost_center',
    description: 'Cost center',
    allowed_values: ['eng', 'sales'],
    validation_regex: '^[a-z]+$',
    applies_to: ['compute.googleapis.com/Instance']
  }],
  optional_tags: [{
    name: 'team',
    description: 'Team name',
    allowed_values: null
  }],
  tag_naming_rules: { case_sensitivity: false, allow_special_characters: false, max_key_length: 63, max_value_length: 63 }
};

try {
  const exported = convertMcpToGcpPolicy(gcpTestPolicy);
  assert(exported.label_policy !== undefined, 'GCP export has label_policy wrapper');
  assert(exported.label_policy.labels.cost_center !== undefined, 'GCP export includes cost_center label');
  assert(exported.label_policy.labels.cost_center.required === true, 'GCP export: cost_center is required');
  assert(exported.label_policy.labels.team.required === false, 'GCP export: team is not required');
} catch (e) {
  failed++;
  console.log('  FAIL: GCP export threw: ' + e.message);
}

// GCP Export Warnings
const gcpWarnings = getGcpExportWarnings(gcpTestPolicy);
assert(gcpWarnings.limitations.some(w => w.toLowerCase().includes('regex')), 'GCP export warns about regex loss');

// GCP Round-trip
try {
  const exported = convertMcpToGcpPolicy(gcpTestPolicy);
  const reimported = convertGcpPolicyToMcp(JSON.stringify(exported));
  assert(reimported.required_tags[0].name === 'cost_center', 'GCP round-trip preserves tag name');
  assert(reimported.required_tags[0].allowed_values?.includes('eng'), 'GCP round-trip preserves allowed_values');
} catch (e) {
  failed++;
  console.log('  FAIL: GCP round-trip threw: ' + e.message);
}

// ===== 4. Azure Converter =====
console.log('\\n--- 4. Azure Converter ---');

// Azure Import from example file
const azureExamplePath = './examples/azure-policy-example.json';
try {
  const { readFileSync } = await import('fs');
  const azureExampleText = readFileSync(azureExamplePath, 'utf8');
  const imported = convertAzurePolicyToMcp(azureExampleText);
  assert(imported.cloud_provider === 'azure', 'Azure import sets cloud_provider to azure');
  assert(imported.required_tags.length >= 2, 'Azure import: >= 2 required tags (got ' + imported.required_tags.length + ')');
  assert(imported.optional_tags.length >= 1, 'Azure import: >= 1 optional tag (got ' + imported.optional_tags.length + ')');

  const costCenterTag = imported.required_tags.find(t => t.name === 'CostCenter');
  assert(costCenterTag !== undefined, 'Azure import: has CostCenter tag');

  const envTag = imported.required_tags.find(t => t.name === 'Environment');
  assert(envTag !== undefined, 'Azure import: has Environment tag');
  assert(envTag?.allowed_values?.length === 4, 'Azure import: Environment has 4 allowed values (got ' + (envTag?.allowed_values?.length || 0) + ')');

  const ownerTag = imported.optional_tags.find(t => t.name === 'Owner');
  assert(ownerTag !== undefined, 'Azure import: Owner is optional (audit effect)');

  assert(imported.tag_naming_rules.max_key_length === 512, 'Azure import: max_key_length = 512');
  assert(imported.tag_naming_rules.max_value_length === 256, 'Azure import: max_value_length = 256');
  const exampleErrors = validatePolicy(imported);
  assert(exampleErrors.length === 0, 'Azure import: example passes validation (got ' + exampleErrors.join('; ') + ')');
} catch (e) {
  failed++;
  console.log('  FAIL: Azure import from example threw: ' + e.message);
}

// Azure Export
const azureTestPolicy = {
  version: '1.0',
  last_updated: new Date().toISOString(),
  cloud_provider: 'azure',
  required_tags: [{
    name: 'CostCenter',
    description: 'Cost center for billing',
    allowed_values: ['Engineering', 'Sales'],
    validation_regex: '^CC-[0-9]+$',
    applies_to: ['Microsoft.Compute/virtualMachines']
  }],
  optional_tags: [{
    name: 'Team',
    description: 'Team name',
    allowed_values: null
  }],
  tag_naming_rules: { case_sensitivity: false, allow_special_characters: false, max_key_length: 512, max_value_length: 256 }
};

try {
  const exported = convertMcpToAzurePolicy(azureTestPolicy);

  // New ARM deployment template shape
  assert(typeof exported.$schema === 'string' && exported.$schema.includes('subscriptionDeploymentTemplate'), 'Azure export uses subscription-scope ARM template schema');
  assert(exported.contentVersion === '1.0.0.0', 'Azure export has contentVersion 1.0.0.0');
  assert(Array.isArray(exported.resources), 'Azure export has resources array');

  // Custom definitions: require-tag (always) + require-tag-and-value (CostCenter has allowed_values)
  const customDefs = exported.resources.filter(r => r.type === 'Microsoft.Authorization/policyDefinitions');
  assert(customDefs.length === 2, 'Azure export: 2 parametrized custom defs (with-values present, got ' + customDefs.length + ')');
  assert(customDefs.some(d => d.name === 'require-tag-on-resources'), 'Azure export: emits require-tag-on-resources');
  assert(customDefs.some(d => d.name === 'require-tag-and-value-on-resources'), 'Azure export: emits require-tag-and-value-on-resources');

  // Initiative
  const initiatives = exported.resources.filter(r => r.type === 'Microsoft.Authorization/policySetDefinitions');
  assert(initiatives.length === 1, 'Azure export: exactly 1 policy set definition');
  const initiative = initiatives[0];
  assert(Array.isArray(initiative.dependsOn) && initiative.dependsOn.length === 2, 'Azure export: initiative dependsOn lists both custom defs');

  const refs = initiative.properties.policyDefinitions;
  // 1 required (CostCenter) + 1 optional (Team) = 2 enforcement + 2 inheritance (RG if missing) = 4 refs
  assert(refs.length === 4, 'Azure export: 4 initiative references (2 enforcement + 2 inheritance, got ' + refs.length + ')');

  // Required tag becomes deny effect
  const costCenterRef = refs.find(r => r.policyDefinitionReferenceId === 'require-CostCenter-with-values');
  assert(costCenterRef !== undefined, 'Azure export: CostCenter enforcement reference exists');
  assert(costCenterRef?.parameters?.effect?.value === 'deny', 'Azure export: required tag uses deny effect');
  assert(costCenterRef?.parameters?.tagName?.value === 'CostCenter', 'Azure export: tagName param value is CostCenter');
  assert(Array.isArray(costCenterRef?.parameters?.allowedValues?.value) && costCenterRef.parameters.allowedValues.value.includes('Engineering'), 'Azure export: allowedValues param carries the values');
  assert(costCenterRef?.policyDefinitionId?.includes('require-tag-and-value-on-resources'), 'Azure export: CostCenter ref points to with-values custom def');

  // Optional tag becomes audit effect
  const teamRef = refs.find(r => r.policyDefinitionReferenceId === 'audit-Team');
  assert(teamRef !== undefined, 'Azure export: Team enforcement reference exists');
  assert(teamRef?.parameters?.effect?.value === 'audit', 'Azure export: optional tag uses audit effect');
  assert(teamRef?.policyDefinitionId?.includes('require-tag-on-resources'), 'Azure export: Team ref points to plain require-tag custom def (no allowed_values)');

  // Inheritance: only "Inherit a tag from the resource group if missing" (ea3f2387), one per tag
  for (const tagName of ['CostCenter', 'Team']) {
    const inheritRefs = refs.filter(r => !r.policyDefinitionId.startsWith('[') && r.parameters?.tagName?.value === tagName);
    assert(inheritRefs.length === 1 && inheritRefs[0].policyDefinitionId.endsWith('/ea3f2387-9b95-492a-a190-fcdc54f7b070'), 'Azure export: ' + tagName + ' has exactly one inheritance ref, RG if missing');
  }
  assert(!refs.some(r => /cd3aa116|b27a0cbd|40df99da/.test(r.policyDefinitionId)), 'Azure export: no overwrite or subscription inheritance refs');

  // Scope: the required tag carries its applies_to, the optional tag applies to all types
  assert(JSON.stringify(costCenterRef?.parameters?.resourceTypes?.value) === JSON.stringify(['Microsoft.Compute/virtualMachines']), 'Azure export: CostCenter resourceTypes = its applies_to');
  assert(Array.isArray(teamRef?.parameters?.resourceTypes?.value) && teamRef.parameters.resourceTypes.value.length === 0, 'Azure export: optional Team resourceTypes is empty (all types)');

  // ARM escaping: policy-rule expressions must reach Azure Policy unevaluated
  const ruleJson = JSON.stringify(customDefs.map(d => d.properties.policyRule));
  assert(ruleJson.includes("[[concat('tags['") && ruleJson.includes("[[parameters('effect')]") && !ruleJson.includes('"[concat('), 'Azure export: policy-rule expressions are escaped with [[ for ARM');
} catch (e) {
  failed++;
  console.log('  FAIL: Azure export threw: ' + e.message);
}

// Azure Export Warnings
const azureWarnings = getAzureExportWarnings(azureTestPolicy);
assert(azureWarnings.limitations.some(w => w.toLowerCase().includes('regex')), 'Azure export warns about regex loss (limitations)');
assert(azureWarnings.deploymentNotes.some(w => w.toLowerCase().includes('inheritance')), 'Azure export surfaces inheritance deployment note');
assert(azureWarnings.deploymentNotes.some(w => w.toLowerCase().includes('references')), 'Azure export surfaces reference-count deployment note');

// Azure Round-trip
try {
  const exported = convertMcpToAzurePolicy(azureTestPolicy);
  const reimported = convertAzurePolicyToMcp(JSON.stringify(exported));
  assert(reimported.required_tags.some(t => t.name === 'CostCenter'), 'Azure round-trip preserves CostCenter tag');
  const costCenter = reimported.required_tags.find(t => t.name === 'CostCenter');
  assert(costCenter?.allowed_values?.includes('Engineering'), 'Azure round-trip preserves allowed_values');
  assert(JSON.stringify(costCenter?.applies_to) === JSON.stringify(['Microsoft.Compute/virtualMachines']), 'Azure round-trip preserves applies_to');
  const reimportErrors = validatePolicy(reimported);
  assert(reimportErrors.length === 0, 'Azure round-trip result passes validation (got ' + reimportErrors.join('; ') + ')');
} catch (e) {
  failed++;
  console.log('  FAIL: Azure round-trip threw: ' + e.message);
}

// Legacy bundle (exported before resourceTypes existed): old inheritance refs skipped, applies_to = every Azure type
try {
  const legacy = { resources: [{ type: 'Microsoft.Authorization/policySetDefinitions', properties: { policyDefinitions: [
    { policyDefinitionReferenceId: 'require-CostCenter', policyDefinitionId: 'x', parameters: { tagName: { value: 'CostCenter' }, effect: { value: 'deny' } } },
    { policyDefinitionReferenceId: 'CostCenter-inherit-from-sub', policyDefinitionId: '/providers/Microsoft.Authorization/policyDefinitions/b27a0cbd-a167-4064-ae47-28c309da4a4f', parameters: { tagName: { value: 'CostCenter' } } }
  ] } }] };
  const legacyImported = convertAzurePolicyToMcp(JSON.stringify(legacy));
  assert(legacyImported.required_tags.length === 1 && legacyImported.optional_tags.length === 0, 'Azure legacy import: old inheritance GUIDs are skipped, not imported as tags');
  assert(legacyImported.required_tags[0].applies_to.length === azureTypes.length, 'Azure legacy import: applies_to defaults to every Azure resource type');
  assert(validatePolicy(legacyImported).length === 0, 'Azure legacy import passes validation');
} catch (e) {
  failed++;
  console.log('  FAIL: Azure legacy import threw: ' + e.message);
}

// ===== 4b. AWS Converter =====
console.log('\\n--- 4b. AWS Converter ---');

const awsBase = { version: '1.0', last_updated: new Date().toISOString(), cloud_provider: 'aws', optional_tags: [], tag_naming_rules: { case_sensitivity: false, allow_special_characters: false, max_key_length: 128, max_value_length: 256 } };

const awsVpc = convertMcpToAwsPolicy({ ...awsBase, required_tags: [{ name: 'CostCenter', description: 'd', allowed_values: null, validation_regex: null, applies_to: ['ec2:vpc'] }] });
assert(JSON.stringify(awsVpc.tags.CostCenter.enforced_for?.['@@assign']) === JSON.stringify(['ec2:vpc']), 'AWS export: ec2:vpc is enforced on its own, not as ec2:ALL_SUPPORTED');

const awsRdsPolicy = { ...awsBase, required_tags: [{ name: 'Owner', description: 'd', allowed_values: null, validation_regex: null, applies_to: ['rds:db', 'ec2:instance'] }] };
const awsRds = convertMcpToAwsPolicy(awsRdsPolicy);
const awsRdsEnforced = awsRds.tags.Owner.enforced_for?.['@@assign'] || [];
assert(awsRdsEnforced.includes('rds:ALL_SUPPORTED') && awsRdsEnforced.includes('ec2:instance') && !awsRdsEnforced.includes('ec2:ALL_SUPPORTED'), 'AWS export: rds:db uses rds:ALL_SUPPORTED, ec2:instance stays specific');
assert(getAwsExportWarnings(awsRdsPolicy).limitations.some(w => w.includes('rds:ALL_SUPPORTED')), 'AWS export warns about the RDS widening');

const awsMixPolicy = { ...awsBase, required_tags: [{ name: 'Team', description: 'd', allowed_values: null, validation_regex: null, applies_to: ['elasticloadbalancing:loadbalancer', 'fsx:file-system', 'sagemaker:endpoint'] }] };
const awsMix = convertMcpToAwsPolicy(awsMixPolicy);
assert(JSON.stringify(awsMix.tags.Team.enforced_for?.['@@assign']) === JSON.stringify(['elasticloadbalancing:loadbalancer', 'fsx:file-system']), 'AWS export: ELB and FSx are enforced');
assert(getAwsExportWarnings(awsMixPolicy).limitations.some(w => w.includes('sagemaker:endpoint')), 'AWS export warns that sagemaker:endpoint is reported, not enforced');

const onlyReportPolicy = { ...awsBase, required_tags: [{ name: 'Project', description: 'd', allowed_values: null, validation_regex: null, applies_to: ['sagemaker:endpoint', 'glue:job'] }] };
const onlyReportBack = convertAwsPolicyToMcp(JSON.stringify(convertMcpToAwsPolicy(onlyReportPolicy)));
assert(onlyReportBack.required_tags.length === 1 && JSON.stringify(onlyReportBack.required_tags[0].applies_to) === JSON.stringify(['sagemaker:endpoint', 'glue:job']), 'AWS round-trip: report-only tag stays required with its applies_to');

for (const tmpl of TEMPLATES.filter(t => t.provider === 'aws')) {
  const p = { ...awsBase, required_tags: tmpl.policy.required_tags || [], optional_tags: tmpl.policy.optional_tags || [] };
  const back = convertAwsPolicyToMcp(JSON.stringify(convertMcpToAwsPolicy(p)));
  const sameScope = p.required_tags.every(t => {
    const b = back.required_tags.find(x => x.name === t.name);
    return b && JSON.stringify([...b.applies_to].sort()) === JSON.stringify([...t.applies_to].sort());
  });
  assert(sameScope && back.optional_tags.length === p.optional_tags.length && validatePolicy(back).length === 0, 'AWS round-trip: "' + tmpl.name + '" template keeps every tag and scope and stays valid');
}

for (const file of ['aws-policy-example.json', 'aws-import-test.json']) {
  try {
    const awsImported = convertAwsPolicyToMcp(readFileSync('./examples/' + file, 'utf8'));
    const errs = validatePolicy(awsImported);
    assert(errs.length === 0, 'AWS import: ' + file + ' passes validation (got ' + errs.join('; ') + ')');
  } catch (e) {
    failed++;
    console.log('  FAIL: AWS import of ' + file + ' threw: ' + e.message);
  }
}

let awsRejected = false;
try { convertAwsPolicyToMcp(JSON.stringify({ hello: 'world' })); } catch (e) { awsRejected = true; }
assert(awsRejected, 'AWS import rejects JSON without a tags object instead of returning an empty policy');

// ===== 4c. Native JSON reload =====
console.log('\\n--- 4c. Native JSON reload ---');
for (const file of ['startup-policy.json', 'enterprise-policy.json']) {
  const native = tryParseNativePolicy(readFileSync('./examples/' + file, 'utf8'));
  assert(native !== null && native.cloud_provider === 'aws' && native.required_tags.length > 0, 'Native import recognises ' + file);
  const errs = native ? validatePolicy(native) : ['not parsed'];
  assert(errs.length === 0, 'Native import: ' + file + ' passes validation (got ' + errs.join('; ') + ')');
}
assert(tryParseNativePolicy(readFileSync('./examples/aws-policy-example.json', 'utf8')) === null, 'Native import ignores an AWS tag policy');
const nativeGcp = tryParseNativePolicy(JSON.stringify({ cloud_provider: 'gcp', required_tags: [{ name: 'team', description: 'd', applies_to: ['compute.googleapis.com/Instance'] }] }));
assert(nativeGcp !== null && nativeGcp.cloud_provider === 'gcp' && nativeGcp.tag_naming_rules.max_key_length === 63, 'Native import keeps the provider and fills its default naming rules');

// ===== 5. Validator =====
console.log('\\n--- 5. Validator ---');

// GCP validation: lowercase key requirement
const gcpBadKeyPolicy = {
  version: '1.0',
  last_updated: new Date().toISOString(),
  cloud_provider: 'gcp',
  required_tags: [{
    name: 'CostCenter',
    description: 'Cost center',
    allowed_values: null,
    validation_regex: null,
    applies_to: ['compute.googleapis.com/Instance']
  }],
  optional_tags: [],
  tag_naming_rules: { case_sensitivity: false, allow_special_characters: false, max_key_length: 63, max_value_length: 63 }
};
const gcpErrors = validatePolicy(gcpBadKeyPolicy);
assert(gcpErrors.some(e => e.includes('lowercase')), 'GCP validator catches uppercase key name "CostCenter"');

// GCP validation: key too long
const gcpLongKeyPolicy = {
  ...gcpBadKeyPolicy,
  required_tags: [{
    name: 'a'.repeat(64),
    description: 'Long key',
    allowed_values: null,
    validation_regex: null,
    applies_to: ['compute.googleapis.com/Instance']
  }],
  tag_naming_rules: { case_sensitivity: false, allow_special_characters: false, max_key_length: 64, max_value_length: 63 }
};
const gcpLongErrors = validatePolicy(gcpLongKeyPolicy);
assert(gcpLongErrors.some(e => e.includes('63 characters')), 'GCP validator catches key > 63 chars');

// Azure validation: forbidden characters
const azureForbiddenPolicy = {
  version: '1.0',
  last_updated: new Date().toISOString(),
  cloud_provider: 'azure',
  required_tags: [{
    name: 'Cost<Center>',
    description: 'Bad chars',
    allowed_values: null,
    validation_regex: null,
    applies_to: ['Microsoft.Compute/virtualMachines']
  }],
  optional_tags: [],
  tag_naming_rules: { case_sensitivity: false, allow_special_characters: false, max_key_length: 512, max_value_length: 256 }
};
const azureForbiddenErrors = validatePolicy(azureForbiddenPolicy);
assert(azureForbiddenErrors.some(e => e.includes('cannot contain')), 'Azure validator catches forbidden chars < >');

// Azure validation: reserved prefix
const azureReservedPolicy = {
  ...azureForbiddenPolicy,
  required_tags: [{
    name: 'microsoftTeam',
    description: 'Reserved prefix',
    allowed_values: null,
    validation_regex: null,
    applies_to: ['Microsoft.Compute/virtualMachines']
  }]
};
const azureReservedErrors = validatePolicy(azureReservedPolicy);
assert(azureReservedErrors.some(e => e.includes('reserved prefixes')), 'Azure validator catches reserved prefix "microsoft"');

// Azure validation: value length limit
const azureValueLenPolicy = {
  ...azureForbiddenPolicy,
  required_tags: [{
    name: 'CostCenter',
    description: 'OK tag',
    allowed_values: null,
    validation_regex: null,
    applies_to: ['Microsoft.Compute/virtualMachines']
  }],
  tag_naming_rules: { case_sensitivity: false, allow_special_characters: false, max_key_length: 512, max_value_length: 300 }
};
const azureValueErrors = validatePolicy(azureValueLenPolicy);
assert(azureValueErrors.some(e => e.includes('256')), 'Azure validator catches max_value_length > 256');

// Azure validation: valid policy should pass
const azureValidPolicy = {
  version: '1.0',
  last_updated: new Date().toISOString(),
  cloud_provider: 'azure',
  required_tags: [{
    name: 'CostCenter',
    description: 'Cost center for billing',
    allowed_values: ['Engineering', 'Sales'],
    validation_regex: null,
    applies_to: ['Microsoft.Compute/virtualMachines']
  }],
  optional_tags: [],
  tag_naming_rules: { case_sensitivity: false, allow_special_characters: false, max_key_length: 512, max_value_length: 256 }
};
const azureValidErrors = validatePolicy(azureValidPolicy);
assert(azureValidErrors.length === 0, 'Azure valid policy passes validation (got ' + azureValidErrors.length + ' errors: ' + azureValidErrors.join('; ') + ')');

// Cross-provider: Azure types rejected for GCP
const crossProviderPolicy = {
  version: '1.0',
  last_updated: new Date().toISOString(),
  cloud_provider: 'gcp',
  required_tags: [{
    name: 'costcenter',
    description: 'Wrong types',
    allowed_values: null,
    validation_regex: null,
    applies_to: ['Microsoft.Compute/virtualMachines']
  }],
  optional_tags: [],
  tag_naming_rules: { case_sensitivity: false, allow_special_characters: false, max_key_length: 63, max_value_length: 63 }
};
const crossErrors = validatePolicy(crossProviderPolicy);
assert(crossErrors.some(e => e.includes('Invalid resource types')), 'Validator catches Azure types used with GCP provider');

// ===== 6. Template Validation =====
console.log('\\n--- 6. Template Validation (all 12 templates) ---');

for (const tmpl of TEMPLATES) {
  const policy = {
    version: '1.0',
    last_updated: new Date().toISOString(),
    cloud_provider: tmpl.policy.cloud_provider || tmpl.provider,
    required_tags: tmpl.policy.required_tags || [],
    optional_tags: tmpl.policy.optional_tags || [],
    tag_naming_rules: tmpl.provider === 'gcp'
      ? { case_sensitivity: false, allow_special_characters: false, max_key_length: 63, max_value_length: 63 }
      : tmpl.provider === 'azure'
        ? { case_sensitivity: false, allow_special_characters: false, max_key_length: 512, max_value_length: 256 }
        : { case_sensitivity: false, allow_special_characters: false, max_key_length: 128, max_value_length: 256 }
  };
  const errors = validatePolicy(policy);
  assert(errors.length === 0, tmpl.provider.toUpperCase() + ' "' + tmpl.name + '" template passes validation' + (errors.length > 0 ? ' (' + errors.join('; ') + ')' : ''));
}

// ===== Summary =====
console.log('\\n========================================');
console.log('  Results: ' + passed + ' passed, ' + failed + ' failed');
console.log('========================================\\n');

process.exit(failed > 0 ? 1 : 0);
`;

fs.writeFileSync('_test_entry.ts', testEntry);

// Use npx tsx to run the TS file directly
try {
  const result = execSync('npx tsx _test_entry.ts', {
    encoding: 'utf8',
    cwd: process.cwd(),
    timeout: 30000
  });
  console.log(result);
} catch (e) {
  console.log(e.stdout || '');
  console.error(e.stderr || '');
  process.exit(1);
} finally {
  // Cleanup
  try { fs.unlinkSync('_test_entry.ts'); } catch {}
}
