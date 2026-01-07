# Design Document: UAT Protocol for AWS Tagging Policy Generator

## Overview

This document defines the User Acceptance Testing protocol for the AWS Tagging Policy Generator V1. It provides structured test scenarios, test data, and an execution checklist that testers can follow to validate all core functionality before release.

## Architecture

The UAT protocol follows a scenario-based testing approach:

```
┌─────────────────────────────────────────────────────────────┐
│                    UAT Execution Flow                       │
├─────────────────────────────────────────────────────────────┤
│  1. Environment Setup (Pre-requisites)                      │
│  2. Smoke Test (Basic functionality)                        │
│  3. Feature Tests (Detailed scenarios per requirement)      │
│  4. Edge Case Tests (Validation boundaries)                 │
│  5. Cross-Browser Tests (Compatibility)                     │
│  6. Sign-off (Pass/Fail determination)                      │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Test Environment

| Component | Requirement |
|-----------|-------------|
| Node.js | v18 or higher |
| Browsers | Chrome 120+, Firefox 120+, Safari 17+, Edge 120+ |
| Viewport | Desktop (1920x1080), Tablet (768x1024) |
| Network | Local or deployed URL |

### Test Data Files

Located in `examples/` folder:
- `aws-policy-example.json` - Valid AWS Organizations policy for import testing
- `enterprise-policy.json` - Complex policy with multiple tags
- `startup-policy.json` - Simple policy for quick validation

## Data Models

### Test Case Structure

```typescript
interface TestCase {
  id: string;           // TC-XX format
  requirement: string;  // Requirement reference
  scenario: string;     // What is being tested
  steps: string[];      // Step-by-step instructions
  expected: string;     // Expected outcome
  status: 'Pass' | 'Fail' | 'Blocked' | 'Not Run';
  notes: string;        // Tester observations
}
```

### Test Execution Record

```typescript
interface TestRun {
  date: string;
  tester: string;
  environment: string;  // Browser/OS
  version: string;      // App version
  results: TestCase[];
  overall: 'Pass' | 'Fail';
}
```


## Test Scenarios

### Smoke Test (Run First)

| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| SM-01 | App loads | Navigate to app URL | Start screen displays with two options |
| SM-02 | Create blank policy | Click "Start Blank" | Editor opens with empty policy |
| SM-03 | Add one tag | Add required tag, fill name/description, select resource | JSON preview updates |
| SM-04 | Download works | Click Download | File downloads as tagging_policy.json |

---

### TC-01: Start Screen Navigation (Req 1)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Load application | Two cards visible: "Create from Scratch" and "Import AWS Policy" |
| 2 | Click "Start Blank" | Editor view opens with empty required_tags array |
| 3 | Click logo to return | Start screen displays again |
| 4 | Select "Cost Allocation" template | Editor opens with 3 required tags pre-filled |

---

### TC-02: Required Tag Management (Req 2)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Add Required Tag" | New empty tag form appears |
| 2 | Enter name: "TestTag" | JSON preview shows `"name": "TestTag"` |
| 3 | Enter description: "Test description" | JSON preview updates |
| 4 | Check "ec2:instance" and "s3:bucket" | applies_to array shows both values |
| 5 | Enter allowed values: "val1, val2" | allowed_values array shows ["val1", "val2"] |
| 6 | Enter regex: `^[A-Z]+$` | validation_regex field populated |
| 7 | Click remove button | Tag removed from form and JSON |

---

### TC-03: Optional Tag Management (Req 3)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Add Optional Tag" | New optional tag form appears |
| 2 | Enter name: "Project" | JSON preview shows tag in optional_tags |
| 3 | Enter description: "Project ID" | Description appears in JSON |
| 4 | Click remove | Tag removed |

---

### TC-04: Naming Rules Configuration (Req 4)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Toggle "Case Sensitive" ON | `case_sensitivity: true` in JSON |
| 2 | Toggle "Case Sensitive" OFF | `case_sensitivity: false` in JSON |
| 3 | Toggle "Allow Special Chars" ON | `allow_special_characters: true` |
| 4 | Change max key length to 64 | `max_key_length: 64` in JSON |
| 5 | Change max value length to 128 | `max_value_length: 128` in JSON |

---

### TC-05: Real-Time Validation (Req 5)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start with blank policy | Error: "At least one required tag must be defined" |
| 2 | Add required tag, leave name empty | Error: "Name is required" |
| 3 | Add two tags with same name "Duplicate" | Error: "Duplicate tag name" |
| 4 | Add required tag without selecting resources | Error: "At least one resource type must be selected" |
| 5 | Enter invalid regex: `[invalid` | Error: "Invalid regex pattern" |
| 6 | Fix all errors | Green "Policy Valid" indicator |

---

### TC-06: AWS Policy Import (Req 6)

**Test Data - Valid AWS Policy:**
```json
{
  "tags": {
    "CostCenter": {
      "tag_key": { "@@assign": "CostCenter" },
      "tag_value": { "@@assign": ["Engineering", "Marketing"] },
      "enforced_for": { "@@assign": ["ec2:*", "s3:*"] }
    },
    "Environment": {
      "tag_key": { "@@assign": "Environment" }
    }
  }
}
```

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Paste valid AWS policy JSON | No error shown |
| 2 | Click "Import & Convert" | Editor opens with converted policy |
| 3 | Verify CostCenter tag | In required_tags with allowed_values |
| 4 | Verify Environment tag | In optional_tags (no enforced_for) |
| 5 | Paste invalid JSON: `{broken` | Error: "Invalid JSON format" |
| 6 | Paste empty text, click import | Button disabled or error shown |

---

### TC-07: Template Application (Req 7)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | From start screen, click "Cost Allocation" | Editor with CostCenter, Owner, Environment tags |
| 2 | Verify Owner tag has email regex | validation_regex contains email pattern |
| 3 | Return to start, select "Security & Compliance" | DataClassification, Compliance, Owner tags |
| 4 | Return to start, select "Minimal Starter" | Basic 3 tags without regex |
| 5 | In editor, use dropdown to load different template | Current policy replaced with template |

---

### TC-08: Export Functionality (Req 8)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create valid policy | "Policy Valid" shown |
| 2 | Click "Copy" | Button shows "Copied", JSON in clipboard |
| 3 | Paste in text editor | Valid JSON matching preview |
| 4 | Click "Download" | File "tagging_policy.json" downloads |
| 5 | Open downloaded file | Content matches preview exactly |
| 6 | Create invalid policy (no tags) | Download button disabled |

---

### TC-09: Live Preview Accuracy (Req 9)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Make any form change | JSON updates within 1 second |
| 2 | Check JSON formatting | 2-space indentation, proper structure |
| 3 | Check last_updated field | ISO timestamp present |
| 4 | Make another change | last_updated timestamp changes |

---

### TC-10: Cross-Browser Testing (Req 10)

Run smoke tests (SM-01 through SM-04) on each browser:

| Browser | SM-01 | SM-02 | SM-03 | SM-04 | Notes |
|---------|-------|-------|-------|-------|-------|
| Chrome | | | | | |
| Firefox | | | | | |
| Safari | | | | | |
| Edge | | | | | |

---

### TC-11: Responsive Layout (Req 11)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View at 1920px width | Form left, preview right, side-by-side |
| 2 | Resize to 768px width | Layout adapts, still usable |
| 3 | Resize to 1024px width | Smooth transition, no broken elements |
| 4 | Check all buttons accessible | All interactive elements reachable |


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do.*

Since this is a UAT protocol (manual testing), correctness properties are expressed as invariants the tester should verify hold true throughout testing:

Property 1: JSON Preview Consistency
*For any* form state, the JSON preview SHALL always reflect the exact current state of all form fields without requiring manual refresh.
**Validates: Requirements 2.2, 3.2, 4.1-4.4, 9.1**

Property 2: Validation Completeness
*For any* policy with validation errors, the Download button SHALL be disabled and error messages SHALL be displayed.
**Validates: Requirements 5.1-5.6, 8.3**

Property 3: Import Idempotence
*For any* valid AWS policy JSON, importing then exporting SHALL produce a valid MCP-format policy that can be re-imported without errors.
**Validates: Requirements 6.1, 6.3-6.5**

Property 4: Template Integrity
*For any* template selection, the loaded policy SHALL match the predefined template structure exactly.
**Validates: Requirements 7.1-7.4**

Property 5: Export Fidelity
*For any* valid policy, the downloaded JSON file content SHALL be byte-identical to the clipboard copy content and the preview display content.
**Validates: Requirements 8.1-8.2, 9.2**

## Error Handling

| Error Condition | Expected Behavior |
|-----------------|-------------------|
| Invalid JSON on import | Display "Invalid JSON format" error, stay on import screen |
| Empty tag name | Display inline validation error, prevent download |
| Duplicate tag names | Display specific error identifying the duplicate |
| Invalid regex pattern | Display "Invalid regex pattern" error |
| Clipboard access denied | Show fallback message or graceful degradation |
| Browser not supported | App should still function with possible visual degradation |

## Testing Strategy

### Test Execution Order

1. **Environment Setup** - Verify pre-requisites (Req 0)
2. **Smoke Tests** - Quick validation app is functional (SM-01 to SM-04)
3. **Feature Tests** - Detailed scenarios (TC-01 to TC-09)
4. **Cross-Browser** - Smoke tests on all browsers (TC-10)
5. **Responsive** - Layout verification (TC-11)

### Pass/Fail Criteria

- **Pass**: All smoke tests pass, all feature tests pass, cross-browser smoke tests pass
- **Conditional Pass**: Minor issues in responsive/cross-browser that don't block core functionality
- **Fail**: Any smoke test fails, or critical feature test fails

### Test Data Requirements

1. **Valid AWS Policy** - Use `examples/aws-policy-example.json`
2. **Invalid JSON** - Use malformed strings like `{broken` or `not json`
3. **Edge Case Values** - Empty strings, very long strings (>256 chars), special characters

### Defect Reporting

For any failed test:
1. Record test case ID
2. Document actual vs expected behavior
3. Capture screenshot if visual issue
4. Note browser/OS/viewport
5. Assign severity: Critical / Major / Minor

## UAT Execution Checklist

```
□ Pre-Requisites Verified
  □ Node.js v18+ installed
  □ All browsers available
  □ App running locally or deployed
  □ Sample files in examples/ folder

□ Smoke Tests Complete
  □ SM-01: App loads
  □ SM-02: Create blank policy
  □ SM-03: Add one tag
  □ SM-04: Download works

□ Feature Tests Complete
  □ TC-01: Start screen navigation
  □ TC-02: Required tag management
  □ TC-03: Optional tag management
  □ TC-04: Naming rules configuration
  □ TC-05: Real-time validation
  □ TC-06: AWS policy import
  □ TC-07: Template application
  □ TC-08: Export functionality
  □ TC-09: Live preview accuracy

□ Cross-Browser Tests Complete
  □ TC-10: Chrome
  □ TC-10: Firefox
  □ TC-10: Safari
  □ TC-10: Edge

□ Responsive Tests Complete
  □ TC-11: Desktop viewport
  □ TC-11: Tablet viewport

□ Sign-Off
  □ All critical tests passed
  □ Defects logged (if any)
  □ UAT approved by: _______________
  □ Date: _______________
```
