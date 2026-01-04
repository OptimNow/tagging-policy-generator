# Tagging Policy Generator Web App - Initial Build Prompt

## 

Build a client-side web application that helps FinOps practitioners create tagging policies for AWS resources. The app should provide a user-friendly form interface that generates valid JSON policy files compatible with the FinOps Tag Compliance MCP Server.

---

## Target Output Format

The app generates JSON files in this format:

```json
{
  "version": "1.0",
  "last_updated": "2025-01-04T12:00:00Z",
  "required_tags": [
    {
      "name": "CostCenter",
      "description": "Department for cost allocation",
      "allowed_values": ["Engineering", "Marketing", "Sales"],
      "validation_regex": null,
      "applies_to": ["ec2:instance", "rds:db", "s3:bucket"]
    }
  ],
  "optional_tags": [
    {
      "name": "Project",
      "description": "Project identifier",
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

---

## Technical Requirements

### Stack
- **Pure client-side**: HTML, CSS, JavaScript (vanilla or React - your choice)
- **No backend required**: All logic runs in the browser
- **No build step preferred**: Should work by opening index.html (or minimal build with Vite)
- **Responsive design**: Works on desktop and tablet
- **Modern browsers**: Chrome, Firefox, Safari, Edge (last 2 versions)

### Deployment Target
- GitHub Pages or Vercel (static hosting)
- Single repository with all assets

---

## Core Features

### 1. Start Screen
Two options:
- **"Create from Scratch"** - Opens empty form
- **"Import AWS Policy"** - Text area to paste AWS Organizations tag policy JSON

### 2. Policy Builder Form

**Required Tags Section**:
- Add/remove required tags dynamically
- For each tag:
  - Tag name (text input)
  - Description (textarea)
  - Allowed values (comma-separated input or tag chips)
  - Validation regex (text input with "Test" button)
  - Applies to (multi-select checkboxes):
    - ec2:instance
    - ec2:volume
    - ec2:snapshot
    - rds:db
    - s3:bucket
    - lambda:function
    - ecs:service
    - ecs:task

**Optional Tags Section**:
- Add/remove optional tags
- For each tag:
  - Tag name
  - Description
  - Allowed values (optional)

**Tag Naming Rules**:
- Case sensitivity (checkbox)
- Allow special characters (checkbox)
- Max key length (number input, default 128)
- Max value length (number input, default 256)

### 3. Live Preview Panel
- Split screen: Form on left, JSON preview on right
- JSON updates in real-time as user types
- Syntax-highlighted JSON display
- Copy to clipboard button
- Download as file button

### 4. Validation
- Real-time validation as user types
- Show errors inline (red text/borders)
- Validation rules:
  - Tag names cannot be empty
  - Tag names must be unique
  - At least one "applies_to" must be selected for required tags
  - Regex patterns must be valid (test with JavaScript RegExp)
  - Allowed values must be non-empty if provided

### 5. Tag Templates (Presets)
Dropdown with common patterns:
- **Cost Allocation** (CostCenter, Owner, Environment)
- **Security & Compliance** (DataClassification, Compliance, Owner)
- **Operational** (Environment, Application, BackupSchedule)
- **Minimal Starter** (CostCenter, Owner, Environment)

Selecting a template pre-fills the form.

### 6. AWS Policy Import
- Paste AWS Organizations tag policy JSON
- Parse and convert to MCP format
- Handle conversion logic:
  - `tags.{key}.tag_key.@@assign` → `required_tags[].name`
  - `tags.{key}.tag_value.@@assign` → `required_tags[].allowed_values`
  - `tags.{key}.enforced_for.@@assign` → `required_tags[].applies_to`
  - Tags without `enforced_for` → `optional_tags[]`
- Show conversion summary (X required tags, Y optional tags)
- Handle errors gracefully with helpful messages

### 7. Export Options
- **Download JSON** - Downloads `tagging_policy.json`
- **Copy to Clipboard** - Copies JSON to clipboard
- **Share Link** (optional) - Encode policy in URL hash for sharing

---

## UI/UX Guidelines

- ### Color Palette (Primary)

  - Charcoal / Dark Grey (primary background): **#2C2C2C**
  - Light Grey (secondary background): **#F4F4F4** or **#C1C1C1** depending on contrast needs
  - White (primary foreground): **#FFFFFF**
  - Chartreuse Green (accent): **#ACE849**

  **Rule:** exactly one chartreuse accent per visual when possible. Never dominant.

  ### Visual Style

  - Flat, 2D, system-diagram inspired
  - No gradients, no shadows, no textures
  - Clean geometry (circles, lines, bars)
  - No decorative or illustrative excess

  ### Visual Semantics

  - White or light shapes represent systems, control planes, or structure
  - Grey elements represent neutral or constrained paths
  - Chartreuse elements represent approved, efficient, or governed paths

  ### What to Avoid Visually

  - Humanoids, brains, faces, or anthropomorphic AI
  - Futuristic clichés or sci-fi aesthetics
  - Busy dashboards or UI screenshots
  - Visual metaphors unrelated to systems or governance

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  Header: "AWS Tagging Policy Generator"                │
│  [Create from Scratch] [Import AWS Policy]             │
└─────────────────────────────────────────────────────────┘
┌──────────────────────────┬──────────────────────────────┐
│  Form Builder (Left)     │  Live Preview (Right)        │
│                          │                              │
│  [Template Dropdown]     │  {                           │
│                          │    "version": "1.0",         │
│  Required Tags:          │    "required_tags": [...]    │
│  ┌────────────────────┐  │  }                           │
│  │ Tag 1              │  │                              │
│  │ Name: [_______]    │  │  [Copy] [Download]           │
│  │ Description: [...] │  │                              │
│  │ Values: [_______]  │  │                              │
│  │ Applies to: [✓]   │  │                              │
│  │ [Remove]           │  │                              │
│  └────────────────────┘  │                              │
│  [+ Add Required Tag]    │                              │
│                          │                              │
│  Optional Tags:          │                              │
│  [+ Add Optional Tag]    │                              │
│                          │                              │
│  Tag Naming Rules:       │                              │
│  [✓] Case sensitive      │                              │
│  [ ] Special chars       │                              │
└──────────────────────────┴──────────────────────────────┘
```

