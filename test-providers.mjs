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
assert(gcpWarnings.some(w => w.toLowerCase().includes('regex')), 'GCP export warns about regex loss');

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
  const defs = exported.properties?.policyDefinitions;
  assert(defs !== undefined, 'Azure export has policyDefinitions array');
  assert(defs.length >= 2, 'Azure export: >= 2 policy definitions (got ' + defs.length + ')');
  assert(exported.tagInheritanceRecommendations !== undefined, 'Azure export includes tagInheritanceRecommendations');
  assert(exported.managedResourceGroupNotes !== undefined, 'Azure export includes managedResourceGroupNotes');

  // Check that required tag becomes deny effect
  const costCenterDef = defs.find(d =>
    d.policyDefinition?.properties?.parameters?.tagName?.defaultValue === 'CostCenter'
  );
  assert(costCenterDef !== undefined, 'Azure export: CostCenter policy definition exists');
  assert(costCenterDef?.policyDefinition?.properties?.policyRule?.then?.effect === 'deny', 'Azure export: required tag uses deny effect');

  // Check that optional tag becomes audit effect
  const teamDef = defs.find(d =>
    d.policyDefinition?.properties?.parameters?.tagName?.defaultValue === 'Team'
  );
  assert(teamDef !== undefined, 'Azure export: Team policy definition exists');
  assert(teamDef?.policyDefinition?.properties?.policyRule?.then?.effect === 'audit', 'Azure export: optional tag uses audit effect');

  // Check inheritance recommendations
  assert(exported.tagInheritanceRecommendations.builtInPolicies.length >= 4, 'Azure export: >= 4 inheritance recommendations');
} catch (e) {
  failed++;
  console.log('  FAIL: Azure export threw: ' + e.message);
}

// Azure Export Warnings
const azureWarnings = getAzureExportWarnings(azureTestPolicy);
assert(azureWarnings.some(w => w.toLowerCase().includes('regex')), 'Azure export warns about regex loss');

// Azure Round-trip
try {
  const exported = convertMcpToAzurePolicy(azureTestPolicy);
  const reimported = convertAzurePolicyToMcp(JSON.stringify(exported));
  assert(reimported.required_tags.some(t => t.name === 'CostCenter'), 'Azure round-trip preserves CostCenter tag');
  const costCenter = reimported.required_tags.find(t => t.name === 'CostCenter');
  assert(costCenter?.allowed_values?.includes('Engineering'), 'Azure round-trip preserves allowed_values');
} catch (e) {
  failed++;
  console.log('  FAIL: Azure round-trip threw: ' + e.message);
}

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
