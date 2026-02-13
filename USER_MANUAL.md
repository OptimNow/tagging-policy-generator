# FinOps Tagging Policy Generator - User Manual

Welcome to the FinOps Tagging Policy Generator. This guide walks you through everything you need to know to create effective tagging and labeling policies for cloud cost attribution across AWS, GCP, and Azure.

**Live App:** [tagpolgenerator.optimnow.io](http://tagpolgenerator.optimnow.io/)

---

## What is this tool?

The FinOps Tagging Policy Generator helps you define tagging policies that answer the fundamental question every FinOps team faces: *who's spending what?*

Without consistent tagging, your cost reports are filled with "unallocated" spend. Finance can't charge back to the right departments. Engineering can't identify which services are driving costs. Nobody can answer "how much does Project X actually cost us?"

This tool solves that problem by letting you visually build tagging policies that specify which tags (or labels, in GCP terminology) are required, what values are acceptable, and which resources need them. The output is a JSON policy file you can use with compliance checking tools, export to your cloud provider's native format (AWS Organizations Tag Policy, GCP Label Policy, or Azure Policy Initiative), or share with your teams as documentation.

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

Below the create section, you'll find six cards arranged in three rows, one per provider:

- **Import AWS Policy / Export to AWS Policy** - Convert between the generator's format and AWS Organizations Tag Policy format
- **Import GCP Policy / Export to GCP Policy** - Convert between the generator's format and GCP Label Policy format
- **Import Azure Policy / Export to Azure Policy** - Convert between the generator's format and Azure Policy Initiative format

**Importing** lets you paste an existing native policy to convert it into the generator's format for editing. **Exporting** lets you paste a generator JSON policy and get it converted to native format, copied to your clipboard.

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

**JSON** exports the native policy file. This format works with the [FinOps Tag Compliance MCP Server](https://github.com/OptimNow/finops-tag-compliance-mcp) and integrates with other automation tools. The filename reflects your provider (e.g., `aws-tagging-policy.json`, `gcp-label-policy.json`, `azure-tagging-policy.json`).

**Markdown** generates a human-readable document you can share with teams, include in wikis, or add to onboarding documentation. Always available regardless of provider.

**AWS Tag Policy** (shown for AWS policies) exports a policy ready to paste into AWS Organizations. The generator automatically converts your resource selections into the correct AWS syntax.

**GCP Label Policy** (shown for GCP policies) exports to GCP Label Policy JSON format. Keys are automatically lowercased and lengths are capped at 63 characters.

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

Use the Download button to save your work as JSON or Markdown. To continue editing later, you can re-import the JSON file using any of the import features on the start screen (AWS, GCP, or Azure). They all accept the generator's native JSON format as well as their respective native cloud formats.

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

The generator automatically lowercases any uppercase characters in label keys when exporting to GCP format.

### Supported Resource Types (39 types)

The generator supports 39 GCP resource types organized by FinOps spend impact:

| Category | Resources |
|----------|-----------|
| **Compute** (40-60% of spend) | `compute.googleapis.com/Instance`, `compute.googleapis.com/Disk`, `compute.googleapis.com/Image`, `compute.googleapis.com/Snapshot`, `run.googleapis.com/Service`, `container.googleapis.com/Cluster`, `cloudworkstations.googleapis.com/Cluster` |
| **Storage** (10-20% of spend) | `storage.googleapis.com/Bucket`, `filestore.googleapis.com/Instance`, `artifactregistry.googleapis.com/Repository` |
| **Database** (15-25% of spend) | `sqladmin.googleapis.com/Instance`, `bigtable.googleapis.com/Instance`, `spanner.googleapis.com/Instance`, `alloydb.googleapis.com/Cluster`, `firestore.googleapis.com/Database`, `datastore.googleapis.com/Database`, `memorystore.googleapis.com/Instance` |
| **AI/ML** (Growing rapidly) | `aiplatform.googleapis.com/Endpoint`, `aiplatform.googleapis.com/NotebookRuntime`, `datafusion.googleapis.com/Instance` |
| **Networking** (Often overlooked) | `compute.googleapis.com/ForwardingRule`, `compute.googleapis.com/Network`, `compute.googleapis.com/Subnetwork`, `compute.googleapis.com/Router`, `compute.googleapis.com/VpnGateway`, `compute.googleapis.com/VpnTunnel`, `compute.googleapis.com/Interconnect`, `compute.googleapis.com/InterconnectAttachment`, `compute.googleapis.com/BackendService` |
| **Analytics** (Data & streaming) | `bigquery.googleapis.com/Dataset`, `bigquery.googleapis.com/Table`, `dataflow.googleapis.com/Job`, `dataproc.googleapis.com/Cluster`, `pubsub.googleapis.com/Topic`, `pubsub.googleapis.com/Subscription`, `dataprocmetastore.googleapis.com/Service` |
| **Security & Operations** | `cloudkms.googleapis.com/KeyRing`, `secretmanager.googleapis.com/Secret`, `logging.googleapis.com/LogBucket` |

GCP resource types use the full URI format (`service.googleapis.com/ResourceType`). Only resources that support GCP labels and carry meaningful costs are included.

### GCP Export Format

The GCP Label Policy JSON format includes each label with its key, description, allowed values, enforced resource types, and whether it's required. This is a custom format designed for import/export — GCP does not have a direct equivalent to AWS Organizations Tag Policies.

**Limitations:** GCP Label Policies do not support regex validation. Keys are auto-lowercased on export, and lengths are capped at 63 characters. The generator warns you about any features that won't carry over.

---

## How It Works for Azure

Azure uses **tags** — key-value pairs attached to resources. Azure tags have the following constraints:

- Tag names: max **512 characters**, cannot contain `<>%&\?/`, cannot use reserved prefixes (`microsoft`, `azure`, `windows`)
- Tag values: max **256 characters**
- Each resource can have at most **50 tags**
- Convention is typically PascalCase (e.g., `CostCenter`, `Environment`, `Owner`)

### Supported Resource Types (89 types)

The generator supports 89 Azure resource types organized across 11 categories. Only resources where both "Supports tags" and "Tag in cost report" are true are included.

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

### Azure Export Format

The Azure Policy Initiative format generates one policy definition per tag:

- **Required tags** use `effect: 'deny'` — blocking resource creation without the tag
- **Optional tags** use `effect: 'audit'` — logging non-compliance without blocking

The export also includes:

- **Tag inheritance recommendations** — four built-in Azure Policy IDs for automatically inheriting tags from resource groups and subscriptions
- **Managed resource group notes** — services like AKS, Databricks, Synapse, Azure ML, Managed Applications, and App Service Environment create managed resource groups that have limited tagging support

**Limitations:** Azure Policy does not support regex validation. Tag names have strict character restrictions and reserved prefix rules. Storage account names have a 24-character limit which can conflict with longer tag-based naming conventions. The generator warns you about any features that won't carry over.

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
