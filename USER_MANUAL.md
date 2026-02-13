# FinOps Tagging Policy Generator - User Manual

Welcome to the FinOps Tagging Policy Generator. This guide walks you through everything you need to know to create effective tagging and labeling policies for cloud cost attribution across AWS, GCP, and Azure.

**Live App:** [tagpolgenerator.optimnow.io](http://tagpolgenerator.optimnow.io/)

---

## What is this tool?

The FinOps Tagging Policy Generator helps you define tagging policies that answer the fundamental question every FinOps team faces: *who's spending what?*

Without consistent tagging, your cost reports are filled with "unallocated" spend. Finance can't charge back to the right departments. Engineering can't identify which services are driving costs. Nobody can answer "how much does Project X actually cost us?"

This tool solves that problem by letting you visually build tagging policies that specify which tags (or labels, in GCP terminology) are required, what values are acceptable, and which resources need them. The output is a JSON policy file you can use with compliance checking tools, export to your cloud provider's native format (AWS Organizations Tag Policy or Azure Policy Initiative), or share with your teams as documentation.

Everything runs in your browser. No data leaves your machine, no API keys required, no backend to worry about.

---

## Getting Started

When you open the generator, you'll see three areas on the start screen:

### Choose Your Cloud Provider

At the top, use the **provider toggle** to select AWS, GCP, or Azure. This determines:

- Which resource types are available in the policy builder
- Which naming conventions and validation rules apply
- Which templates are offered
- Which native export format is available

### Create from Scratch

Pick **Start Blank** to begin with an empty policy for your selected provider, or choose from built-in templates designed for common FinOps scenarios:

- **Cost Allocation** - The foundational tags for chargeback and showback: CostCenter, Owner, and Environment
- **Security & Compliance** (AWS) / **Startup** (GCP, Azure) - Adds compliance or operational tags appropriate for the provider
- **Enterprise** - A comprehensive policy for larger organizations with multiple teams and projects
- **Minimal Starter** - A lightweight starting point for teams just beginning their FinOps journey

Templates automatically populate with provider-appropriate tag names (e.g., PascalCase for AWS/Azure, snake_case for GCP) and resource types.

### Import and Export

Below the create section, you'll find four cards arranged in two rows:

- **Import AWS Policy / Export to AWS Policy** — Convert between the generator's format and AWS Organizations Tag Policy format
- **Import Azure Policy / Export to Azure Policy** — Convert between the generator's format and Azure Policy Initiative format

**Importing** lets you paste an existing native policy to convert it into the generator's format for editing. **Exporting** lets you paste a generator JSON policy and get it converted to native format, copied to your clipboard.

> **Note on GCP:** There are no GCP import/export tiles because GCP does not have a native label policy format that can be uploaded to the GCP console. The GCP policy you build here is exported as the generator's JSON format and is designed to be used with the [FinOps Tag Compliance MCP Server](https://github.com/OptimNow/finops-tag-compliance-mcp) for compliance monitoring. See [How It Works for GCP](#how-it-works-for-gcp) for details.

---

## The Policy Builder Interface

Once you're in the editor, you'll see a split-screen layout. The left side is where you build your policy; the right side shows a live JSON preview that updates as you make changes.

### Global Naming Rules

At the top of the builder, you'll find settings that apply to all tags in your policy:

**Case Sensitive** determines whether `CostCenter` and `costcenter` are treated as the same tag. Most organizations turn this off to avoid confusion and enforcement gaps. Note that GCP labels are always case-sensitive and must be lowercase.

**Allow Special Characters** controls whether tag names can include characters beyond letters, numbers, and standard separators. Keeping this off helps maintain consistency.

**Max Key Length** and **Max Value Length** set upper bounds for tag names and values. The defaults depend on your cloud provider:

| Provider | Default Max Key Length | Default Max Value Length |
|----------|----------------------|------------------------|
| AWS | 128 | 256 |
| GCP | 63 | 63 |
| Azure | 512 | 256 |

### Required Tags

These are the tags that must be present on resources for cost attribution to work. For each required tag, you configure:

**Name** is the tag key as it will appear on your cloud resources. Stick with established conventions when possible. AWS and Azure typically use PascalCase (e.g., `CostCenter`), while GCP requires lowercase keys matching the pattern `^[a-z][a-z0-9_-]*$` (e.g., `cost_center`).

**Description** explains what this tag is for. Good descriptions help engineers understand why they need to tag resources and what values to use. "Financial cost center code from SAP for department-level chargeback" is better than just "Cost center".

**Allowed Values** restricts what values are acceptable. For Environment tags, you might specify `production, staging, development`. For CostCenter, you'd typically leave this blank and use a regex pattern instead, since cost center codes follow a format but the actual values come from your finance system.

**Validation Regex** offers pattern-based validation for more flexible scenarios. Cost center codes often follow patterns like `CC-[0-9]{4,6}` or `FIN-[A-Z]{2}-[0-9]{3}`. Owner emails can be validated with standard email patterns. The generator includes a regex tester so you can verify patterns work before exporting.

> **Note:** Regex validation is supported in the generator's native JSON format but is not preserved when exporting to AWS, GCP, or Azure native formats. Those formats only support allowed value lists.

**Common Regex Examples:**

| Use Case | Pattern | Example Matches |
|----------|---------|-----------------|
| Email Address | `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$` | `john.doe@company.com` |
| Cost Center | `^CC-[0-9]{4,6}$` | `CC-1234`, `CC-123456` |
| Project ID | `^[a-z0-9-]+$` | `my-project-123` |
| Application ID | `^APP-[A-Z0-9]{3,10}$` | `APP-WEB01`, `APP-BACKEND` |
| AWS Account ID | `^[0-9]{12}$` | `123456789012` |
| Ticket/JIRA Reference | `^[A-Z]+-[0-9]+$` | `PROJ-123`, `FINOPS-4567` |

**Applies To** specifies which cloud resource types require this tag. The available resource types depend on your selected cloud provider and are organized by FinOps spend impact categories (Compute, Storage, Database, etc.). The most important resources for cost attribution are typically compute instances, databases, and storage — these usually represent the bulk of your cloud spend.

### Optional Tags

Optional tags are recommendations rather than requirements. Use these for tags that would be nice to have but aren't essential for your core cost attribution needs. Project codes, team names, or application identifiers often fall into this category when you're just starting out.

As your tagging maturity improves, you might graduate optional tags to required status.

---

## Export Options

When your policy is ready, the Download button in the editor offers multiple formats:

**JSON** exports the native policy file. This format works with the [FinOps Tag Compliance MCP Server](https://github.com/OptimNow/finops-tag-compliance-mcp) and integrates with other automation tools. The filename reflects your provider (e.g., `aws-tagging-policy.json`, `gcp-label-policy.json`, `azure-tagging-policy.json`). For GCP policies, this is the primary export format — see [How It Works for GCP](#how-it-works-for-gcp).

**Markdown** generates a human-readable document you can share with teams, include in wikis, or add to onboarding documentation. Always available regardless of provider.

**AWS Tag Policy** (shown for AWS policies) exports a policy ready to paste into AWS Organizations. The generator automatically converts your resource selections into the correct AWS syntax.

**Azure Policy Initiative** (shown for Azure policies) exports an Azure Policy Initiative with one policy definition per tag. Required tags use deny effect; optional tags use audit effect.

---

## Common FinOps Tagging Patterns

### The Minimum Viable Policy

If you're just starting with FinOps, focus on three tags:

**CostCenter** or **BusinessUnit** answers: who pays for this resource? This is the cornerstone of chargeback. Without it, costs remain unallocated and finance teams have no way to distribute cloud spend to the right departments.

**Owner** answers: who can answer questions about this resource? When costs spike unexpectedly, you need someone to call. Owner tags also help identify orphaned resources that no one claims responsibility for.

**Environment** answers: is this production spend or development experimentation? Separating production from non-production costs helps identify optimization opportunities. Development resources often run 24/7 when they could be shut down outside business hours.

These three tags enable basic chargeback, let you identify orphaned resources, and help you separate production costs from non-production.

### Scaling Up

As your FinOps practice matures, consider adding:

**Application** or **Service** - Which product or service does this support? This enables product-level cost visibility and helps product managers understand their cloud footprint.

**Project** - For organizations that track project-based spending. Useful when multiple projects share the same cost center but need separate cost tracking.

**Team** - When multiple teams share cost centers but you still want team-level visibility.

### What Not to Include

This tool is focused on cost attribution. While you might be tempted to add tags for security classification, operational automation, or compliance frameworks, consider whether these truly need to be in your FinOps tagging policy.

Tags for `MaintenanceWindow`, `BackupSchedule`, `AutoShutdown`, or `DataClassification` serve important purposes, but they're often better managed by security or operations teams with their own policies. Keeping your cost attribution policy focused makes it easier to achieve compliance and communicate requirements clearly.

---

## Saving and Loading Policies

Policies are not saved automatically or stored anywhere. This is intentional: your tagging strategy is yours, and nothing is transmitted to external servers.

Use the Download button to save your work as JSON or Markdown. To continue editing later, you can re-import the JSON file using the import features on the start screen (AWS or Azure). They accept the generator's native JSON format as well as their respective native cloud formats. For GCP policies, simply open the saved JSON file, copy its contents, and start a new GCP policy from scratch — the JSON format preserves all your settings.

---

## How It Works for AWS

AWS uses **tags** — key-value pairs attached to resources. Tag keys are case-sensitive, support up to 128 characters, and values support up to 256 characters. The convention is PascalCase (e.g., `CostCenter`, `BusinessUnit`, `Environment`).

### Supported Resource Types (27 types)

The generator supports 27 AWS resource types organized by FinOps spend impact:

| Category | Resources |
|----------|-----------|
| **Compute** (40-60% of spend) | `ec2:instance`, `ec2:volume`, `lambda:function`, `ecs:service`, `ecs:cluster`, `ecs:task-definition`, `eks:cluster`, `eks:nodegroup` |
| **Storage** (10-20% of spend) | `s3:bucket`, `elasticfilesystem:file-system`, `fsx:file-system` |
| **Database** (15-25% of spend) | `rds:db`, `dynamodb:table`, `elasticache:cluster`, `redshift:cluster` |
| **AI/ML** (Growing rapidly) | `sagemaker:endpoint`, `sagemaker:notebook-instance`, `bedrock:agent`, `bedrock:knowledge-base` |
| **Networking** (Often overlooked) | `elasticloadbalancing:loadbalancer`, `elasticloadbalancing:targetgroup`, `ec2:natgateway`, `ec2:vpc`, `ec2:subnet`, `ec2:security-group` |
| **Analytics** (Data & streaming) | `kinesis:stream`, `glue:job` |

### AWS Export Format

When you export to AWS Tag Policy format, the generator converts your policy into the AWS Organizations Tag Policy syntax:

- **`enforced_for`** blocks non-compliant resource creation for services that support enforcement mode. Not all AWS services support enforcement — the generator automatically filters to only enforcement-capable services.
- **`report_required_tag_for`** enables compliance reporting across all supported resource types. This works even for services that don't support enforcement.

**Limitations:** AWS Tag Policies do not support regex validation — only allowed value lists. If your policy uses regex patterns, these will not be preserved in the AWS export. The generator warns you about any features that won't carry over.

For a comprehensive guide to FinOps tagging in AWS, including how Tag Policies, SCPs, and auto-tagging work together, see **[FinOps Tagging in AWS](./doc/FINOPS_TAGGING_IN_AWS.md)**.

---

## How It Works for GCP

GCP uses **labels** — key-value pairs attached to resources. Labels have strict naming constraints that differ from AWS and Azure:

- Keys must be **lowercase**, start with a letter, and match the pattern `^[a-z][a-z0-9_-]*$`
- Keys and values each have a **maximum of 63 characters**
- Convention is snake_case (e.g., `cost_center`, `business_unit`, `environment`)

### Why There's No GCP Import/Export

Unlike AWS (which has Organizations Tag Policies) and Azure (which has Policy Initiatives), **GCP does not have a native label policy format** that you can upload to the GCP console to enforce labeling rules. GCP labels are applied directly to resources — there is no central policy document you load into GCP that says "these labels are required on these resources."

This means the GCP policy you build in this tool is not meant to be uploaded to GCP. Instead, it serves as the **source of truth for your labeling standards**, and is designed to be used with the [FinOps Tag Compliance MCP Server](https://github.com/OptimNow/finops-tag-compliance-mcp). The MCP Server reads your policy JSON, scans your GCP project for resources, and reports which ones are missing required labels or have invalid values.

**Your workflow for GCP:**

1. **Build your label policy** in this tool — define which labels are required, what values are acceptable, and which resource types need them
2. **Export as JSON** — this is the only export format for GCP (there's no native format to convert to)
3. **Use with the MCP Server** — the server checks your GCP resources against the policy and reports compliance gaps
4. **Share as Markdown** — generate a human-readable document for your engineering teams so they know what labels to apply

The policy should mirror the labeling conventions your team actually uses in GCP. If your team already applies `cost_center` and `environment` labels to Compute Engine instances, your policy should reflect exactly those label keys and resource types.

### Supported Resource Types (39 types)

The generator supports 39 GCP resource types organized by FinOps spend impact. Only resources that support GCP labels and carry meaningful costs are included. Resource types use the full URI format (`service.googleapis.com/ResourceType`).

| Category | Resources |
|----------|-----------|
| **Compute** (40-60% of spend) | `compute.googleapis.com/Instance`, `compute.googleapis.com/Disk`, `compute.googleapis.com/Image`, `compute.googleapis.com/Snapshot`, `run.googleapis.com/Service`, `container.googleapis.com/Cluster`, `cloudworkstations.googleapis.com/Cluster` |
| **Storage** (10-20% of spend) | `storage.googleapis.com/Bucket`, `filestore.googleapis.com/Instance`, `artifactregistry.googleapis.com/Repository` |
| **Database** (15-25% of spend) | `sqladmin.googleapis.com/Instance`, `bigtable.googleapis.com/Instance`, `spanner.googleapis.com/Instance`, `alloydb.googleapis.com/Cluster`, `firestore.googleapis.com/Database`, `datastore.googleapis.com/Database`, `memorystore.googleapis.com/Instance` |
| **AI/ML** (Growing rapidly) | `aiplatform.googleapis.com/Endpoint`, `aiplatform.googleapis.com/NotebookRuntime`, `datafusion.googleapis.com/Instance` |
| **Networking** (Often overlooked) | `compute.googleapis.com/ForwardingRule`, `compute.googleapis.com/Network`, `compute.googleapis.com/Subnetwork`, `compute.googleapis.com/Router`, `compute.googleapis.com/VpnGateway`, `compute.googleapis.com/VpnTunnel`, `compute.googleapis.com/Interconnect`, `compute.googleapis.com/InterconnectAttachment`, `compute.googleapis.com/BackendService` |
| **Analytics** (Data & streaming) | `bigquery.googleapis.com/Dataset`, `bigquery.googleapis.com/Table`, `dataflow.googleapis.com/Job`, `dataproc.googleapis.com/Cluster`, `pubsub.googleapis.com/Topic`, `pubsub.googleapis.com/Subscription`, `dataprocmetastore.googleapis.com/Service` |
| **Security & Operations** | `cloudkms.googleapis.com/KeyRing`, `secretmanager.googleapis.com/Secret`, `logging.googleapis.com/LogBucket` |

---

## How It Works for Azure

Azure uses **tags** — key-value pairs attached to resources. Azure tags have the following constraints:

- Tag names: max **512 characters**, cannot contain `<>%&\?/`, cannot use reserved prefixes (`microsoft`, `azure`, `windows`)
- Tag values: max **256 characters**
- Each resource can have at most **50 tags**
- Convention is typically PascalCase (e.g., `CostCenter`, `Environment`, `Owner`)

### Azure Labels vs Tags vs Policy Tags

Azure has several tagging-related concepts — make sure you use the right one:

- **Tags** (in the Azure Portal on each resource) — key-value pairs for cost allocation and organization. These appear in your billing exports and Cost Management. **This is what our tool targets.**
- **Tags** (in IAM / Resource Manager) — used for access control conditions and RBAC policies. Different purpose from cost attribution tags.
- **Policy Tags** (in Azure Purview / Data Catalog) — for data governance and classification. Not related to cost attribution.

For FinOps purposes, you enforce tagging through **Azure Policy**, which can deny or audit resource creation based on whether required tags are present.

### Your Workflow for Azure

Unlike GCP (which has no native policy format), Azure Policy lets you enforce tagging directly. Here's the end-to-end workflow:

#### 1. Build Your Policy in the Generator

1. Open the tool and select **Azure** as your cloud provider
2. Choose a template (e.g., **Cost Allocation** or **Minimal Starter**) or start blank
3. Configure your required tags — name, description, allowed values, and which resource types they apply to
4. Click **Download → Azure Policy** to get the exported Azure Policy Initiative JSON

The exported file contains one policy definition per tag, with `deny` effect for required tags and `audit` effect for optional tags. Keep it as reference for the next step.

#### 2. Create Policy Definitions in Azure Portal

Azure doesn't accept a single policy file upload. Instead, you create each policy definition individually. For each required tag in your export:

1. Go to **Azure Portal** → search for **Policy** → click **Definitions**
2. Click **+ Policy definition**
3. Fill in the basics:
   - **Definition location**: Select your subscription (click the `...` button)
   - **Name**: e.g., `Require CostCenter tag on resources`
   - **Description**: Copy from the exported file
   - **Category**: Create new → `FinOps` (or use existing → `Tags`)

4. In the **Policy Rule** editor, paste the complete JSON block for that tag. The editor expects a single JSON object containing `mode`, `parameters`, and `policyRule` together:

```json
{
  "mode": "Indexed",
  "parameters": {
    "tagName": {
      "type": "String",
      "metadata": {
        "displayName": "Tag Name",
        "description": "Name of the tag to enforce"
      },
      "defaultValue": "CostCenter"
    }
  },
  "policyRule": {
    "if": {
      "field": "[concat('tags[', parameters('tagName'), ']')]",
      "exists": "false"
    },
    "then": {
      "effect": "deny"
    }
  }
}
```

5. Click **Save**
6. Repeat for each tag, changing the `defaultValue` and the effect (`deny` for required, `audit` for optional)

> **Important:** The Policy Rule editor is a single JSON editor — `parameters` and `policyRule` go in the same block, not in separate fields.

#### 3. Assign the Policy

1. Go to **Policy → Assignments**
2. Click **Assign policy**
3. **Scope**: Select your subscription or a specific resource group (use a test resource group first!)
4. **Policy definition**: Search for the definition you just created
5. Leave parameters as defaults
6. Click **Review + create** → **Create**

#### 4. Test the Enforcement

- Try creating a resource (e.g., a Storage Account) **without** the required tag → Azure should **deny** the request
- Try again **with** the required tag → the creation should succeed
- For `audit` effect policies, resources will be created but flagged as non-compliant in the Policy compliance dashboard

#### 5. Optional: Group into an Initiative

Once you have multiple policy definitions, you can group them into an **Initiative** (Policy Set):

1. Go to **Policy → Definitions** → click **+ Initiative definition**
2. Add each of your tag policy definitions to the initiative
3. Assign the initiative instead of individual policies

This makes it easier to manage all your FinOps tagging rules as a single unit.

### Importing an Existing Azure Policy

If you already have Azure Policy definitions for tagging, you can import them into the generator:

1. In Azure Portal, go to **Policy → Definitions** → find your policy
2. Click the policy → click **Policy JSON** (or **JSON View**)
3. Copy the JSON
4. In the generator start screen, paste it in the **Import Azure Policy** tile
5. The generator converts it to its format for editing

The importer understands both single policy definitions and full initiative JSON with `policyDefinitions` arrays.

### Supported Resource Types (89 types)

The generator supports 89 Azure resource types organized across 11 categories. Only resources where both "Supports tags" and "Tag in cost report" are true (per [Azure documentation](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/tag-support)) are included.

| Category | Count | Example Resource Types |
|----------|-------|----------------------|
| **Compute** (40-60% of spend) | 18 | `Microsoft.Compute/virtualMachines`, `Microsoft.Compute/virtualMachineScaleSets`, `Microsoft.Compute/disks`, `Microsoft.App/containerApps`, `Microsoft.Batch/batchAccounts`, `Microsoft.DesktopVirtualization/hostpools`, ... |
| **Storage** (10-20% of spend) | 7 | `Microsoft.Storage/storageAccounts`, `Microsoft.DataLakeStore/accounts`, `Microsoft.NetApp/netAppAccounts`, ... |
| **Database** (15-25% of spend) | 10 | `Microsoft.Sql/servers`, `Microsoft.Sql/servers/databases`, `Microsoft.DocumentDB/databaseAccounts`, `Microsoft.DBforPostgreSQL/flexibleServers`, `Microsoft.Cache/redis`, ... |
| **AI/ML** (Growing rapidly) | 5 | `Microsoft.MachineLearningServices/workspaces`, `Microsoft.CognitiveServices/accounts`, `Microsoft.Search/searchServices`, ... |
| **Networking** (Often overlooked) | 16 | `Microsoft.Network/virtualNetworks`, `Microsoft.Network/loadBalancers`, `Microsoft.Network/applicationGateways`, `Microsoft.Network/azureFirewalls`, `Microsoft.Cdn/profiles`, ... |
| **Containers & Kubernetes** | 4 | `Microsoft.ContainerService/managedClusters`, `Microsoft.ContainerRegistry/registries`, `Microsoft.ContainerService/fleets`, `Microsoft.Kubernetes/connectedClusters` |
| **Analytics & Integration** | 11 | `Microsoft.Databricks/workspaces`, `Microsoft.DataFactory/factories`, `Microsoft.Synapse/workspaces`, `Microsoft.EventHub/namespaces`, `Microsoft.Fabric/capacities`, ... |
| **Web & Application** | 6 | `Microsoft.Web/sites`, `Microsoft.Web/serverFarms`, `Microsoft.ApiManagement/service`, ... |
| **Security & Identity** | 3 | `Microsoft.KeyVault/vaults`, `Microsoft.KeyVault/managedHSMs`, `Microsoft.ManagedIdentity/userAssignedIdentities` |
| **Monitoring** | 5 | `Microsoft.Insights/components`, `Microsoft.OperationalInsights/workspaces`, `Microsoft.Insights/workbooks`, ... |
| **DevOps & DevCenter** | 4 | `Microsoft.DevCenter/devcenters`, `Microsoft.DevCenter/projects`, `Microsoft.DevTestLab/labs`, `Microsoft.LabServices/labs` |

Azure resource types use the `Microsoft.*` namespace format (e.g., `Microsoft.Compute/virtualMachines`). The full list of all 89 resource types is available in the tool's resource picker.

### Tag Inheritance

The exported file includes recommendations for four built-in Azure Policies that automatically inherit tags from resource groups and subscriptions. These are especially useful for managed resource groups (AKS, Databricks, Synapse, Azure ML) where you cannot directly tag the resources inside them. Look for the `tagInheritanceRecommendations` section in your exported JSON.

### Limitations

- Azure Policy does not support regex validation — only allowed value lists. If your policy uses regex patterns, these will not be preserved in the Azure export.
- Tag names have strict character restrictions and reserved prefix rules.
- Storage account names have a 24-character limit which can conflict with longer tag-based naming conventions.
- Services that create managed resource groups (AKS, Databricks, Synapse, Azure ML, Managed Applications, App Service Environment) have limited tagging on resources inside those groups — use tag inheritance policies from the resource group level.
- The generator warns you about any features that won't carry over during export.

---

## Tips for Success

**Start small.** Three required tags with good adoption beats fifteen tags that nobody uses. You can always add more tags as your practice matures.

**Write good descriptions.** Engineers are more likely to tag correctly when they understand why the tag exists and what values are appropriate.

**Use validation patterns.** Regex patterns catch typos and ensure consistency. A cost center code of `CC-1234` is much more useful than freeform text.

**Focus on high-spend resources first.** Compute instances, databases, and storage typically represent the majority of cloud spend. Get those tagged before worrying about every function or queue.

**Communicate the why.** Share your tagging policy with engineering teams along with an explanation of how good tagging enables cost visibility, helps identify optimization opportunities, and ultimately benefits everyone.

---

## Need Help?

If you run into issues or have questions:

- Check the [README](./README.md) for technical setup and deployment instructions
- Open an issue on [GitHub](https://github.com/OptimNow/tagging-policy-generator/issues) for bugs or feature requests
- Visit [OptimNow](https://www.optimnow.io) for more FinOps resources

---

*Built by [OptimNow](https://www.optimnow.io) for FinOps practitioners who know that good cost attribution starts with good tagging.*