### Interactions
- Smooth animations for add/remove
- Instant feedback on validation errors
- Tooltips for complex fields (regex, applies_to)
- Keyboard shortcuts (Ctrl+S to download, Ctrl+C to copy)

---

## File Structure

```
tagging-policy-generator/
├── index.html              # Main HTML file
├── styles.css              # All styles
├── app.js                  # Main application logic
├── converter.js            # AWS policy conversion logic
├── templates.js            # Tag template presets
├── validator.js            # Validation logic
├── README.md               # Setup and usage instructions
├── LICENSE                 # MIT License
└── examples/
    ├── startup-policy.json
    ├── enterprise-policy.json
    └── aws-policy-example.json
```

---

## Conversion Logic (AWS → MCP Format)

Implement this conversion in `converter.js`:

```javascript
function convertAwsPolicyToMcp(awsPolicy) {
  const tags = awsPolicy.tags || {};
  const requiredTags = [];
  const optionalTags = [];
  
  for (const [key, config] of Object.entries(tags)) {
    const tagName = config.tag_key?.['@@assign'] || key;
    const allowedValues = config.tag_value?.['@@assign'] || null;
    const enforcedFor = config.enforced_for?.['@@assign'] || [];
    
    const appliesTo = enforcedFor.length > 0 
      ? parseEnforcedFor(enforcedFor)
      : ['ec2:instance', 'rds:db', 's3:bucket', 'lambda:function'];
    
    const tag = {
      name: tagName,
      description: `Converted from AWS Organizations tag policy - ${key}`,
      allowed_values: allowedValues,
      validation_regex: null,
      applies_to: appliesTo
    };
    
    if (enforcedFor.length > 0) {
      requiredTags.push(tag);
    } else {
      optionalTags.push({
        name: tagName,
        description: tag.description,
        allowed_values: allowedValues
      });
    }
  }
  
  return {
    version: "1.0",
    last_updated: new Date().toISOString(),
    required_tags: requiredTags,
    optional_tags: optionalTags,
    tag_naming_rules: {
      case_sensitivity: false,
      allow_special_characters: false,
      max_key_length: 128,
      max_value_length: 256
    }
  };
}

function parseEnforcedFor(enforcedFor) {
  const appliesTo = [];
  const serviceMap = {
    'ec2': ['ec2:instance', 'ec2:volume', 'ec2:snapshot'],
    's3': ['s3:bucket'],
    'rds': ['rds:db'],
    'lambda': ['lambda:function'],
    'ecs': ['ecs:service', 'ecs:task']
  };
  
  for (const resource of enforcedFor) {
    if (resource.includes(':ALL_SUPPORTED')) {
      const service = resource.split(':')[0];
      appliesTo.push(...(serviceMap[service] || [`${service}:resource`]));
    } else {
      appliesTo.push(resource);
    }
  }
  
  return [...new Set(appliesTo)]; // Remove duplicates
}
```

