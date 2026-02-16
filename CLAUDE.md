# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The FinOps Tagging Policy Generator is a client-side React/TypeScript web application that helps FinOps practitioners create tagging/labeling policies for cloud cost attribution across **AWS, GCP, and Azure**. The tool runs entirely in the browser with no backend, and generates JSON policy files compatible with the FinOps Tag Compliance MCP Server.

**Live app:** http://tagpolgenerator.optimnow.io/

## Development Commands

```bash
# Development
npm run dev          # Start dev server on http://localhost:3000 (note: port configured to 3000, not default 5173)

# Production
npm run build        # Build for production (outputs to dist/)
npm run preview      # Preview production build locally
```

**No test suite is currently configured.** There is no linting or testing setup in package.json.

## Architecture Overview

### Application Structure

This is a single-page application with two main views managed by state:

1. **Start View** (`view === 'start'`): Landing page with options:
   - Create from scratch with AWS/GCP/Azure provider toggle (with optional provider-specific templates)
   - Import from AWS Organizations tag policy, GCP label policy, or Azure Policy Initiative
   - Export to AWS Organizations format, GCP label policy format, or Azure Policy Initiative format

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
├─> exporter.ts (JSON/Markdown/AWS/GCP/Azure downloads)
├─> converter.ts (AWS Organizations ↔ MCP format conversion)
├─> gcp-converter.ts (GCP Label Policy ↔ MCP format conversion)
└─> azure-converter.ts (Azure Policy Initiative ↔ MCP format conversion)
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
- Azure-specific rules: tag names cannot contain `<>%&\?/`, cannot use reserved prefixes (`microsoft`, `azure`, `windows`), max 512 chars for keys, max 256 chars for values, max 50 tags per resource
- Defaults missing `cloud_provider` to `'aws'` for backward compatibility
- Returns array of error strings displayed in UI footer

**services/converter.ts**
- Bidirectional conversion between internal format and AWS Organizations Tag Policy format
- **AWS → Internal**: Parses AWS policy JSON, extracts tags from `enforced_for` arrays, maps service wildcards to resource types; sets `cloud_provider: 'aws'`
- **Internal → AWS**: Converts to AWS format with both `enforced_for` (enforcement) and `report_required_tag_for` (reporting)
- **Important**: AWS Tag Policies don't support regex validation, only `allowed_values`. Export warns users about feature loss.
- `SERVICES_WITH_ENFORCEMENT_SUPPORT`: Only services with "Enforcement Mode: Yes" can be used in `enforced_for`

**services/gcp-converter.ts**
- Bidirectional conversion between internal format and GCP Label Policy format
- **GCP → Internal**: Parses GCP label policy JSON, maps `enforced_for` to `applies_to`, `required` flag to required/optional tags; sets `cloud_provider: 'gcp'`
- **Internal → GCP**: Converts to GCP format, auto-lowercases label keys, caps lengths at 63
- **Important**: GCP Label Policies don't support regex validation. Export warns about regex loss, uppercase key conversion, and length limits.
- `getGcpExportWarnings()`: Generates warnings about features that won't be preserved

**services/azure-converter.ts**
- Bidirectional conversion between internal format and Azure Policy Initiative format
- **Azure → Internal**: Parses Azure Policy Initiative JSON (policyDefinitions array) or single definition; maps `effect: 'deny'` → required, `effect: 'audit'` → optional; sets `cloud_provider: 'azure'`
- **Internal → Azure**: Generates one policy definition per tag (deny for required, audit for optional); includes `tagInheritanceRecommendations` (4 built-in policy IDs for tag inheritance from resource groups/subscriptions) and `managedResourceGroupNotes` (AKS, Databricks, Synapse, Azure ML, etc.)
- **Important**: Azure Policy doesn't support regex validation. Export warns about regex loss, tag limits, storage name limits, managed RG issues, and FOCUS export gaps.
- `getAzureExportWarnings()`: Generates warnings about features that won't be preserved

**services/exporter.ts**
- Five export formats: JSON (native, filename is provider-aware), Markdown (includes Cloud Provider line), AWS Policy, GCP Label Policy, Azure Policy Initiative
- Uses browser download API (createElement('a'), setAttribute, click, remove)

### Component Architecture

**App.tsx**
- Central state container for the entire `Policy` object
- Manages view switching, template application, import/export (AWS, GCP, and Azure), and history navigation
- `selectedProvider` state controls 3-way provider toggle on start view; `policy.cloud_provider` drives editor behavior
- Provider badge (blue=AWS, orange=GCP, purple=Azure) shown in editor header
- Template dropdown and download menu filter by `policy.cloud_provider`
- Start view: 3x2 grid for Import/Export cards (AWS, GCP, Azure)
- `last_updated` timestamp is stamped at export-time only (not during editing) to avoid render-loop issues
- useEffect hooks for: history management (respects `#editor` deep-links), click-outside detection, validation on changes

