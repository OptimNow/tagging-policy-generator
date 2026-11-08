# tagging-policy-generator: design reference

Sections moved verbatim from `CLAUDE.md` on 2026-11-08 to keep that file short. `CLAUDE.md`
keeps what an agent needs in every session and lists the sections below.

## Architecture Overview

### Application Structure

This is a single-page application with two main views managed by state:

1. **Start View** (`view === 'start'`): Landing page with options:
   - Create from scratch with AWS/GCP/Azure provider toggle (with optional provider-specific templates)
   - Import from an AWS Organizations tag policy, or from an Azure ARM tagging bundle. Either import card also reloads a policy JSON saved from this tool
   - Export to AWS Organizations format, or to an Azure ARM tagging bundle

   **GCP has no import/export card.** GCP is a first-class authoring provider (toggle, templates, naming rules, validation, native JSON preview), but `gcp-converter.ts` and `downloadGcpPolicy` are not wired into `App.tsx`. Only AWS and Azure have native round-trips in the UI.

2. **Editor View** (`view === 'editor'`): Split-screen policy builder
   - Left panel: Form-based policy editor
   - Right panel: Live JSON preview with validation status

Navigation uses browser history API (pushState/popState) so back/forward buttons work correctly.

### Core Data Flow

```
Policy (types.ts) — includes cloud_provider: 'aws' | 'gcp' | 'azure'
  ↓
App.tsx (state management, provider-aware routing)
  ↓
├─> TagForm.tsx (individual tag editor, provider-aware resource categories)
├─> validator.ts (real-time validation with provider-specific rules)
├─> exporter.ts (JSON/Markdown/AWS/Azure downloads; GCP handler exists but is unused)
├─> converter.ts (AWS Organizations ↔ MCP format conversion)
├─> gcp-converter.ts (GCP Label Policy ↔ MCP; not wired into App.tsx)
├─> azure-converter.ts (Azure ARM tagging bundle ↔ MCP format conversion)
└─> native-import.ts (reloads a policy JSON saved from this tool)
```

### Key Type Definitions (types.ts)

- `CloudProvider`: `'aws' | 'gcp' | 'azure'` — discriminator for all provider-specific behavior
- `Policy`: Root data structure with `cloud_provider`, version, timestamps, required_tags, optional_tags, and tag_naming_rules
- `RequiredTag`: Tags that must be present; includes `applies_to` field specifying resource types (AWS, GCP, or Azure format)
- `OptionalTag`: Recommended tags; no `applies_to` or `validation_regex` fields
- `AWS_RESOURCE_CATEGORIES`: 27 AWS resource types organized by FinOps spend impact (6 categories)
- `GCP_RESOURCE_CATEGORIES`: 39 GCP resource types organized by FinOps spend impact (7 categories — includes Security & Operations)
- `AZURE_RESOURCE_CATEGORIES`: 89 Azure resource types organized by FinOps spend impact (11 categories — Compute, Storage, Database, AI/ML, Networking, Containers & Kubernetes, Analytics & Integration, Web & Application, Security & Identity, Monitoring, DevOps & DevCenter)
- `RESOURCE_CATEGORIES`: Backward-compatible alias for `AWS_RESOURCE_CATEGORIES`
- `getResourceCategories(provider)` / `getResourceTypes(provider)`: Helper functions for provider-aware resource lookups (switch on `'aws'`, `'gcp'`, `'azure'`)
- `DEFAULT_NAMING_RULES`: per-provider naming-rule defaults (AWS 128/256, GCP 63/63, Azure 512/256)

### Service Modules

**services/templates.ts**
- 12 pre-built policy templates: 4 AWS + 4 GCP + 4 Azure (Cost Allocation, Startup, Enterprise, Minimal Starter for each)
- Each template has a `provider: CloudProvider` field to filter by selected provider
- AWS templates use `enforced_for` resource type names (e.g., `ec2:instance`, `rds:db`)
- GCP templates use `snake_case` label keys and full resource URIs (e.g., `compute.googleapis.com/Instance`)
- Azure templates use PascalCase tag names and `Microsoft.*` resource types (e.g., `Microsoft.Compute/virtualMachines`)

