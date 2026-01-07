# FinOps Tagging Policy Generator - User Manual

Welcome to the FinOps Tagging Policy Generator. This guide will walk you through everything you need to know to create effective tagging policies for cloud cost attribution.

**Live App:** [tagpolgenerator.optimnow.io](http://tagpolgenerator.optimnow.io/)

---

## What is this tool?

The FinOps Tagging Policy Generator helps you define tagging policies that answer the fundamental question every FinOps team faces: *who's spending what?*

Without consistent tagging, your cost reports are filled with "unallocated" spend. Finance can't charge back to the right departments. Engineering can't identify which services are driving costs. Nobody can answer "how much does Project X actually cost us?"

This tool solves that problem by letting you visually build tagging policies that specify which tags are required, what values are acceptable, and which resources need them. The output is a JSON policy file you can use with compliance checking tools or share with your teams as documentation.

Everything runs in your browser. No data leaves your machine, no API keys required, no backend to worry about.

---

## Getting Started

When you open the generator, you'll see two options:

**Create from Scratch** gives you a blank canvas or lets you pick from built-in templates designed for common FinOps scenarios. The templates include:

- **Cost Allocation** - The foundational tags for chargeback and showback: CostCenter, Owner, and Environment
- **Security & Compliance** - Adds DataClassification and compliance framework tags for organizations where security requirements overlap with cost governance
- **Minimal Starter** - A lightweight starting point for teams just beginning their FinOps journey

**Import AWS Policy** lets you paste an existing AWS Organizations tag policy and converts it into the generator's format. This is useful when you're evolving from basic AWS-native enforcement to a more sophisticated FinOps tagging strategy.

---

## The Policy Builder Interface

Once you're in the editor, you'll see a split-screen layout. The left side is where you build your policy; the right side shows a live JSON preview that updates as you make changes.

### Global Naming Rules

At the top of the builder, you'll find settings that apply to all tags in your policy:

**Case Sensitive** determines whether `CostCenter` and `costcenter` are treated as the same tag. Most organizations turn this off to avoid confusion and enforcement gaps.

**Allow Special Characters** controls whether tag names can include characters beyond letters, numbers, and standard separators. Keeping this off helps maintain consistency.

**Max Key Length** and **Max Value Length** set upper bounds for tag names and values. AWS defaults are 128 and 256 characters respectively, which work well for most organizations.

### Required Tags

These are the tags that must be present on resources for cost attribution to work. For each required tag, you configure:

**Name** is the tag key as it will appear on AWS resources. Stick with established conventions when possible. `CostCenter` is more recognizable than `cost_allocation_code`, and consistency helps when engineers move between teams or organizations.

**Description** explains what this tag is for. Good descriptions help engineers understand why they need to tag resources and what values to use. "Financial cost center code from SAP for department-level chargeback" is better than just "Cost center".

**Allowed Values** restricts what values are acceptable. For Environment tags, you might specify `production, staging, development`. For CostCenter, you'd typically leave this blank and use a regex pattern instead, since cost center codes follow a format but the actual values come from your finance system.

**Validation Regex** offers pattern-based validation for more flexible scenarios. Cost center codes often follow patterns like `CC-[0-9]{4,6}` or `FIN-[A-Z]{2}-[0-9]{3}`. Owner emails can be validated with standard email patterns. The generator includes a regex tester so you can verify patterns work before exporting.

**Common Regex Examples:**

| Use Case | Pattern | Example Matches |
|----------|---------|-----------------|
| Email Address | `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$` | `john.doe@company.com` |
| Cost Center | `^CC-[0-9]{4,6}$` | `CC-1234`, `CC-123456` |
| Project ID | `^[a-z0-9-]+$` | `my-project-123` |
| Application ID | `^APP-[A-Z0-9]{3,10}$` | `APP-WEB01`, `APP-BACKEND` |
| AWS Account ID | `^[0-9]{12}$` | `123456789012` |
| Ticket/JIRA Reference | `^[A-Z]+-[0-9]+$` | `PROJ-123`, `FINOPS-4567` |

**Applies To** specifies which AWS resource types require this tag. The most important resources for cost attribution are typically EC2 instances, RDS databases, and S3 buckets—these usually represent the bulk of your AWS spend.

### Optional Tags

Optional tags are recommendations rather than requirements. Use these for tags that would be nice to have but aren't essential for your core cost attribution needs. Project codes, team names, or application identifiers often fall into this category when you're just starting out.

As your tagging maturity improves, you might graduate optional tags to required status.

---

## Export Options

When your policy is ready, the Download button offers three formats:

**JSON** exports the raw policy file. This format works with the [FinOps Tag Compliance MCP Server](https://github.com/OptimNow/finops-tag-compliance-mcp) and integrates with other automation tools. The JSON structure is straightforward enough that you can parse it with any scripting language.

**AWS Tag Policy** exports a policy ready to paste directly into AWS Organizations. We do the heavy lifting for you: the generator automatically converts your resource selections into the correct AWS syntax, handles the differences between `enforced_for` and `report_required_tag_for`, and filters out services that don't support enforcement. No need to memorize AWS's quirky tag policy rules.

**Markdown** generates a human-readable document you can share with teams, include in wikis, or add to onboarding documentation. It's a great way to communicate tagging requirements without asking everyone to read JSON.

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

Use the Download button to save your work as JSON or Markdown. To continue editing later, you can import the JSON file using the Import AWS Policy feature (it accepts our format too, not just AWS native policies).

---

## Supported Resource Types

The generator supports 24+ AWS resource types organized by FinOps spend impact:

| Category | Resource Types |
|----------|----------------|
| **Compute** (40-60% of spend) | `ec2:instance`, `ec2:volume`, `ec2:snapshot`, `lambda:function`, `ecs:service`, `ecs:task-definition`, `eks:cluster`, `eks:nodegroup` |
| **Storage** (10-20% of spend) | `s3:bucket`, `elasticfilesystem:file-system`, `fsx:file-system` |
| **Database** (15-25% of spend) | `rds:db-instance`, `rds:cluster`, `dynamodb:table`, `elasticache:cluster`, `redshift:cluster`, `es:domain` |
| **AI/ML** | `sagemaker:endpoint`, `sagemaker:notebook-instance`, `bedrock:provisioned-model-throughput` |
| **Networking** | `elasticloadbalancing:loadbalancer`, `ec2:natgateway` |
| **Analytics** | `kinesis:stream`, `glue:job` |
| **All Other Resources** | Use the "All Other Resources" option to apply tags to services not explicitly listed |

The "Apply to All" checkbox selects all categories including "All Other Resources" for comprehensive coverage.

---

## Understanding FinOps Tagging in AWS

If you're new to FinOps tagging or want to understand how tagging fits into the broader AWS governance landscape, we've put together a reference document that covers the fundamentals.

**[FinOps Tagging in AWS](./doc/FINOPS_TAGGING_IN_AWS.md)** explains:

- Why tagging matters for cost attribution and accountability
- What good FinOps tagging looks like in practice
- How Tag Policies, Service Control Policies (SCPs), and auto-tagging work together
- Where to configure each mechanism in the AWS console
- How different teams typically divide tagging responsibilities

This background knowledge helps you make informed decisions when designing your tagging policy and understanding how it fits into your organization's broader cloud governance strategy.

---

## Tips for Success

**Start small.** Three required tags with good adoption beats fifteen tags that nobody uses. You can always add more tags as your practice matures.

**Write good descriptions.** Engineers are more likely to tag correctly when they understand why the tag exists and what values are appropriate.

**Use validation patterns.** Regex patterns catch typos and ensure consistency. A cost center code of `CC-1234` is much more useful than freeform text.

**Focus on high-spend resources first.** EC2 instances, RDS databases, and S3 buckets typically represent the majority of cloud spend. Get those tagged before worrying about every Lambda function.

**Communicate the why.** Share your tagging policy with engineering teams along with an explanation of how good tagging enables cost visibility, helps identify optimization opportunities, and ultimately benefits everyone.

---

## Need Help?

If you run into issues or have questions:

- Check the [README](./README.md) for technical setup and deployment instructions
- Open an issue on [GitHub](https://github.com/OptimNow/tagging-policy-generator/issues) for bugs or feature requests
- Visit [OptimNow](https://www.optimnow.io) for more FinOps resources

---

*Built by [OptimNow](https://www.optimnow.io) for FinOps practitioners who know that good cost attribution starts with good tagging.*
