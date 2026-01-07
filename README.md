<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# AWS Tagging Policy Generator

**A visual tool for FinOps teams to create, validate, and export standardized AWS tagging policies.**

[Try It Out](#getting-started) · [User Guide](#how-to-use-the-policy-builder) · [Examples](./examples/)

</div>

---

If you've ever inherited an AWS account with resources named `test-server-2-final-FINAL` and no idea who created it or what it costs, you understand why tagging policies matter. This tool helps you build those policies without wrestling with raw JSON or memorizing AWS schema formats.

The generator runs entirely in your browser—no data leaves your machine, no API keys required, no backend to maintain. Just open it up and start building.

## What This Tool Does

The AWS Tagging Policy Generator creates JSON policy files that define your organization's tagging standards. These policies specify which tags are required on which resources, what values are acceptable, and how tag names should be formatted.

The output is designed to work with the [FinOps Tag Compliance MCP Server](https://github.com/OptimNow/finops-tag-compliance-mcp), but the JSON format is straightforward enough to integrate with any compliance checking system you might be using.

A typical policy you'll generate looks like this:

```json
{
  "version": "1.0",
  "last_updated": "2025-01-04T12:00:00Z",
  "required_tags": [
    {
      "name": "Environment",
      "description": "Deployment environment for the resource",
      "allowed_values": ["production", "staging", "development"],
      "validation_regex": null,
      "applies_to": ["ec2:instance", "rds:db", "s3:bucket", "lambda:function"]
    },
    {
      "name": "Owner",
      "description": "Email of the person responsible for this resource",
      "allowed_values": null,
      "validation_regex": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      "applies_to": ["ec2:instance", "rds:db", "s3:bucket"]
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

**Create from Scratch** lets you start with a blank policy or pick from one of the built-in templates. The templates are designed for common scenarios:

- **Cost Allocation** includes CostCenter, Owner, and Environment tags—the essentials for tracking who's spending what
- **Security & Compliance** adds DataClassification, Compliance framework tags, and Owner for audit trails
- **Minimal Starter** provides a lightweight starting point you can build on

**Import AWS Policy** takes an existing AWS Organizations tag policy (the JSON format you'd get from the AWS console) and converts it into the generator's format. Paste your policy JSON into the text area and click Import & Convert. This is handy when you're migrating from AWS-native policies or want to use an existing policy as a starting point.

### The Policy Builder Interface

Once you're in the editor, you'll see a split-screen layout. The left side is where you build your policy; the right side shows a live JSON preview that updates as you make changes.

#### Global Naming Rules

At the top, you'll find settings that apply to all tags in your policy:

- **Case Sensitive** determines whether `Environment` and `environment` are treated as the same tag
- **Allow Special Characters** controls whether tag names can include characters beyond letters, numbers, and standard separators
- **Max Key Length** and **Max Value Length** set upper bounds for tag names and values (AWS defaults are 128 and 256 respectively)

#### Required Tags

These are the tags that must be present on resources for compliance. For each required tag, you can configure:

**Name** is the tag key as it will appear on AWS resources. Keep it concise but descriptive—`CostCenter` rather than `cost_center_code`.

**Description** explains what this tag is for and helps team members understand how to use it. Good descriptions reduce confusion and support tickets.

**Allowed Values** restricts what values are acceptable. You can leave this blank to allow any value, or provide a comma-separated list like `production, staging, development`. When you specify allowed values, any other value will fail validation.

**Validation Regex** offers more flexible validation when a simple list won't do. Use this for patterns like email addresses (`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`) or cost center codes (`^CC-[0-9]{4,6}$`). The regex is tested in real-time so you can verify it works before exporting.

**Applies To** specifies which AWS resource types this tag is required on. Check the boxes for the resource types you want to enforce. Available options include:
- EC2 instances, volumes, and snapshots
- RDS databases
- S3 buckets
- Lambda functions
- ECS services and tasks

This granularity lets you require `DataClassification` on S3 buckets and RDS databases (where sensitive data lives) without forcing it onto every EC2 instance.

#### Optional Tags

These work the same as required tags, minus the resource type selection. Optional tags are recommendations rather than requirements—they'll appear in your policy documentation but won't trigger compliance failures when missing.

Use optional tags for things you'd like people to add but won't block deployments over, like `Project` codes or `MaintenanceWindow` preferences.

### Validation and Export

The right panel does more than show your JSON—it validates your policy in real-time. Look for the status bar at the bottom:

A green "Policy Valid" message means everything checks out. You can download the JSON file or copy it to your clipboard using the buttons in the toolbar.

Red validation errors tell you what needs fixing before you can export. Common issues include:
- Tags with no name
- Invalid regex patterns that won't compile
- Required tags with no resource types selected

Fix the issues in the left panel and watch the errors disappear.

### Saving and Loading Policies

The **Download** button saves your policy as `tagging_policy.json`. To load a previously saved policy, use the Import function on the start screen—paste the JSON contents and import it back into the editor.

Policies are not saved automatically or stored anywhere. This is intentional: your tagging strategy is yours, and nothing is transmitted to external servers.

## Working with AWS Organizations Policies

If your organization already uses AWS Organizations tag policies, you can convert them to this tool's format for editing. The AWS policy format looks different—it uses constructs like `@@assign` to define values and enforcement:

```json
{
  "tags": {
    "CostCenter": {
      "tag_key": { "@@assign": "CostCenter" },
      "tag_value": { "@@assign": ["Engineering", "Marketing", "Sales"] },
      "enforced_for": { "@@assign": ["ec2:*", "rds:*", "s3:*"] }
    }
  }
}
```

The import function parses this format and maps it to the generator's structure:
- Tags with `enforced_for` become required tags
- Tags without enforcement become optional tags
- Wildcards like `ec2:*` are expanded to specific resource types

After importing, you can modify the policy freely and export the updated version.

## Example Policies

The `examples/` folder contains sample policies for different organizational needs:

**startup-policy.json** is a lightweight policy for smaller organizations. It requires just three tags (Environment, Owner, Project) and suggests two optional ones. Perfect for teams that need basic cost tracking without bureaucratic overhead.

**enterprise-policy.json** is comprehensive. Seven required tags covering cost centers, environments, ownership, applications, data classification, compliance frameworks, and business units. Six optional tags for projects, support tiers, backup schedules, and more. Use this as a reference for building out enterprise-grade tagging strategies.

**aws-policy-example.json** demonstrates the AWS Organizations format, useful for testing the import feature.

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

This design was intentional—tagging policies often reflect organizational structure and compliance requirements. That information should stay with you.

## Contributing

Found a bug? Have a feature request? Open an issue on GitHub. Pull requests are welcome for bug fixes, new templates, or additional resource type support.

## License

MIT License. See [LICENSE](./LICENSE) for details.

---

<div align="center">

Built for FinOps teams who believe in tagging before it's too late.

</div>