**services/validator.ts**
- Real-time validation triggered on every policy change
- Checks: required tag existence, duplicate names, empty fields, valid regex patterns, resource type selection
- Provider-aware: validates `applies_to` entries against the policy's `cloud_provider` resource list
- GCP-specific rules: label keys must be lowercase (`^[a-z][a-z0-9_-]*$`), max 63 chars for keys and values
- Azure-specific rules: tag names cannot contain `<>%&\?/`, max 512 chars for keys (128 when the tag applies to storage accounts), max 256 chars for values, max 50 tags per resource. It also rejects names starting with `microsoft`, `azure` or `windows`; Microsoft's tag limits don't include that rule, and it is an open review finding
- Defaults missing `cloud_provider` to `'aws'` for backward compatibility
- Returns array of error strings displayed in UI footer

**services/converter.ts**
- Bidirectional conversion between internal format and AWS Organizations Tag Policy format
- **AWS → Internal**: Parses AWS policy JSON and throws if there's no top-level `tags` object. A tag is required when it has `enforced_for` or `report_required_tag_for`. `applies_to` comes from the exact types in both lists; a `service:ALL_SUPPORTED` wildcard expands to the app's types only for services with no exact type listed, so the tool's own exports round-trip exactly. Sets `cloud_provider: 'aws'`
- **Internal → AWS**: `enforced_for` lists each selected type AWS can enforce on its own. `rds:db`, the EKS types and EFS can only be enforced through `<service>:ALL_SUPPORTED`; SageMaker, Bedrock, Glue and Kinesis are reporting-only. `report_required_tag_for` lists every selected type AWS recognises. `getAwsExportWarnings()` reports widened, reporting-only and unknown types as limitations
- **Important**: AWS Tag Policies don't support regex validation, only `allowed_values`. Export warns users about feature loss.
- `ENFORCEABLE_RESOURCE_TYPES` and `SERVICES_WITH_WILDCARD_ENFORCEMENT` come from the AWS "Resources that support enforcement in tag policies" table (checked September 2026). Update them from that table, not by guessing. The current table no longer lists `eks:cluster`, `kinesis:stream` or `elasticfilesystem:file-system`, which `AWS_RESOURCE_CATEGORIES` still offers

**services/gcp-converter.ts**
- Bidirectional conversion between internal format and GCP Label Policy format
- **GCP → Internal**: Parses GCP label policy JSON, maps `enforced_for` to `applies_to`, `required` flag to required/optional tags; sets `cloud_provider: 'gcp'`
- **Internal → GCP**: Converts to GCP format, auto-lowercases label keys, caps lengths at 63
- **Important**: GCP Label Policies don't support regex validation. Export warns about regex loss, uppercase key conversion, and length limits.
- `getGcpExportWarnings()`: returns a `CategorizedExportWarnings` object
- **Not reachable from the UI**: this module is complete and tested, but `App.tsx` imports neither its converters nor its warnings. Wiring GCP back into the start view means adding import/export cards and a download entry.

