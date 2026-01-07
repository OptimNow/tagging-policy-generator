<div align="center">
  
# FinOps Tagging Policy Generator 

**A visual tool for FinOps practitioners to create tagging policies that enable accurate cloud cost attribution.**

[Try It Out](#getting-started) · [User Guide](#how-to-use-the-policy-builder) · [Examples](./examples/)

</div>

---

## Why This Tool Exists

Cloud cost management starts with knowing who's spending what. Without consistent tagging, your cost reports are filled with "unallocated" spend, and finance teams can't charge back to the right departments. Engineering can't identify which services are driving costs. Nobody can answer "how much does Project X actually cost us?"

This tool helps you define tagging policies that solve that problem. It's laser-focused on FinOps use cases: cost centers, ownership, environments, business units, and the other tags that make showback and chargeback possible. While tags can serve many purposes (security classification, operations automation, compliance), this generator is designed specifically for the tags that enable cost attribution.

The generator runs entirely in your browser—no data leaves your machine, no API keys required, no backend to maintain. Just open it up and start building.

## What This Tool Does

The FinOps Tagging Policy Generator creates JSON policy files that define your organization's cost attribution tags. These policies specify which tags are required on which resources, what values are acceptable, and how tag names should be formatted.

The output is designed to work with the [FinOps Tag Compliance MCP Server](https://github.com/OptimNow/finops-tag-compliance-mcp), but the JSON format is straightforward enough to integrate with any compliance checking system you might be using.

A typical cost attribution policy looks like this:

```json
{
  "version": "1.0",
  "last_updated": "2025-01-04T12:00:00Z",
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

## Prerequisites

You'll need **Node.js** installed on your machine. Version 18 or later is recommended, though earlier versions may work. That's it—no database, no cloud credentials, no external services.

To check your Node version:
```bash
node --version
```

## Getting Started

Clone the repository and install dependencies:

```bash
git clone https://github.com/OptimNow/tagging-policy-generator.git
cd tagging-policy-generator
npm install
```

Start the development server:

```bash
npm run dev
```

Open your browser to `http://localhost:3000` and you're ready to go.

For production deployments, build the optimized version:

```bash
npm run build
npm run preview  # Test the production build locally
```

The `dist/` folder contains static files you can deploy to any web server, CDN, or hosting platform like Vercel, Netlify, or GitHub Pages.

## How to Use the Policy Builder

### Starting a New Policy

When you first open the app, you'll see two paths forward:

**Create from Scratch** lets you start with a blank policy or pick from one of the built-in templates. The templates are designed for common FinOps scenarios:

- **Cost Allocation** includes CostCenter, Owner, and Environment—the foundational tags for any chargeback or showback program
- **Security & Compliance** adds DataClassification and compliance framework tags (useful when security requirements overlap with cost governance)
- **Minimal Starter** provides a lightweight starting point for organizations just beginning their FinOps journey

**Import AWS Policy** takes an existing AWS Organizations tag policy and converts it into the generator's format. This is useful when you're evolving from basic AWS-native enforcement to a more sophisticated FinOps tagging strategy.

### The Policy Builder Interface

The editor uses a split-screen layout. The left side is where you build your policy; the right side shows a live JSON preview that updates as you make changes.

#### Global Naming Rules

At the top, you'll find settings that apply to all tags:

- **Case Sensitive** determines whether `CostCenter` and `costcenter` are treated as the same tag
- **Allow Special Characters** controls whether tag names can include characters beyond letters, numbers, and standard separators
- **Max Key Length** and **Max Value Length** set upper bounds for tag names and values (AWS defaults are 128 and 256)

#### Required Tags

These are the tags that must be present on resources for cost attribution to work. For each required tag, you configure:

**Name** is the tag key as it will appear on AWS resources. Stick with established conventions when possible—`CostCenter` is more recognizable than `cost_allocation_code`.

**Description** explains what this tag is for. Good descriptions help engineers understand why they need to tag resources and what values to use. "Financial cost center code from SAP for department-level chargeback" is better than "Cost center".

**Allowed Values** restricts what values are acceptable. For Environment tags, you might specify `production, staging, development`. For CostCenter, you'd typically leave this blank and use a regex pattern instead, since cost center codes follow a format but the actual values come from your finance system.

**Validation Regex** offers pattern-based validation. Cost center codes often follow patterns like `CC-[0-9]{4,6}` or `FIN-[A-Z]{2}-[0-9]{3}`. Owner emails can be validated with standard email patterns. The regex is tested in real-time so you can verify it works before exporting.

**Applies To** specifies which AWS resource types require this tag. The most important resources for cost attribution are typically EC2 instances, RDS databases, and S3 buckets—these usually represent the bulk of your AWS spend.

#### Optional Tags

Optional tags are recommendations rather than requirements. Use these for tags that would be nice to have but aren't essential for your core cost attribution needs. Project codes, team names, or application identifiers often fall into this category when you're just starting out.

### Export Options

The Download button offers two formats:

- **JSON** exports the raw policy file for use with the FinOps Tag Compliance MCP Server or other automation tools
- **Markdown** generates a human-readable document you can share with teams or include in documentation

### Saving and Loading Policies

Policies are not saved automatically or stored anywhere. This is intentional: your tagging strategy is yours, and nothing is transmitted to external servers. Use the Download button to save your work, and the Import function to load it back later.

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

**aws-policy-example.json** demonstrates the AWS Organizations tag policy format, useful for testing the import feature.

## Policy Schema Reference

The complete policy structure:

```
{
  version           : string    // Policy version identifier (e.g., "1.0")
  last_updated      : string    // ISO 8601 timestamp, auto-updated
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

| Service | Resource Types |
|---------|----------------|
| EC2     | `ec2:instance`, `ec2:volume`, `ec2:snapshot` |
| RDS     | `rds:db` |
| S3      | `s3:bucket` |
| Lambda  | `lambda:function` |
| ECS     | `ecs:service`, `ecs:task` |

## Security and Privacy

This tool is 100% client-side. Your policies never leave your browser. There are no analytics, no tracking, no external API calls. The only network requests are loading the application itself.

## Contributing

Found a bug? Have a feature request? Open an issue on GitHub. Pull requests are welcome for bug fixes, new templates, or additional resource type support.

## License

MIT License. See [LICENSE](./LICENSE) for details.

---

<div align="center">

Built by [OptimNow](https://www.optimnow.io) for FinOps practitioners who know that good cost attribution starts with good tagging.

</div>
