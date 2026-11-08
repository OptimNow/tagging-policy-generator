# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commits and pull requests

Do not add `Co-Authored-By`, `Claude-Session` or "Generated with Claude Code" lines to commit messages or pull request descriptions.

## Project Overview

The FinOps Tagging Policy Generator is a client-side React/TypeScript web application that helps FinOps practitioners create tagging/labeling policies for cloud cost attribution across **AWS, GCP, and Azure**. The tool runs entirely in the browser with no backend, and generates JSON policy files compatible with the FinOps Tag Compliance MCP Server.

**Live app:** https://tagpolgenerator.optimnow.io/

## Development Commands

```bash
# Development
npm run dev          # Start dev server on http://localhost:3000 (note: port configured to 3000, not default 5173)

# Production
npm run build        # Build for production (outputs to dist/)
npm run preview      # Preview production build locally
```

**No test runner is wired into package.json.** There is no linting setup. A standalone smoke script, `test-providers.mjs`, sits at the repo root and is run manually with `node test-providers.mjs`. It writes a temporary `_test_entry.ts` and runs it with `npx tsx`, so the first run downloads tsx if it isn't installed. Manual UAT procedures live in `doc/uat/`.

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
- No backend API calls. Besides the app itself, the page loads the Tailwind CDN and Google Fonts
- Uses Vercel Analytics (`<Analytics />` in index.tsx) for page views and Web Vitals. It sets no cookies and is the only analytics. Google Analytics was removed in September 2026 because it set cookies without a consent banner; do not add cookie-based tracking without one
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
2. Check the type in AWS's "Resources that support enforcement in tag policies" table. If it can be enforced on its own, add it to `ENFORCEABLE_RESOURCE_TYPES` in converter.ts; if AWS only enforces its service through `ALL_SUPPORTED`, add the service to `SERVICES_WITH_WILDCARD_ENFORCEMENT`
3. If the app's name for the type differs from AWS's, add it to `RESOURCE_TYPE_ALIASES` in converter.ts

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
4. For Azure format: Modify azure-converter.ts (be mindful of Azure tag restrictions: forbidden chars, 512/256 char limits)
5. Add warnings via `getAwsExportWarnings()`, `getGcpExportWarnings()`, or `getAzureExportWarnings()`. All three return `CategorizedExportWarnings`: put feature loss in `limitations`, and scope or deployment guidance in `deploymentNotes`. `ExportWarningsModal` renders the two groups separately, so the split matters

## File Organization

```
/
├── index.html                    # Entry point with Tailwind config and SEO meta tags
├── index.tsx                     # React root, ThemeContext provider
├── App.tsx                       # Main application logic (provider-aware)
├── types.ts                      # Core types, CloudProvider, CategorizedExportWarnings,
│                                 #   AWS + GCP + Azure resource categories
├── vite.config.ts                # Build configuration
├── tsconfig.json                 # TypeScript configuration
├── test-providers.mjs            # Manual smoke test for AWS/GCP/Azure converters, native reload and validator (node test-providers.mjs)
├── metadata.json                 # App metadata
├── README.md                     # Public-facing overview
├── USER_MANUAL.md                # End-user documentation (linked from the app)
├── components/
│   ├── Button.tsx                # Styled button with variants
│   ├── Input.tsx                 # Form inputs (Input, TextArea, Checkbox)
│   ├── ExportWarningsModal.tsx   # Pre-download warnings dialog (limitations + deploymentNotes)
│   └── TagForm.tsx               # Individual tag editor (provider-aware, complex)
├── services/
│   ├── templates.ts              # Pre-built policy templates (4 AWS + 4 GCP + 4 Azure)
│   ├── validator.ts              # Real-time policy validation (provider-specific rules)
│   ├── converter.ts              # AWS Organizations ↔ MCP format conversion
│   ├── gcp-converter.ts          # GCP Label Policy ↔ MCP (not wired into App.tsx)
│   ├── azure-converter.ts        # Azure ARM tagging bundle ↔ MCP format conversion
│   ├── native-import.ts          # Reloads a policy JSON saved from this tool
│   └── exporter.ts               # Download handlers (JSON/MD/AWS/GCP/Azure)
├── context/
│   └── ThemeContext.tsx          # Dark/light theme management
├── public/                       # Images, robots.txt, sitemap.xml, llms.txt
├── examples/                     # Sample policy files (AWS, GCP, and Azure)
├── doc/                          # AWS tagging and resource-type references, original generator prompt, security audit, UAT guides (doc/uat/)
├── .kiro/specs/                  # UAT protocol specs (requirements, design, tasks)
└── dist/                         # Build output (gitignored)
```

## Important Constraints

- **No TypeScript compilation step**: Vite handles TS directly; `tsc` not run in build
- **No backend**: All processing happens in browser; avoid adding API dependencies
- **AWS policy limitations**: converter.ts documents which features are lossy (regex validation, types AWS only enforces service-wide, reporting-only types)
- **GCP policy limitations**: gcp-converter.ts documents lossy features (regex validation, uppercase keys auto-lowercased, 63-char limits)
- **GCP resource type format**: Always use full URIs (`service.googleapis.com/ResourceType`), never short names
- **GCP label key rules**: Must be lowercase, start with a letter, match `^[a-z][a-z0-9_-]*$`, max 63 chars
- **Azure resource type format**: Always use `Microsoft.*` namespace format (e.g., `Microsoft.Compute/virtualMachines`), never short names
- **Azure tag constraints**: Names cannot contain `<>%&\?/`, max 512 chars for keys (128 on storage accounts), max 256 chars for values, max 50 tags per resource. The reserved-prefix check (`microsoft`, `azure`, `windows`) in validator.ts and the export warnings is not an Azure rule
- **Azure policy limitations**: azure-converter.ts documents lossy features (regex validation not supported, managed resource group limitations, FOCUS export gaps)
- **Provider backward compatibility**: Missing `cloud_provider` always defaults to `'aws'` throughout the app
- **Port configuration**: Dev server runs on 3000, not Vite's default 5173 (configured in vite.config.ts)

## Where the rest lives

`docs/DESIGN.md` holds the other sections of this file, moved verbatim on 2026-11-08. It is not
loaded automatically: read the section your task touches. A reference to "CLAUDE.md, <section>"
means that section in `docs/DESIGN.md`.

Sections in `docs/DESIGN.md`:

- Architecture Overview
- Cloud Provider Integration

## Maintaining this file

Keep this file under 200 lines. It holds what an agent needs in every session. A new decision, its reasoning or its history goes into the matching section of `docs/DESIGN.md`, or a new section listed above. Add a rule here only if an agent would break something without it.