**services/azure-converter.ts**
- Bidirectional conversion between internal format and a **deployable ARM template bundle** (not a bare Policy Initiative)
- **Internal → Azure**: `convertMcpToAzurePolicy()` returns an `AzureArmTemplate` (`$schema`, `contentVersion`, `metadata`, `resources[]`) using the subscription-scope schema `subscriptionDeploymentTemplate.json`. It emits two reusable custom definitions (`require-tag-on-resources`, `require-tag-and-value-on-resources`) plus one initiative (`tagging-governance-initiative`), with `effect: 'deny'` for required tags and `'audit'` for optional ones. Each rule is scoped by a `resourceTypes` parameter (the tag's `applies_to`; empty means every taggable type), and the initiative adds one built-in "Inherit a tag from the resource group if missing" reference per tag. `metadata.cliExample` carries the deploy command: `az deployment sub create --location <region> --template-file azure_tagging_bundle.json`
- **Azure → Internal**: `convertAzurePolicyToMcp()` accepts either an ARM deployment template (with `resources[]`) or a standalone `Microsoft.Authorization/policySetDefinitions` object produced by this tool. Maps `effect: 'audit'` → optional, anything else → required; sets `cloud_provider: 'azure'`. Other shapes are rejected with an explicit error. Reads `resourceTypes` back into `applies_to` (missing or empty becomes the full Azure catalogue, which is how older bundles behaved) and skips every known inheritance built-in, including two wrong GUIDs that older versions emitted
- `generateAzurePortalJson()`: builds a single-tag policy rule for copy/paste into the Azure portal. Used by **TagForm.tsx**, not by the export path. It carries the same `resourceTypes` scope and is not ARM-escaped, because the portal takes the rule directly
- **Important**: Azure Policy doesn't support regex validation. Export warns about regex loss, tag limits, deployment scope, managed resource groups (AKS, Databricks, Synapse, Azure ML), and residual FOCUS cost-export gaps
- `getAzureExportWarnings()`: returns a `CategorizedExportWarnings` object, not a flat list

**services/native-import.ts**
- `tryParseNativePolicy(text)` recognises a policy JSON saved from this tool and returns it normalised (missing `cloud_provider` becomes `'aws'`, missing naming rules come from `DEFAULT_NAMING_RULES`), or `null` for any other format

**services/exporter.ts**
- Exposes five handlers: `downloadJson` (native, filename is provider-aware), `downloadMarkdown` (includes Cloud Provider line), `downloadAwsPolicy` (`aws_tag_policy.json`), `downloadGcpPolicy` (`gcp_label_policy.json`), `downloadAzurePolicy` (`azure_tagging_bundle.json`)
- **Only four are called**: `App.tsx` does not import `downloadGcpPolicy`
- Uses browser download API (createElement('a'), setAttribute, click, remove)

### Component Architecture

**App.tsx**
- Central state container for the entire `Policy` object
- Manages view switching, template application, import/export (AWS and Azure only), and history navigation. Both import cards try `tryParseNativePolicy()` first, so a policy JSON saved from the tool reloads whatever its provider
- Tracks unsaved work against a snapshot taken on load and on download: warns on refresh or tab close (`beforeunload`), asks before a template, import or blank start replaces changed work, and shows a "Resume editing" banner on the start view
- `selectedProvider` state controls 3-way provider toggle on start view; `policy.cloud_provider` drives editor behavior
- Provider badge (orange=AWS, blue=GCP, purple=Azure) shown in editor header
- Template dropdown and download menu filter by `policy.cloud_provider`
- Start view: two-column grid (`md:grid-cols-2`) holding four cards, AWS import/export and Azure import/export
- Holds `CategorizedExportWarnings` state and renders `ExportWarningsModal` before every native download
- `last_updated` timestamp is stamped at export-time only (not during editing) to avoid render-loop issues
- useEffect hooks for: history management (respects `#editor` deep-links), click-outside detection, validation on changes

**components/TagForm.tsx**
- Collapsible card for editing individual tags (required or optional). The header title is a disclosure button inside an `h3` (accordion pattern), so it works from the keyboard
- `applies_to` entries that no checkbox represents (from imports or older files) are listed as removable chips
- Accepts `cloudProvider: CloudProvider` prop; uses `getResourceCategories()`/`getResourceTypes()` for provider-aware resource selection
- Features:
  - Live regex testing with input field and Run button
  - Resource type selection organized by categories with expand/collapse
  - Category-level checkboxes for bulk selection
  - Visual indicators for partial selections (opacity on indeterminate state)
  - Grid layout adapts: `grid-cols-2` for AWS (short names), `grid-cols-1` for GCP/Azure (long URIs)
  - Placeholder text adapts: `e.g. CostCenter` (AWS/Azure) vs `e.g. cost_center` (GCP)
- State: `isExpanded`, `testRegexInput`, `regexTestResult`, `expandedCategories`, `azureCopied`
- `expandedCategories` resets when `cloudProvider` changes

**components/ExportWarningsModal.tsx**
- Confirmation dialog shown before a native (AWS/Azure) download completes
- Takes a `CategorizedExportWarnings` and renders its two groups separately: `limitations` (features lost in the target format) and `deploymentNotes` (operational and scope guidance, not feature loss)
- The user can cancel or proceed; proceeding triggers the stored `download` callback

**components/Input.tsx** & **components/Button.tsx**
- Shared styled components with theme support
- Checkbox component includes visual checked/unchecked states
- Button's `unstyled` variant sets no colours. Use it when a caller supplies its own colours: Tailwind resolves conflicting utilities by stylesheet order, so overriding another variant's colours through `className` is unreliable

**context/ThemeContext.tsx**
- Global dark/light theme toggle
- Persists to localStorage
- Provides `theme` and `toggleTheme` to all components via React Context

## Cloud Provider Integration

The tool bridges the internal MCP format with native policy formats for AWS, GCP, and Azure.

**Internal MCP Format (shared):**
- Flexible: supports regex validation, specific resource types per tag, optional vs required distinction
- `cloud_provider` field discriminates AWS vs GCP vs Azure behavior throughout the app
- Used by FinOps Tag Compliance MCP Server

### AWS Organizations Tag Policy Format (converter.ts)

- Uses `@@assign` operators for policy inheritance
- `enforced_for`: Blocks non-compliant operations. Accepts individual resource types that AWS can enforce, or `<service>:ALL_SUPPORTED`
- `report_required_tag_for`: Drives compliance reporting (accepts specific resource types)
- Limitations: No regex support; some types can only be enforced service-wide, and some can only be reported on
- Key helpers:
  - `normaliseResourceType()`: Maps older or alternative names to AWS's (e.g., `rds:db-instance` → `rds:db`, `efs:` → `elasticfilesystem:`)
  - `resolveAppliesTo()`: Import. Combines the exact types from both lists; expands a `service:ALL_SUPPORTED` wildcard only for services with no exact type
  - `planEnforcement()`: Export. Splits `applies_to` into individually enforced types, services widened to `ALL_SUPPORTED`, reporting-only types and unknown types

### GCP Label Policy Format (gcp-converter.ts)

- Custom JSON format designed for import/export (GCP has no direct equivalent to AWS Organizations Tag Policies)
- Structure: `{ label_policy: { labels: { ... }, naming_rules: { ... } } }`
- Each label has: `label_key`, `description`, `allowed_values`, `enforced_for` (resource types), `required` (boolean)
- Limitations: No regex support, keys must be lowercase, max 63 chars for keys and values
- Lowercases keys on export and replaces any character outside `a-z0-9_-` with an underscore
- Resource types use full GCP URIs (e.g., `compute.googleapis.com/Instance`)

### Azure ARM Tagging Bundle (azure-converter.ts)

The export target is a **deployable ARM template**, not a raw policy document. Downloading it and running the CLI line in `metadata.cliExample` is meant to work with no hand-editing.

- Schema: `subscriptionDeploymentTemplate.json` (subscription scope). It does not deploy at management-group scope: that needs the management-group schema and `extensionResourceId()` references instead of `resourceId()`
- `resources[]` contains, in order:
  1. `Microsoft.Authorization/policyDefinitions` named `require-tag-on-resources`, parameters `tagName` (String), `resourceTypes` (Array, default empty = every taggable type) and `effect` (String, allowed `audit`/`deny`/`disabled`, default `deny`)
  2. `Microsoft.Authorization/policyDefinitions` named `require-tag-and-value-on-resources`, same parameters plus `allowedValues` (Array). Emitted only when a tag has allowed values
  3. `Microsoft.Authorization/policySetDefinitions` named `tagging-governance-initiative`: one rule reference per tag, then one reference per tag to the built-in "Inherit a tag from the resource group if missing" (`ea3f2387…`). The overwrite variants and the subscription variant are left out on purpose: overwrites change values set on resources, and two Modify policies writing the same tag make Azure deny the request
- Required tags are bound to `effect: 'deny'`, optional tags to `'audit'`. Reference IDs are sanitised to ARM-safe characters (letters, digits, hyphens, underscores) and suffixed when two tags would collide
- Policy-rule expressions, and user values shaped like `[...]`, are written as `[[...]`. ARM evaluates any bracketed string at deployment time, so unescaped policy expressions break the deployment
- Default download filename: `azure_tagging_bundle.json`
- Limitations: No regex support, tag names max 512 chars, values max 256 chars, max 50 tags per resource
- Resource types use `Microsoft.*` namespace format (e.g., `Microsoft.Compute/virtualMachines`)

Note: an earlier version emitted `tagInheritanceRecommendations` and `managedResourceGroupNotes` alongside the definitions. Both were removed in the ARM refactor, because a deployable template cannot carry arbitrary advisory keys. That guidance now reaches the user through `getAzureExportWarnings()` and the export modal instead.