---

## Tag Templates

Include these presets in `templates.js`:

### Cost Allocation Template
```javascript
{
  name: "Cost Allocation",
  description: "Basic cost tracking and chargeback",
  required_tags: [
    {
      name: "CostCenter",
      description: "Department for cost allocation",
      allowed_values: ["Engineering", "Marketing", "Sales", "Operations"],
      validation_regex: null,
      applies_to: ["ec2:instance", "rds:db", "s3:bucket", "lambda:function"]
    },
    {
      name: "Owner",
      description: "Email address of the resource owner",
      allowed_values: null,
      validation_regex: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      applies_to: ["ec2:instance", "rds:db", "s3:bucket", "lambda:function"]
    },
    {
      name: "Environment",
      description: "Deployment environment",
      allowed_values: ["production", "staging", "development", "test"],
      validation_regex: null,
      applies_to: ["ec2:instance", "rds:db", "lambda:function"]
    }
  ],
  optional_tags: [
    {
      name: "Project",
      description: "Project identifier",
      allowed_values: null
    }
  ]
}
```

### Security & Compliance Template
```javascript
{
  name: "Security & Compliance",
  description: "Data classification and compliance tracking",
  required_tags: [
    {
      name: "DataClassification",
      description: "Data sensitivity level",
      allowed_values: ["public", "internal", "confidential", "restricted"],
      validation_regex: null,
      applies_to: ["s3:bucket", "rds:db"]
    },
    {
      name: "Compliance",
      description: "Compliance framework",
      allowed_values: ["HIPAA", "PCI-DSS", "SOC2", "GDPR", "None"],
      validation_regex: null,
      applies_to: ["ec2:instance", "rds:db", "s3:bucket"]
    },
    {
      name: "Owner",
      description: "Email address of the resource owner",
      allowed_values: null,
      validation_regex: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      applies_to: ["ec2:instance", "rds:db", "s3:bucket"]
    }
  ],
  optional_tags: []
}
```

### Minimal Starter Template
```javascript
{
  name: "Minimal Starter",
  description: "Essential tags to get started",
  required_tags: [
    {
      name: "CostCenter",
      description: "Department for cost allocation",
      allowed_values: null,
      validation_regex: null,
      applies_to: ["ec2:instance", "rds:db", "s3:bucket"]
    },
    {
      name: "Owner",
      description: "Email address of the resource owner",
      allowed_values: null,
      validation_regex: null,
      applies_to: ["ec2:instance", "rds:db", "s3:bucket"]
    },
    {
      name: "Environment",
      description: "Deployment environment",
      allowed_values: ["production", "staging", "development"],
      validation_regex: null,
      applies_to: ["ec2:instance", "rds:db"]
    }
  ],
  optional_tags: []
}
```

