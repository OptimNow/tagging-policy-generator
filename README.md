<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/Images/logo-darkbackground.png">
  <img src="public/Images/logo.png" alt="OptimNow" height="44">
</picture>

# FinOps Tagging Policy Generator

**Build a cloud tagging policy in minutes, so every line of your cloud bill has an owner.**

[![Open the app](https://img.shields.io/badge/Open%20the%20app-tagpolgenerator.optimnow.io-ACE849)](https://tagpolgenerator.optimnow.io/)
[![Clouds](https://img.shields.io/badge/Clouds-AWS%20%7C%20Azure%20%7C%20Google%20Cloud-2C2C2C)](#what-you-can-do-with-each-cloud)
[![Runs in your browser](https://img.shields.io/badge/Runs%20in-your%20browser-2C2C2C)](#your-data-stays-in-your-browser)
[![GitHub Stars](https://img.shields.io/github/stars/OptimNow/tagging-policy-generator?style=flat)](https://github.com/OptimNow/tagging-policy-generator/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

[**Open the app**](https://tagpolgenerator.optimnow.io/) · [User manual](./USER_MANUAL.md) · [Examples](./examples/)

</div>

---

<div align="center">
  <a href="https://www.loom.com/share/1d47b7390e2a4747ad8568e38d0fbf0e">
    <img src="https://cdn.loom.com/sessions/thumbnails/1d47b7390e2a4747ad8568e38d0fbf0e-a90537210ca2ffb5.gif" alt="Video walkthrough: building an AWS tag policy with the generator and applying it in AWS Organizations" width="640">
  </a>
  <p><em>Watch the walkthrough: build an AWS tag policy, then apply it in AWS Organizations.</em></p>
</div>

## What is a tagging policy?

Cloud providers let you attach **tags** to resources (Google Cloud calls them **labels**): short key-value notes such as `CostCenter = CC-1042`. Your cloud bill can then be split by those tags, between teams, products or budgets.

A **tagging policy** is the rulebook: which tags each resource must carry, which values are allowed, and which resource types the rules cover. Without one, tags drift, a large part of the bill ends up "unallocated", and showback or chargeback (reporting or billing costs back to each team) stops working.

This tool helps you write that rulebook without touching JSON, and turns it into a policy your cloud provider can apply.

## Get started in 3 steps

1. **[Open the app](https://tagpolgenerator.optimnow.io/)** and pick your cloud: AWS, Azure or Google Cloud.
2. **Choose a template** (Cost Allocation is a good first pick) or start blank, then adjust the tags. The app checks your policy as you go.
3. **Download** the result: a policy file for your cloud, a JSON file you can reload later, or a Markdown page to share with your engineers.

There's nothing to install and no account to create.

## Start with three tags

If you're new to FinOps, these three tags cover most of what finance and engineering need:

| Tag | The question it answers | Example value |
|---|---|---|
| `CostCenter` | Who pays for this? | `CC-1042` |
| `Owner` | Who do I ask about it? | `data-team@acme.com` |
| `Environment` | Is this production or a test? | `production` |

Once these are applied consistently, add `Application`, `Project` or `Team`. The [user manual](./USER_MANUAL.md#common-finops-tagging-patterns) explains when each one helps.

Keep the policy about cost. Security, backup and automation tags matter too, but they're easier to run as separate policies owned by those teams.

## What you can do with each cloud

| | AWS | Azure | Google Cloud |
|---|---|---|---|
| Build and check a policy | Yes | Yes | Yes |
| Ready-made templates | 4 | 4 | 4 |
| Resource types to pick from | 27 | 89 | 39 |
| Import an existing policy | AWS Organizations tag policy | Tagging bundle from this tool | Not available |
| Ready-to-deploy download | AWS Organizations tag policy | ARM template, deployed with one Azure CLI command | Not available: Google Cloud has no label policy format |

Before an AWS or Azure download, the app lists anything the target format can't express. For example, none of the three clouds can check a value against a pattern (a regular expression), so pattern rules are left out, and some AWS resource types can only be reported on, not enforced.

For Google Cloud, download the policy as JSON and use it with the [FinOps Tag Compliance MCP Server](https://github.com/OptimNow/finops-tag-compliance-mcp). An MCP server gives an AI assistant such as Claude extra tools; this one scans your cloud resources and reports which ones break the policy.

## Your data stays in your browser

The app has no backend. Your policy exists only in your browser tab until you download it, and nothing you type is sent anywhere.

The live site counts page views and measures page speed with [Vercel Web Analytics](https://vercel.com/docs/analytics), which sets no cookies and doesn't follow you across other sites. The page also loads fonts from Google Fonts and its styling from the Tailwind CDN, so those services receive a normal web request. Your light or dark theme choice is saved in your browser's local storage.

## Learn more

- **[User manual](./USER_MANUAL.md)**: every screen explained, step-by-step guides with video walkthroughs for AWS and Azure, and a guide for Google Cloud.
- **[Examples](./examples/)**: sample policies for a startup and an enterprise, plus sample AWS, Azure and Google Cloud files.
- **[FinOps tagging in AWS](./doc/FINOPS_TAGGING_IN_AWS.md)**: how tag policies, service control policies and automatic tagging fit together.

## Words you'll meet

| Term | What it means |
|---|---|
| Tag, label | A key-value note on a cloud resource. AWS and Azure say "tag", Google Cloud says "label". |
| Showback | Reporting cloud costs to each team, without billing them. |
| Chargeback | Billing each team for its share of the cloud bill. |
| Required, optional tag | A required tag must be present. An optional tag is recommended. |
| Deny, audit | Azure's two modes. Deny blocks a resource that breaks the policy; audit lets it through and flags it. |
| Enforce, report | AWS's two modes. Enforcement stops people from setting a tag to a value the policy doesn't allow; reporting lists resources that break the policy. |
| Regular expression | A pattern a value must follow, for example `CC-` followed by four digits. Only the generator's own JSON keeps these. |

## For developers

<details>
<summary><strong>Run it locally, the policy file format, and how to contribute</strong></summary>

### Run locally

You need Node.js 20.19 or later (or 22.12 or later).

```bash
git clone https://github.com/OptimNow/tagging-policy-generator.git
cd tagging-policy-generator
npm install
npm run dev
```

The app opens at `http://localhost:3000`. `npm run build` writes a static site to `dist/` that any web host can serve. `node test-providers.mjs` runs the converter and validator smoke tests.

### Policy file format

The generator's own JSON looks like this:

```json
{
  "version": "1.0",
  "last_updated": "2026-09-13T12:00:00Z",
  "cloud_provider": "aws",
  "required_tags": [
    {
      "name": "Environment",
      "description": "Deployment environment for cost segmentation",
      "allowed_values": ["production", "staging", "development"],
      "validation_regex": null,
      "applies_to": ["ec2:instance", "rds:db", "s3:bucket"]
    }
  ],
  "optional_tags": [
    {
      "name": "Project",
      "description": "Project code for project-based cost tracking",
      "allowed_values": null
    }
  ],
  "tag_naming_rules": {
    "case_sensitivity": false,
    "allow_special_characters": false,
    "max_key_length": 128,
    "max_value_length": 256
  }
}
```

| Field | What it holds |
|---|---|
| `cloud_provider` | `aws`, `gcp` or `azure`. It drives resource types, naming rules, validation and export formats |
| `required_tags` | Tags that must be present, each with `name`, `description`, `allowed_values`, `validation_regex` and `applies_to` (the resource types it covers) |
| `optional_tags` | Recommended tags, each with `name`, `description` and `allowed_values` |
| `tag_naming_rules` | Case sensitivity, special characters, and maximum key and value lengths |
| `last_updated` | Set when you download the file |

The [`examples/`](./examples/) folder has complete files, and [CLAUDE.md](./CLAUDE.md) describes the architecture.

### Contributing

Found a bug or have an idea? [Open an issue](https://github.com/OptimNow/tagging-policy-generator/issues). Pull requests are welcome, especially new templates and resource types. Please run `node test-providers.mjs` before opening one.

</details>

## About OptimNow

OptimNow is a boutique FinOps consultancy helping organisations connect cloud and AI spend to measurable business value. Based in France with European reach.

- Website: [optimnow.io](https://optimnow.io)
- LinkedIn: [OptimNow](https://linkedin.com/company/optimnow)
- GitHub: [github.com/OptimNow](https://github.com/OptimNow)

**More open-source tools from OptimNow:**

| Tool | What it does |
|---|---|
| [FinOps Tag Compliance MCP Server](https://github.com/OptimNow/finops-tag-compliance-mcp) | Checks your cloud resources against the policies you build here |
| [Cloud FinOps Skill & MCP](https://github.com/OptimNow/cloud-finops-skills) | FinOps knowledge for AI assistants: cloud and AI cost, allocation, chargeback, waste detection |
| [OptimToken](https://optimtoken.optimnow.io) | Compare what 250+ AI models cost per request, plus compute instance prices across seven clouds |
| [AI ROI Calculator](https://airoicalculator.optimnow.io) | Whether an AI project pays for itself: payback, break-even and sensitivity |
| [AI Cost Readiness Assessment](https://aicostsfinops.optimnow.io) | Where your organisation stands on AI cost management |

## License

[MIT](./LICENSE). Free to use, change and share, including commercially.
