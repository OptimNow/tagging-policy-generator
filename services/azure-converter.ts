import { Policy, RequiredTag, OptionalTag } from '../types';

// Azure Policy Definition structure
interface AzurePolicyDefinition {
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
      then: {
        effect: string;
        details?: Record<string, unknown>;
      };
    };
  };
}

// Azure Policy Initiative structure
interface AzurePolicyInitiative {
  properties: {
    displayName: string;
    policyType: string;
    description: string;
    metadata?: Record<string, string>;
    policyDefinitions: Array<{
      policyDefinitionId: string;
      policyDefinition: AzurePolicyDefinition;
    }>;
  };
  tagInheritanceRecommendations: {
    description: string;
    builtInPolicies: Array<{
      displayName: string;
      policyDefinitionId: string;
      effect: string;
      description: string;
    }>;
  };
  managedResourceGroupNotes: {
    description: string;
    affectedServices: string[];
  };
}

// Import: Azure Policy JSON -> MCP Format
export function convertAzurePolicyToMcp(azurePolicyString: string): Policy {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(azurePolicyString);
  } catch {
    throw new Error("Invalid JSON format. Please paste valid Azure Policy JSON.");
  }

  const requiredTags: RequiredTag[] = [];
  const optionalTags: OptionalTag[] = [];

  // Detect format: initiative (has policyDefinitions) or single policy definition
  const props = (parsed as { properties?: Record<string, unknown> }).properties || parsed;
  const policyDefs = (props as { policyDefinitions?: Array<{ policyDefinition?: AzurePolicyDefinition; policyDefinitionId?: string }> }).policyDefinitions;

  if (policyDefs && Array.isArray(policyDefs)) {
    // Initiative format: iterate policy definitions
    for (const entry of policyDefs) {
      const def = entry.policyDefinition || entry as unknown as AzurePolicyDefinition;
      const defProps = (def as { properties?: AzurePolicyDefinition['properties'] }).properties || def as unknown as AzurePolicyDefinition['properties'];
      extractTagFromDefinition(defProps, requiredTags, optionalTags);
    }
  } else if ((props as { policyRule?: unknown }).policyRule) {
    // Single policy definition
    extractTagFromDefinition(props as AzurePolicyDefinition['properties'], requiredTags, optionalTags);
  } else {
    throw new Error("Invalid Azure Policy format. Expected policyDefinitions array or a single policy definition with policyRule.");
  }

  if (requiredTags.length === 0 && optionalTags.length === 0) {
    throw new Error("No tag requirements found in the Azure Policy. Ensure policy definitions include tagName parameters.");
  }

  return {
    version: "1.0",
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

function extractTagFromDefinition(
  defProps: AzurePolicyDefinition['properties'],
  requiredTags: RequiredTag[],
  optionalTags: OptionalTag[]
) {
  if (!defProps || !defProps.parameters) return;

  const tagNameParam = defProps.parameters.tagName || defProps.parameters.TagName;
  if (!tagNameParam) return;

  const tagName = tagNameParam.defaultValue as string || 'UnknownTag';
  const description = defProps.description || defProps.displayName || `Imported from Azure Policy - ${tagName}`;
  const effect = defProps.policyRule?.then?.effect || 'deny';

  // Extract allowed values
  const allowedValuesParam = defProps.parameters.allowedValues || defProps.parameters.AllowedValues;
  const allowedValues = allowedValuesParam?.defaultValue as string[] | undefined;

  if (effect.toLowerCase() === 'audit') {
    optionalTags.push({
      name: tagName,
      description,
      allowed_values: allowedValues && allowedValues.length > 0 ? allowedValues : null,
    });
  } else {
    // deny, modify, or any other effect -> required
    requiredTags.push({
      name: tagName,
      description,
      allowed_values: allowedValues && allowedValues.length > 0 ? allowedValues : null,
      validation_regex: null,
      applies_to: [],
    });
  }
}

// Export: MCP Format -> Azure Policy Initiative
export function convertMcpToAzurePolicy(policy: Policy): AzurePolicyInitiative {
  const policyDefinitions: AzurePolicyInitiative['properties']['policyDefinitions'] = [];

  // Generate policy definitions for required tags (deny effect)
  for (const tag of policy.required_tags) {
    policyDefinitions.push({
      policyDefinitionId: `custom-require-${tag.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      policyDefinition: buildPolicyDefinition(tag.name, tag.description, 'deny', tag.allowed_values),
    });
  }

  // Generate policy definitions for optional tags (audit effect)
  for (const tag of policy.optional_tags) {
    policyDefinitions.push({
      policyDefinitionId: `custom-audit-${tag.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      policyDefinition: buildPolicyDefinition(tag.name, tag.description, 'audit', tag.allowed_values),
    });
  }

  return {
    properties: {
      displayName: "Tagging Governance Initiative",
      policyType: "Custom",
      description: "Ensures all resources have required tags for cost attribution and governance. Generated by OptimNow Tagging Policy Generator.",
      metadata: {
        category: "Tags",
        version: policy.version,
        generatedBy: "OptimNow Tagging Policy Generator",
      },
      policyDefinitions,
    },
    tagInheritanceRecommendations: {
      description: "Consider enabling these built-in Azure Policies for tag inheritance to improve cost attribution coverage, especially for managed resource groups (AKS, Databricks, etc.)",
      builtInPolicies: [
        {
          displayName: "Inherit a tag from the resource group",
          policyDefinitionId: "cd3aa116-8754-49c9-a813-ad46512ece54",
          effect: "Modify",
          description: "Adds or replaces the specified tag and value from the parent resource group when any resource is created or updated.",
        },
        {
          displayName: "Inherit a tag from the resource group if missing",
          policyDefinitionId: "ea3f2387-9b95-492a-a190-fcdc54f7b070",
          effect: "Modify",
          description: "Adds the specified tag from the parent resource group only when the tag is missing on the resource. Existing resources can be remediated.",
        },
        {
          displayName: "Inherit a tag from the subscription",
          policyDefinitionId: "b27a0cbd-a167-4064-ae47-28c309da4a4f",
          effect: "Modify",
          description: "Adds or replaces the specified tag and value from the containing subscription when any resource is created or updated.",
        },
        {
          displayName: "Inherit a tag from the subscription if missing",
          policyDefinitionId: "40df99da-1232-49b1-a39a-6571f4e27e24",
          effect: "Modify",
          description: "Adds the specified tag from the containing subscription only when the tag is missing on the resource.",
        },
      ],
    },
    managedResourceGroupNotes: {
      description: "These Azure services create managed resource groups (e.g. MC_ for AKS) with resources that have limited tagging permissions. Use tag inheritance policies from the resource group level to ensure cost attribution coverage.",
      affectedServices: [
        "AKS (Microsoft.ContainerService/managedClusters) - creates MC_{rgname}_{clustername}_{location}",
        "Azure Databricks (Microsoft.Databricks/workspaces)",
        "Azure Synapse Analytics (Microsoft.Synapse/workspaces)",
        "Azure Machine Learning (Microsoft.MachineLearningServices/workspaces)",
        "Azure Managed Applications",
        "App Service Environment",
      ],
    },
  };
}

function buildPolicyDefinition(
  tagName: string,
  description: string,
  effect: string,
  allowedValues: string[] | null
): AzurePolicyDefinition {
  const parameters: AzurePolicyDefinition['properties']['parameters'] = {
    tagName: {
      type: "String",
      metadata: {
        displayName: "Tag Name",
        description: "Name of the tag to enforce",
      },
      defaultValue: tagName,
    },
  };

  if (allowedValues && allowedValues.length > 0) {
    parameters.allowedValues = {
      type: "Array",
      metadata: {
        displayName: "Allowed Values",
        description: "List of allowed tag values",
      },
      defaultValue: allowedValues,
    };
  }

  // Build policy rule
  // When allowedValues are present, enforce both tag existence AND value validation
  const policyRule: AzurePolicyDefinition['properties']['policyRule'] = allowedValues && allowedValues.length > 0
    ? {
        if: {
          anyOf: [
            {
              field: "[concat('tags[', parameters('tagName'), ']')]",
              exists: "false",
            },
            {
              field: "[concat('tags[', parameters('tagName'), ']')]",
              notIn: "[parameters('allowedValues')]",
            },
          ],
        },
        then: {
          effect,
        },
      }
    : {
        if: {
          field: "[concat('tags[', parameters('tagName'), ']')]",
          exists: "false",
        },
        then: {
          effect,
        },
      };

  return {
    properties: {
      displayName: `${effect === 'deny' ? 'Require' : 'Audit'} ${tagName} tag on resources`,
      policyType: "Custom",
      mode: "Indexed",
      description,
      metadata: {
        category: "Tags",
        version: "1.0.0",
        generatedBy: "OptimNow Tagging Policy Generator",
      },
      parameters,
      policyRule,
    },
  };
}

// Generate Azure Portal-ready JSON for a single tag definition.
// This is the exact format you paste into the Azure Portal Policy Rule editor:
// a single JSON object with mode, parameters, and policyRule together.
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

// Export warnings for features that won't be preserved in Azure format
export function getAzureExportWarnings(policy: Policy): string[] {
  const warnings: string[] = [];

  // Regex validation not supported
  const tagsWithRegex = policy.required_tags.filter(t => t.validation_regex);
  if (tagsWithRegex.length > 0) {
    const tagNames = tagsWithRegex.map(t => t.name).join(', ');
    warnings.push(`Regex validation will be lost for: ${tagNames}. Azure Policy doesn't support regex — use allowedValues or Azure Policy pattern matching instead.`);
  }

  // Tag name length limits
  const allTags = [...policy.required_tags, ...policy.optional_tags];
  const longNames = allTags.filter(t => t.name.length > 512);
  if (longNames.length > 0) {
    warnings.push(`Tag names exceed Azure's 512-character limit: ${longNames.map(t => t.name).join(', ')}`);
  }

  // Total tag count
  if (allTags.length > 50) {
    warnings.push(`Your policy defines ${allTags.length} tags. Azure resources support a maximum of 50 tags.`);
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

  // Managed resource groups note
  const hasManagedRgServices = policy.required_tags.some(t =>
    t.applies_to?.some(r =>
      r.includes('Microsoft.ContainerService/managedClusters') ||
      r.includes('Microsoft.Databricks/workspaces') ||
      r.includes('Microsoft.Synapse/workspaces') ||
      r.includes('Microsoft.MachineLearningServices/workspaces')
    )
  );
  if (hasManagedRgServices) {
    warnings.push('Some selected resource types (AKS, Databricks, Synapse, Azure ML) create managed resource groups with resources you cannot directly tag. Enable tag inheritance policies from the resource group level.');
  }

  // FOCUS cost export gap note
  warnings.push('Note: Even with high tag compliance, Azure FOCUS cost exports may show untagged billing lines. Consider subscription-naming-convention-based transformations in Power BI for full cost attribution coverage.');

  return warnings;
}
