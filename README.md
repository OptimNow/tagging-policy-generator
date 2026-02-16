<div align="center">

# FinOps Tagging Policy Generator

**A visual tool for FinOps practitioners to create tagging policies that enable accurate cloud cost attribution across AWS, GCP, and Azure.**

[**Try the Live App**](http://tagpolgenerator.optimnow.io/) · [User Guide](#how-to-use-the-policy-builder) · [Examples](./examples/)

</div>

---

## Why This Tool Exists

Cloud cost management starts with knowing who's spending what. Without consistent tagging, your cost reports are filled with "unallocated" spend, and finance teams can't charge back to the right departments. Engineering can't identify which services are driving costs. Nobody can answer "how much does Project X actually cost us?"

This tool helps you define tagging policies that solve that problem. It's laser-focused on FinOps use cases: cost centers, ownership, environments, business units, and the other tags that make showback and chargeback possible. While tags can serve many purposes (security classification, operations automation, compliance), this generator is designed specifically for the tags that enable cost attribution.

The generator runs entirely in your browser—no data leaves your machine, no API keys required, no backend to maintain. Just open it up and start building.

## What This Tool Does

The FinOps Tagging Policy Generator creates JSON policy files that define your organization's cost attribution tags. These policies specify which tags (or labels, in GCP terminology) are required on which resources, what values are acceptable, and how tag names should be formatted. For AWS and Azure, you can also export to native policy formats (AWS Organizations Tag Policy or Azure Policy Initiative) that can be uploaded directly to your cloud provider.

The output is designed to work with the [FinOps Tag Compliance MCP Server](https://github.com/OptimNow/finops-tag-compliance-mcp), but the JSON format is straightforward enough to integrate with any compliance checking system you might be using. For AWS and Azure, you can also export to native policy formats (AWS Organizations Tag Policy and Azure Policy Initiative). For GCP, there is no native label policy format — the JSON export is used with the MCP Server for compliance monitoring.

A typical cost attribution policy looks like this:

```json
{
  "version": "1.0",
  "last_updated": "2025-01-04T12:00:00Z",
  "cloud_provider": "aws",
  "required_tags": [
    {
      "name": "CostCenter",
      "description": "Financial cost center for chargeback",
      "allowed_values": null,
      "validation_regex": "^CC-[0-9]{4,6}$",
      "applies_to": ["ec2:instance", "rds:db", "s3:bucket", "lambda:function"]
    },
    {
      "name": "Owner",
      "description": "Email of the team responsible for this spend",
      "allowed_values": null,
      "validation_regex": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      "applies_to": ["ec2:instance", "rds:db", "s3:bucket"]
    },
    {
      "name": "Environment",
      "description": "Deployment environment for cost segmentation",
      "allowed_values": ["production", "staging", "development"],
      "validation_regex": null,
      "applies_to": ["ec2:instance", "rds:db", "s3:bucket", "lambda:function"]
    }
  ],
  "optional_tags": [...],
  "tag_naming_rules": {
    "case_sensitivity": false,
    "allow_special_characters": false,
    "max_key_length": 128,
    "max_value_length": 256
  }
}
```

The `cloud_provider` field (`aws`, `gcp`, or `azure`) drives provider-specific behavior throughout the tool—resource type selection, naming conventions, validation rules, and export formats.

## Getting Started

### Use the Live App (Recommended)

The easiest way to use this tool is via the hosted version:

**[tagpolgenerator.optimnow.io](http://tagpolgenerator.optimnow.io/)**

No installation required. Just open the link and start building your tagging policy.

### Run Locally (For Development)

If you want to customize the tool or run it locally:

**Prerequisites:** Node.js v18 or later

```bash
# Clone and install
git clone https://github.com/OptimNow/tagging-policy-generator.git
cd tagging-policy-generator
npm install

# Start development server
npm run dev
```

Open your browser to `http://localhost:3000` and you're ready to go.

For production builds:

```bash
npm run build
npm run preview  # Test the production build locally
```

The `dist/` folder contains static files you can deploy to any web server, CDN, or hosting platform.

## How to Use the Policy Builder

### Starting a New Policy

When you first open the app, you'll see a **provider toggle** (AWS / GCP / Azure) at the top. Select your cloud provider first—this determines which resource types, naming conventions, and export formats are available.

**Create from Scratch** lets you start with a blank policy or pick from built-in templates. Each provider has four templates designed for common FinOps scenarios:

- **Cost Allocation** includes CostCenter, Owner, and Environment—the foundational tags for any chargeback or showback program
- **Security & Compliance** (AWS) / **Startup** (GCP, Azure) adds compliance or operational tags appropriate for the provider
- **Enterprise** provides a comprehensive policy for larger organizations with multiple teams and projects
- **Minimal Starter** provides a lightweight starting point for organizations just beginning their FinOps journey

Templates automatically use provider-appropriate conventions: PascalCase tag names for AWS/Azure, snake_case label keys for GCP.

**Import** takes an existing cloud-native policy and converts it into the generator's format. You can import from:

- AWS Organizations Tag Policy
- Azure Policy Initiative JSON

**Export** on the start screen lets you paste a generator JSON policy and convert it to AWS Organizations or Azure Policy Initiative format.

> **Note on GCP:** There are no GCP import/export tiles because GCP does not have a native label policy format. The GCP policy you build here is exported as JSON and used with the [FinOps Tag Compliance MCP Server](https://github.com/OptimNow/finops-tag-compliance-mcp) for compliance monitoring.

### The Policy Builder Interface

The editor uses a split-screen layout. The left side is where you build your policy; the right side shows a live JSON preview that updates as you make changes.

#### Global Naming Rules

At the top, you'll find settings that apply to all tags:

- **Case Sensitive** determines whether `CostCenter` and `costcenter` are treated as the same tag (GCP labels are always case-sensitive and must be lowercase)
- **Allow Special Characters** controls whether tag names can include characters beyond letters, numbers, and standard separators
- **Max Key Length** and **Max Value Length** set upper bounds for tag names and values. Defaults vary by provider: AWS (128/256), GCP (63/63), Azure (512/256)

#### Required Tags

These are the tags that must be present on resources for cost attribution to work. For each required tag, you configure:

**Name** is the tag key as it will appear on your cloud resources. AWS and Azure typically use PascalCase (`CostCenter`), while GCP requires lowercase (`cost_center`).

**Description** explains what this tag is for. Good descriptions help engineers understand why they need to tag resources and what values to use. "Financial cost center code from SAP for department-level chargeback" is better than "Cost center".

**Allowed Values** restricts what values are acceptable. For Environment tags, you might specify `production, staging, development`. For CostCenter, you'd typically leave this blank and use a regex pattern instead, since cost center codes follow a format but the actual values come from your finance system.

**Validation Regex** offers pattern-based validation. Cost center codes often follow patterns like `CC-[0-9]{4,6}` or `FIN-[A-Z]{2}-[0-9]{3}`. The regex is tested in real-time so you can verify it works before exporting. Note that regex validation is only supported in the generator's native JSON format—AWS, GCP, and Azure native formats only support allowed value lists.

**Applies To** specifies which cloud resource types require this tag. The available resources depend on your selected provider and are organized by FinOps spend impact categories.

#### Optional Tags

Optional tags are recommendations rather than requirements. Use these for tags that would be nice to have but aren't essential for your core cost attribution needs. Project codes, team names, or application identifiers often fall into this category when you're just starting out.

### Export Options

The Download button offers multiple formats:

- **JSON** exports the raw policy file for use with the FinOps Tag Compliance MCP Server or other automation tools. For GCP policies, this is the primary export format.
- **Markdown** generates a human-readable document you can share with teams or include in documentation
- **AWS Tag Policy** (AWS policies) exports to AWS Organizations Tag Policy format with `enforced_for` and `report_required_tag_for`
- **Azure Policy Initiative** (Azure policies) exports with deny effect for required tags, audit effect for optional tags

### Saving and Loading Policies

Policies are not saved automatically or stored anywhere. This is intentional: your tagging strategy is yours, and nothing is transmitted to external servers. Use the Download button to save your work. To load a policy back, use the AWS or Azure import features on the start screen — they accept the generator's native JSON format as well as their respective cloud-native formats.

## Common FinOps Tagging Patterns

### The Minimum Viable Tagging Policy

If you're just starting with FinOps, focus on three tags:

1. **CostCenter** or **BusinessUnit** - Who pays for this resource?
2. **Owner** - Who can answer questions about this resource?
3. **Environment** - Is this production spend or development experimentation?

These three tags enable basic chargeback, let you identify orphaned resources, and help you separate production costs from non-production.

### Scaling Up

As your FinOps practice matures, consider adding:

- **Application** or **Service** - Which product or service does this support?
- **Project** - For organizations that track project-based spending
- **Team** - When multiple teams share cost centers

### What Not to Include

This tool is focused on cost attribution. While you might be tempted to add tags for:

- Security classification (DataClassification, Compliance)
- Operations (MaintenanceWindow, BackupSchedule)
- Automation (AutoShutdown, Terraform-managed)

Consider whether these truly need to be in your FinOps tagging policy or whether they belong in separate policies managed by security or operations teams. Keeping your cost attribution policy focused makes it easier to achieve compliance.

## Example Policies

The `examples/` folder contains sample policies:

**startup-policy.json** is a lightweight policy for smaller organizations. Three required tags (Environment, Owner, Project) and two optional ones. Perfect for teams that need cost visibility without bureaucratic overhead.

**enterprise-policy.json** is comprehensive. Seven required tags covering cost centers, environments, ownership, applications, data classification, compliance, and business units. Use this as a reference for building enterprise-grade tagging strategies.

**aws-policy-example.json** demonstrates the AWS Organizations tag policy format, useful for testing the AWS import feature.

**azure-policy-example.json** demonstrates the Azure Policy Initiative format, useful for testing the Azure import feature.

## Policy Schema Reference

The complete policy structure:

```
{
  version           : string    // Policy version identifier (e.g., "1.0")
  last_updated      : string    // ISO 8601 timestamp, stamped at export time
  cloud_provider    : string    // "aws", "gcp", or "azure"
  required_tags     : array     // Tags that must be present
  optional_tags     : array     // Recommended but not enforced
  tag_naming_rules  : object    // Global formatting rules
}
```

**Required tag properties:**
```
{
  name              : string           // Tag key name
  description       : string           // Human-readable explanation
  allowed_values    : string[] | null  // Acceptable values, or null for any
  validation_regex  : string | null    // Pattern for value validation
  applies_to        : string[]         // Resource types requiring this tag
}
```

**Optional tag properties:**
```
{
  name              : string           // Tag key name
  description       : string           // Human-readable explanation
  allowed_values    : string[] | null  // Acceptable values, or null for any
}
```

**Tag naming rules:**
```
{
  case_sensitivity         : boolean  // Enforce case matching
  allow_special_characters : boolean  // Permit special chars in names
  max_key_length           : number   // Maximum tag key length
  max_value_length         : number   // Maximum tag value length
}
```

## Supported Resource Types

The tool supports resource types across all three cloud providers, organized by FinOps spend categories:

### AWS (27 resource types)

| Category | Resource Types |
|----------|----------------|
| **Compute** | `ec2:instance`, `ec2:volume`, `lambda:function`, `ecs:service`, `ecs:cluster`, `ecs:task-definition`, `eks:cluster`, `eks:nodegroup` |
| **Storage** | `s3:bucket`, `elasticfilesystem:file-system`, `fsx:file-system` |
| **Database** | `rds:db`, `dynamodb:table`, `elasticache:cluster`, `redshift:cluster` |
| **AI/ML** | `sagemaker:endpoint`, `sagemaker:notebook-instance`, `bedrock:agent`, `bedrock:knowledge-base` |
| **Networking** | `elasticloadbalancing:loadbalancer`, `elasticloadbalancing:targetgroup`, `ec2:natgateway`, `ec2:vpc`, `ec2:subnet`, `ec2:security-group` |
| **Analytics** | `kinesis:stream`, `glue:job` |

### GCP (39 resource types)

| Category | Resource Types |
|----------|----------------|
| **Compute** | `compute.googleapis.com/Instance`, `compute.googleapis.com/Disk`, `compute.googleapis.com/Image`, `compute.googleapis.com/Snapshot`, `run.googleapis.com/Service`, `container.googleapis.com/Cluster`, `cloudworkstations.googleapis.com/Cluster` |
| **Storage** | `storage.googleapis.com/Bucket`, `filestore.googleapis.com/Instance`, `artifactregistry.googleapis.com/Repository` |
| **Database** | `sqladmin.googleapis.com/Instance`, `bigtable.googleapis.com/Instance`, `spanner.googleapis.com/Instance`, `alloydb.googleapis.com/Cluster`, `firestore.googleapis.com/Database`, `datastore.googleapis.com/Database`, `memorystore.googleapis.com/Instance` |
| **AI/ML** | `aiplatform.googleapis.com/Endpoint`, `aiplatform.googleapis.com/NotebookRuntime`, `datafusion.googleapis.com/Instance` |
| **Networking** | `compute.googleapis.com/ForwardingRule`, `compute.googleapis.com/Network`, `compute.googleapis.com/Subnetwork`, and 6 more |
| **Analytics** | `bigquery.googleapis.com/Dataset`, `bigquery.googleapis.com/Table`, `dataflow.googleapis.com/Job`, and 4 more |
| **Security & Operations** | `cloudkms.googleapis.com/KeyRing`, `secretmanager.googleapis.com/Secret`, `logging.googleapis.com/LogBucket` |

### Azure (89 resource types)

| Category | Count | Example Resource Types |
|----------|-------|----------------------|
| **Compute** | 18 | `Microsoft.Compute/virtualMachines`, `Microsoft.Compute/virtualMachineScaleSets`, `Microsoft.Compute/disks`, ... |
| **Storage** | 7 | `Microsoft.Storage/storageAccounts`, `Microsoft.DataLakeStore/accounts`, ... |
| **Database** | 10 | `Microsoft.Sql/servers`, `Microsoft.DocumentDB/databaseAccounts`, `Microsoft.Cache/redis`, ... |
| **AI/ML** | 5 | `Microsoft.MachineLearningServices/workspaces`, `Microsoft.CognitiveServices/accounts`, ... |
| **Networking** | 16 | `Microsoft.Network/virtualNetworks`, `Microsoft.Network/loadBalancers`, ... |
| **Containers & Kubernetes** | 4 | `Microsoft.ContainerService/managedClusters`, `Microsoft.ContainerRegistry/registries`, ... |
| **Analytics & Integration** | 11 | `Microsoft.Databricks/workspaces`, `Microsoft.DataFactory/factories`, ... |
| **Web & Application** | 6 | `Microsoft.Web/sites`, `Microsoft.Web/serverFarms`, ... |
| **Security & Identity** | 3 | `Microsoft.KeyVault/vaults`, `Microsoft.KeyVault/managedHSMs`, ... |
| **Monitoring** | 5 | `Microsoft.Insights/components`, `Microsoft.OperationalInsights/workspaces`, ... |
| **DevOps & DevCenter** | 4 | `Microsoft.DevCenter/devcenters`, `Microsoft.DevTestLab/labs`, ... |

The full list of all resource types is available in the tool's resource picker.

## Security and Privacy

This tool is 100% client-side. Your policies never leave your browser. We use Vercel Analytics for basic page view and Web Vitals tracking (privacy-friendly, GDPR-compliant, no cookies or personal data collected). No external API calls are made. Your tagging policies remain completely private.

## Contributing

Found a bug? Have a feature request? Open an issue on GitHub. Pull requests are welcome for bug fixes, new templates, or additional resource type support.

## License

MIT License. See [LICENSE](./LICENSE) for details.

---

<div align="center">

Built by [OptimNow](https://www.optimnow.io) for FinOps practitioners who know that good cost attribution starts with good tagging.

</div>
