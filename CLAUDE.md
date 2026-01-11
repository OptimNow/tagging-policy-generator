# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The FinOps Tagging Policy Generator is a client-side React/TypeScript web application that helps FinOps practitioners create tagging policies for cloud cost attribution. The tool runs entirely in the browser with no backend, and generates JSON policy files compatible with the FinOps Tag Compliance MCP Server.

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

1. **Start View** (`view === 'start'`): Landing page with three options:
   - Create from scratch (with optional templates)
   - Import from AWS Organizations tag policy
   - Export to AWS Organizations format (converter utility)

2. **Editor View** (`view === 'editor'`): Split-screen policy builder
   - Left panel: Form-based policy editor
   - Right panel: Live JSON preview with validation status

Navigation uses browser history API (pushState/popState) so back/forward buttons work correctly.

### Core Data Flow

```
Policy (types.ts)
  ↓
App.tsx (state management)
  ↓
├─> TagForm.tsx (individual tag editor)
├─> validator.ts (real-time validation)
├─> exporter.ts (JSON/Markdown/AWS downloads)
└─> converter.ts (AWS ↔ MCP format conversion)
```

### Key Type Definitions (types.ts)

- `Policy`: Root data structure with version, timestamps, required_tags, optional_tags, and tag_naming_rules
- `RequiredTag`: Tags that must be present; includes `applies_to` field specifying AWS resource types
- `OptionalTag`: Recommended tags; no `applies_to` or `validation_regex` fields
- `RESOURCE_CATEGORIES`: Organized by FinOps spend impact (Compute, Storage, Database, AI/ML, Networking, Analytics)

### Service Modules

**services/templates.ts**
- Pre-built policy templates: Cost Allocation, Startup, Enterprise, Minimal Starter
- Templates use actual AWS Tag Policy `enforced_for` resource type names (e.g., `ec2:instance`, `rds:db-instance`)

**services/validator.ts**
- Real-time validation triggered on every policy change
- Checks: required tag existence, duplicate names, empty fields, valid regex patterns, resource type selection
- Returns array of error strings displayed in UI footer

**services/converter.ts**
- Bidirectional conversion between internal format and AWS Organizations Tag Policy format
- **AWS → Internal**: Parses AWS policy JSON, extracts tags from `enforced_for` arrays, maps service wildcards to resource types
- **Internal → AWS**: Converts to AWS format with both `enforced_for` (enforcement) and `report_required_tag_for` (reporting)
- **Important**: AWS Tag Policies don't support regex validation, only `allowed_values`. Export warns users about feature loss.
- `SERVICES_WITH_ENFORCEMENT_SUPPORT`: Only services with "Enforcement Mode: Yes" can be used in `enforced_for`

**services/exporter.ts**
- Three export formats: JSON (native), Markdown (human-readable docs), AWS Policy (Organizations format)
- Uses browser download API (createElement('a'), setAttribute, click, remove)

### Component Architecture

**App.tsx**
- Central state container for the entire `Policy` object
- Manages view switching, template application, import/export, and history navigation
- Updates `last_updated` timestamp automatically on changes
- useEffect hooks for: history management, click-outside detection, validation on changes

**components/TagForm.tsx**
- Collapsible card for editing individual tags (required or optional)
- Features:
  - Live regex testing with input field and Run button
  - Resource type selection organized by categories with expand/collapse
  - Category-level checkboxes for bulk selection
  - Visual indicators for partial selections (opacity on indeterminate state)
- State: `isExpanded`, `testRegexInput`, `regexTestResult`, `expandedCategories`

**components/Input.tsx** & **components/Button.tsx**
- Shared styled components with theme support
- Checkbox component includes visual checked/unchecked states

**context/ThemeContext.tsx**
- Global dark/light theme toggle
- Persists to localStorage
- Provides `theme` and `toggleTheme` to all components via React Context

## AWS Tag Policy Integration

The tool bridges two policy formats:

**Internal MCP Format:**
- Flexible: supports regex validation, specific resource types per tag, optional vs required distinction
- Used by FinOps Tag Compliance MCP Server

**AWS Organizations Tag Policy Format:**
- Uses `@@assign` operators for policy inheritance
- `enforced_for`: Blocks non-compliant operations (service:ALL_SUPPORTED syntax only)
- `report_required_tag_for`: Drives compliance reporting (accepts specific resource types)
- Limitations: No regex support, enforcement limited to specific services

Critical mapping in converter.ts:
- `convertToEnforcedForFormat()`: Filters to enforcement-capable services, converts to service:ALL_SUPPORTED
- `convertToReportRequiredFormat()`: Maps internal types (e.g., `rds:db-instance`) to AWS types (e.g., `rds:db`)
- `parseEnforcedFor()`: Handles AWS wildcard expansion (service:ALL_SUPPORTED → specific resource types)

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
2. Include required_tags with all fields (name, description, allowed_values, validation_regex, applies_to)
3. Use AWS-compliant resource type names from `RESOURCE_CATEGORIES`

### Adding a New Resource Type
1. Update `RESOURCE_CATEGORIES` in types.ts (categorize by spend impact)
2. If adding AWS enforcement support, update `SERVICES_WITH_ENFORCEMENT_SUPPORT` in converter.ts
3. Update mappings in `convertToReportRequiredFormat()` if AWS uses different naming

### Adding Validation Rules
1. Extend `validatePolicy()` in services/validator.ts
2. Return descriptive error strings (displayed directly in UI)
3. Validation runs automatically on every policy change (useEffect in App.tsx)

### Modifying Export Formats
1. For JSON/Markdown: Edit functions in services/exporter.ts
2. For AWS format: Modify converter.ts (be mindful of AWS policy syntax constraints)
3. Add warnings via `getAwsExportWarnings()` if features won't be preserved

## File Organization

```
/
├── index.html              # Entry point with Tailwind config
├── index.tsx               # React root, ThemeContext provider
├── App.tsx                 # Main application logic
├── types.ts                # Core types and resource categories
├── vite.config.ts          # Build configuration
├── tsconfig.json           # TypeScript configuration
├── components/
│   ├── Button.tsx          # Styled button with variants
│   ├── Input.tsx           # Form inputs (Input, TextArea, Checkbox)
│   └── TagForm.tsx         # Individual tag editor (complex)
├── services/
│   ├── templates.ts        # Pre-built policy templates
│   ├── validator.ts        # Real-time policy validation
│   ├── converter.ts        # AWS ↔ MCP format conversion
│   └── exporter.ts         # Download handlers (JSON/MD/AWS)
├── context/
│   └── ThemeContext.tsx    # Dark/light theme management
├── examples/               # Sample policy files
├── doc/                    # Documentation and UAT guides
└── dist/                   # Build output (gitignored)
```

## Important Constraints

- **No TypeScript compilation step**: Vite handles TS directly; `tsc` not run in build
- **No backend**: All processing happens in browser; avoid adding API dependencies
- **AWS policy limitations**: converter.ts documents which features are lossy (regex validation, specific resource types in enforced_for)
- **Port configuration**: Dev server runs on 3000, not Vite's default 5173 (configured in vite.config.ts)