---

## Validation Rules

Implement in `validator.js`:

```javascript
function validatePolicy(policy) {
  const errors = [];
  
  // Check required tags
  if (!policy.required_tags || policy.required_tags.length === 0) {
    errors.push("At least one required tag must be defined");
  }
  
  const tagNames = new Set();
  
  // Validate required tags
  for (const [index, tag] of (policy.required_tags || []).entries()) {
    const prefix = `Required tag ${index + 1}`;
    
    if (!tag.name || tag.name.trim() === '') {
      errors.push(`${prefix}: Name is required`);
    } else if (tagNames.has(tag.name)) {
      errors.push(`${prefix}: Duplicate tag name "${tag.name}"`);
    } else {
      tagNames.add(tag.name);
    }
    
    if (!tag.description || tag.description.trim() === '') {
      errors.push(`${prefix} (${tag.name}): Description is required`);
    }
    
    if (!tag.applies_to || tag.applies_to.length === 0) {
      errors.push(`${prefix} (${tag.name}): At least one resource type must be selected`);
    }
    
    if (tag.validation_regex) {
      try {
        new RegExp(tag.validation_regex);
      } catch (e) {
        errors.push(`${prefix} (${tag.name}): Invalid regex pattern`);
      }
    }
  }
  
  // Validate optional tags
  for (const [index, tag] of (policy.optional_tags || []).entries()) {
    const prefix = `Optional tag ${index + 1}`;
    
    if (!tag.name || tag.name.trim() === '') {
      errors.push(`${prefix}: Name is required`);
    } else if (tagNames.has(tag.name)) {
      errors.push(`${prefix}: Duplicate tag name "${tag.name}"`);
    } else {
      tagNames.add(tag.name);
    }
  }
  
  return errors;
}
```

---

## README Content

Include this in README.md:

```markdown
# AWS Tagging Policy Generator

A simple web-based tool for creating tagging policies for AWS resources. Generate valid JSON policy files compatible with the FinOps Tag Compliance MCP Server.

## Features

- Visual form builder for creating tagging policies
- Import and convert AWS Organizations tag policies
- Pre-built templates for common use cases
- Real-time JSON preview
- Client-side only (no backend required)
- Export as JSON file or copy to clipboard

## Usage

1. Open `index.html` in your browser
2. Choose "Create from Scratch" or "Import AWS Policy"
3. Fill in the form or paste your AWS policy
4. Preview the generated JSON in real-time
5. Download or copy the policy file

## Deployment

Deploy to GitHub Pages:
```bash
# Push to GitHub
git add .
git commit -m "Initial commit"
git push origin main

# Enable GitHub Pages in repository settings
# Select "main" branch and "/" root
```

Deploy to Vercel:
```bash
vercel deploy
```

## License

MIT License - See LICENSE file for details

## Related Projects

- [FinOps Tag Compliance MCP Server](https://github.com/OptimNow/finops-tag-compliance-mcp)
```

---

## Additional Instructions

1. **Keep it simple**: Prioritize working functionality over fancy features
2. **Make it accessible**: Use semantic HTML, ARIA labels, keyboard navigation
3. **Error handling**: Show helpful error messages, never crash
4. **Mobile-friendly**: Responsive design that works on tablets
5. **Performance**: Fast load time, smooth interactions
6. **Documentation**: Clear README with screenshots
7. **Examples**: Include 3 example policy files

---

## Success Criteria

The app is successful if:
- ✅ A non-technical user can create a valid policy in under 5 minutes
- ✅ AWS policy import works correctly for common cases
- ✅ Generated JSON validates against the schema
- ✅ Works offline (no external dependencies)
- ✅ Can be deployed to GitHub Pages with zero configuration
- ✅ Looks professional and trustworthy

---

## Out of Scope (For Later)

- User accounts / authentication
- Saving policies to cloud storage
- Team collaboration features
- Version history
- Multi-cloud support (Azure, GCP)
- Backend API integration

---

**Now generate the complete working application with all files!**