**components/TagForm.tsx**
- Collapsible card for editing individual tags (required or optional)
- Accepts `cloudProvider: CloudProvider` prop; uses `getResourceCategories()`/`getResourceTypes()` for provider-aware resource selection
- Features:
  - Live regex testing with input field and Run button
  - Resource type selection organized by categories with expand/collapse
  - Category-level checkboxes for bulk selection
  - Visual indicators for partial selections (opacity on indeterminate state)
  - Grid layout adapts: `grid-cols-2` for AWS (short names), `grid-cols-1` for GCP/Azure (long URIs)
  - Placeholder text adapts: `e.g. CostCenter` (AWS/Azure) vs `e.g. cost_center` (GCP)
- State: `isExpanded`, `testRegexInput`, `regexTestResult`, `expandedCategories`
- `expandedCategories` resets when `cloudProvider` changes

**components/Input.tsx** & **components/Button.tsx**
- Shared styled components with theme support
- Checkbox component includes visual checked/unchecked states

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
- `enforced_for`: Blocks non-compliant operations (service:ALL_SUPPORTED syntax only)
- `report_required_tag_for`: Drives compliance reporting (accepts specific resource types)
- Limitations: No regex support, enforcement limited to specific services
- Critical mapping functions:
  - `convertToEnforcedForFormat()`: Filters to enforcement-capable services, converts to service:ALL_SUPPORTED
  - `convertToReportRequiredFormat()`: Maps internal types (e.g., `rds:db-instance`) to AWS types (e.g., `rds:db`)
  - `parseEnforcedFor()`: Handles AWS wildcard expansion (service:ALL_SUPPORTED → specific resource types)

### GCP Label Policy Format (gcp-converter.ts)

- Custom JSON format designed for import/export (GCP has no direct equivalent to AWS Organizations Tag Policies)
- Structure: `{ label_policy: { labels: { ... }, naming_rules: { ... } } }`
- Each label has: `label_key`, `description`, `allowed_values`, `enforced_for` (resource types), `required` (boolean)
- Limitations: No regex support, keys must be lowercase, max 63 chars for keys and values
- Auto-lowercases keys on export: uppercase chars become underscores
- Resource types use full GCP URIs (e.g., `compute.googleapis.com/Instance`)

### Azure Policy Initiative Format (azure-converter.ts)

- Generates Azure Policy Initiative JSON with one policy definition per tag
- Each definition includes `policyRule` with `if/then` blocks and `effect` (deny for required, audit for optional)
- Parameters: `tagName` (string) and optionally `allowedValues` (array)
- Export includes informational sections:
  - `tagInheritanceRecommendations`: 4 built-in Azure Policy IDs for inheriting tags from resource groups and subscriptions
  - `managedResourceGroupNotes`: Lists services that create managed resource groups (AKS, Databricks, Synapse, Azure ML, Managed Applications, App Service Environment)
- Limitations: No regex support, tag names max 512 chars, values max 256 chars, max 50 tags per resource
- Resource types use `Microsoft.*` namespace format (e.g., `Microsoft.Compute/virtualMachines`)

## Styling & UI

- **Tailwind CSS** loaded via CDN (not npm) with custom config in index.html
- Custom colors: `charcoal` (#2C2C2C), `light-grey` (#F4F4F4), `chartreuse` (#ACE849)
- Fonts: Inter (UI), Fira Code (monospace)
- Theme-aware styling: All components check `isDark` flag and apply conditional classes
- Custom scrollbar styling in index.html for dark theme

## Build Configuration

**vite.config.ts:**
- React plugin with fast refresh
- Dev server: port 3000, host 0.0.0.0 (not default 5173)
- Path alias: `@/*` resolves to project root
- No special optimization or chunking strategies

**tsconfig.json:**
- Target: ES2022 with JSX transform (react-jsx)
- Module resolution: bundler (Vite-native)
- `experimentalDecorators: true` and `useDefineForClassFields: false` (likely for legacy compatibility)
- `allowImportingTsExtensions: true` with `noEmit: true` (type-checking only in IDE, Vite handles compilation)

## Data Privacy

The application is 100% client-side:
- No API calls (except loading the app itself)
- Uses Vercel Analytics for basic page view and Web Vitals tracking (privacy-friendly, no personal data collected)
- No server-side processing
- Policies never leave the browser unless user explicitly downloads

## Common Development Patterns

### Adding a New Template
1. Add entry to `TEMPLATES` array in services/templates.ts
2. Set `provider: 'aws'`, `'gcp'`, or `'azure'` and `cloud_provider` in the policy partial
3. Include required_tags with all fields (name, description, allowed_values, validation_regex, applies_to)
4. For AWS: use resource type names from `AWS_RESOURCE_CATEGORIES` (e.g., `ec2:instance`)
5. For GCP: use `snake_case` label keys and full resource URIs from `GCP_RESOURCE_CATEGORIES` (e.g., `compute.googleapis.com/Instance`)
6. For Azure: use PascalCase tag names and `Microsoft.*` resource types from `AZURE_RESOURCE_CATEGORIES` (e.g., `Microsoft.Compute/virtualMachines`)

### Adding a New Resource Type
**AWS:**
1. Update `AWS_RESOURCE_CATEGORIES` in types.ts (categorize by spend impact)
2. If adding enforcement support, update `SERVICES_WITH_ENFORCEMENT_SUPPORT` in converter.ts
3. Update mappings in `convertToReportRequiredFormat()` if AWS uses different naming

**GCP:**
1. Update `GCP_RESOURCE_CATEGORIES` in types.ts (categorize by spend impact; 7 categories including Security & Operations)
2. Use full GCP resource type URI format: `service.googleapis.com/ResourceType`
3. The `GCP_RESOURCE_TYPES` flat array auto-derives from categories
4. Principle: only include resources that **(a) support GCP tags** and **(b) carry meaningful costs**

**Azure:**
1. Update `AZURE_RESOURCE_CATEGORIES` in types.ts (categorize by spend impact; 11 categories)
2. Use `Microsoft.*` namespace format: `Microsoft.Service/resourceType`
3. The `AZURE_RESOURCE_TYPES` flat array auto-derives from categories
4. Principle: only include resources where BOTH **"Supports tags" = Yes** AND **"Tag in cost report" = Yes** (per Azure docs)

### Adding Validation Rules
1. Extend `validatePolicy()` in services/validator.ts
2. Return descriptive error strings (displayed directly in UI)
3. Validation runs automatically on every policy change (useEffect in App.tsx)

### Modifying Export Formats
1. For JSON/Markdown: Edit functions in services/exporter.ts
2. For AWS format: Modify converter.ts (be mindful of AWS policy syntax constraints)
3. For GCP format: Modify gcp-converter.ts (be mindful of GCP label restrictions: lowercase, 63-char limits)
4. For Azure format: Modify azure-converter.ts (be mindful of Azure tag restrictions: forbidden chars, reserved prefixes, 512/256 char limits)
5. Add warnings via `getAwsExportWarnings()`, `getGcpExportWarnings()`, or `getAzureExportWarnings()` if features won't be preserved

## File Organization

```
/
├── index.html              # Entry point with Tailwind config and SEO meta tags
├── index.tsx               # React root, ThemeContext provider
├── App.tsx                 # Main application logic (provider-aware)
├── types.ts                # Core types, CloudProvider, AWS + GCP + Azure resource categories
├── vite.config.ts          # Build configuration
├── tsconfig.json           # TypeScript configuration
├── components/
│   ├── Button.tsx          # Styled button with variants
│   ├── Input.tsx           # Form inputs (Input, TextArea, Checkbox)
│   └── TagForm.tsx         # Individual tag editor (provider-aware, complex)
├── services/
│   ├── templates.ts        # Pre-built policy templates (4 AWS + 4 GCP + 4 Azure)
│   ├── validator.ts        # Real-time policy validation (provider-specific rules)
│   ├── converter.ts        # AWS Organizations ↔ MCP format conversion
│   ├── gcp-converter.ts    # GCP Label Policy ↔ MCP format conversion
│   ├── azure-converter.ts  # Azure Policy Initiative ↔ MCP format conversion
│   └── exporter.ts         # Download handlers (JSON/MD/AWS/GCP/Azure)
├── context/
│   └── ThemeContext.tsx    # Dark/light theme management
├── examples/               # Sample policy files (AWS, GCP, and Azure)
├── doc/                    # Documentation and UAT guides
└── dist/                   # Build output (gitignored)
```

## Important Constraints

- **No TypeScript compilation step**: Vite handles TS directly; `tsc` not run in build
- **No backend**: All processing happens in browser; avoid adding API dependencies
- **AWS policy limitations**: converter.ts documents which features are lossy (regex validation, specific resource types in enforced_for)
- **GCP policy limitations**: gcp-converter.ts documents lossy features (regex validation, uppercase keys auto-lowercased, 63-char limits)
- **GCP resource type format**: Always use full URIs (`service.googleapis.com/ResourceType`), never short names
- **GCP label key rules**: Must be lowercase, start with a letter, match `^[a-z][a-z0-9_-]*$`, max 63 chars
- **Azure resource type format**: Always use `Microsoft.*` namespace format (e.g., `Microsoft.Compute/virtualMachines`), never short names
- **Azure tag constraints**: Names cannot contain `<>%&\?/`, cannot use reserved prefixes (`microsoft`, `azure`, `windows`), max 512 chars for keys, max 256 chars for values, max 50 tags per resource
- **Azure policy limitations**: azure-converter.ts documents lossy features (regex validation not supported, managed resource group limitations, FOCUS export gaps)
- **Provider backward compatibility**: Missing `cloud_provider` always defaults to `'aws'` throughout the app
- **Port configuration**: Dev server runs on 3000, not Vite's default 5173 (configured in vite.config.ts)
