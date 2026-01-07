# UAT Checklist - AWS Tagging Policy Generator V1

**Tester Name:** ___________________________  
**Test Date:** ___________________________  
**App Version:** ___________________________  
**Environment:** ___________________________

---

## Pre-Requisites (Requirement 0)

- [ ] Node.js v18+ installed
- [ ] Chrome browser available (last 2 versions)
- [ ] Firefox browser available (last 2 versions)
- [ ] Safari browser available (last 2 versions)
- [ ] Edge browser available (last 2 versions)
- [ ] Application running locally (`npm run dev`) or deployed
- [ ] Sample files present in `examples/` folder
- [ ] Clipboard access enabled in browser
- [ ] Tablet viewport simulation available (768px)

---

## Smoke Tests (Run First)

| ID | Test | Pass | Fail | Notes |
|----|------|:----:|:----:|-------|
| SM-01 | App loads - Start screen displays with two options | ☐ | ☐ | |
| SM-02 | Create blank policy - Editor opens with empty policy | ☐ | ☐ | |
| SM-03 | Add one tag - JSON preview updates | ☐ | ☐ | |
| SM-04 | Download works - File downloads as tagging_policy.json | ☐ | ☐ | |

**⚠️ If any smoke test fails, STOP and report before proceeding.**

---

## Feature Tests

### TC-01: Start Screen Navigation (Requirement 1)

- [ ] 1.1 Load application - Two cards visible: "Create from Scratch" and "Import AWS Policy"
- [ ] 1.2 Click "Start Blank" - Editor view opens with empty required_tags array
- [ ] 1.3 Click logo to return - Start screen displays again
- [ ] 1.4 Select "Cost Allocation" template - Editor opens with 3 required tags pre-filled

**Result:** ☐ Pass | ☐ Fail | **Notes:** _______________________

---

### TC-02: Required Tag Management (Requirement 2)

- [ ] 2.1 Click "Add Required Tag" - New empty tag form appears
- [ ] 2.2 Enter name: "TestTag" - JSON preview shows `"name": "TestTag"`
- [ ] 2.3 Enter description: "Test description" - JSON preview updates
- [ ] 2.4 Check "ec2:instance" and "s3:bucket" - applies_to array shows both values
- [ ] 2.5 Enter allowed values: "val1, val2" - allowed_values array shows ["val1", "val2"]
- [ ] 2.6 Enter regex: `^[A-Z]+$` - validation_regex field populated
- [ ] 2.7 Click remove button - Tag removed from form and JSON

**Result:** ☐ Pass | ☐ Fail | **Notes:** _______________________

---

### TC-03: Optional Tag Management (Requirement 3)

- [ ] 3.1 Click "Add Optional Tag" - New optional tag form appears
- [ ] 3.2 Enter name: "Project" - JSON preview shows tag in optional_tags
- [ ] 3.3 Enter description: "Project ID" - Description appears in JSON
- [ ] 3.4 Click remove - Tag removed

**Result:** ☐ Pass | ☐ Fail | **Notes:** _______________________

---

### TC-04: Naming Rules Configuration (Requirement 4)

- [ ] 4.1 Toggle "Case Sensitive" ON - `case_sensitivity: true` in JSON
- [ ] 4.2 Toggle "Case Sensitive" OFF - `case_sensitivity: false` in JSON
- [ ] 4.3 Toggle "Allow Special Chars" ON - `allow_special_characters: true`
- [ ] 4.4 Change max key length to 64 - `max_key_length: 64` in JSON
- [ ] 4.5 Change max value length to 128 - `max_value_length: 128` in JSON

**Result:** ☐ Pass | ☐ Fail | **Notes:** _______________________

---

### TC-05: Real-Time Validation (Requirement 5)

- [ ] 5.1 Start with blank policy - Error: "At least one required tag must be defined"
- [ ] 5.2 Add required tag, leave name empty - Error: "Name is required"
- [ ] 5.3 Add two tags with same name "Duplicate" - Error: "Duplicate tag name"
- [ ] 5.4 Add required tag without selecting resources - Error: "At least one resource type must be selected"
- [ ] 5.5 Enter invalid regex: `[invalid` - Error: "Invalid regex pattern"
- [ ] 5.6 Fix all errors - Green "Policy Valid" indicator

**Result:** ☐ Pass | ☐ Fail | **Notes:** _______________________

---

### TC-06: AWS Policy Import (Requirement 6)

- [ ] 6.1 Paste valid AWS policy JSON - No error shown
- [ ] 6.2 Click "Import & Convert" - Editor opens with converted policy
- [ ] 6.3 Verify CostCenter tag - In required_tags with allowed_values
- [ ] 6.4 Verify Environment tag - In optional_tags (no enforced_for)
- [ ] 6.5 Paste invalid JSON: `{broken` - Error: "Invalid JSON format"
- [ ] 6.6 Paste empty text, click import - Button disabled or error shown

**Result:** ☐ Pass | ☐ Fail | **Notes:** _______________________

---

### TC-07: Template Application (Requirement 7)

- [ ] 7.1 From start screen, click "Cost Allocation" - Editor with CostCenter, Owner, Environment tags
- [ ] 7.2 Verify Owner tag has email regex - validation_regex contains email pattern
- [ ] 7.3 Return to start, select "Security & Compliance" - DataClassification, Compliance, Owner tags
- [ ] 7.4 Return to start, select "Minimal Starter" - Basic 3 tags without regex
- [ ] 7.5 In editor, use dropdown to load different template - Current policy replaced with template

**Result:** ☐ Pass | ☐ Fail | **Notes:** _______________________

---

### TC-08: Export Functionality (Requirement 8)

- [ ] 8.1 Create valid policy - "Policy Valid" shown
- [ ] 8.2 Click "Copy" - Button shows "Copied", JSON in clipboard
- [ ] 8.3 Paste in text editor - Valid JSON matching preview
- [ ] 8.4 Click "Download" - File "tagging_policy.json" downloads
- [ ] 8.5 Open downloaded file - Content matches preview exactly
- [ ] 8.6 Create invalid policy (no tags) - Download button disabled

**Result:** ☐ Pass | ☐ Fail | **Notes:** _______________________

---

### TC-09: Live Preview Accuracy (Requirement 9)

- [ ] 9.1 Make any form change - JSON updates within 1 second
- [ ] 9.2 Check JSON formatting - 2-space indentation, proper structure
- [ ] 9.3 Check last_updated field - ISO timestamp present
- [ ] 9.4 Make another change - last_updated timestamp changes

**Result:** ☐ Pass | ☐ Fail | **Notes:** _______________________

---

## Cross-Browser Tests (Requirement 10)

Run smoke tests (SM-01 through SM-04) on each browser:

### Chrome
| SM-01 | SM-02 | SM-03 | SM-04 | Result |
|:-----:|:-----:|:-----:|:-----:|--------|
| ☐ | ☐ | ☐ | ☐ | ☐ Pass ☐ Fail |

**Notes:** _______________________

### Firefox
| SM-01 | SM-02 | SM-03 | SM-04 | Result |
|:-----:|:-----:|:-----:|:-----:|--------|
| ☐ | ☐ | ☐ | ☐ | ☐ Pass ☐ Fail |

**Notes:** _______________________

### Safari
| SM-01 | SM-02 | SM-03 | SM-04 | Result |
|:-----:|:-----:|:-----:|:-----:|--------|
| ☐ | ☐ | ☐ | ☐ | ☐ Pass ☐ Fail |

**Notes:** _______________________

### Edge
| SM-01 | SM-02 | SM-03 | SM-04 | Result |
|:-----:|:-----:|:-----:|:-----:|--------|
| ☐ | ☐ | ☐ | ☐ | ☐ Pass ☐ Fail |

**Notes:** _______________________

---

## Responsive Layout Tests (Requirement 11)

### Desktop Viewport (1920px width)
- [ ] 11.1 Form and preview display side-by-side
- [ ] 11.2 All buttons and controls accessible
- [ ] 11.3 Text readable without horizontal scrolling

**Result:** ☐ Pass | ☐ Fail | **Notes:** _______________________

### Tablet Viewport (768px width)
- [ ] 11.4 Layout adapts to narrower width
- [ ] 11.5 All functionality remains accessible
- [ ] 11.6 No overlapping elements or broken layout

**Result:** ☐ Pass | ☐ Fail | **Notes:** _______________________

### Resize Transitions
- [ ] 11.7 Resize from 1920px to 768px - Smooth transition
- [ ] 11.8 Resize from 768px to 1024px - No broken elements
- [ ] 11.9 All interactive elements remain reachable

**Result:** ☐ Pass | ☐ Fail | **Notes:** _______________________

---

## Test Summary

| Category | Total Tests | Passed | Failed | Blocked |
|----------|:-----------:|:------:|:------:|:-------:|
| Smoke Tests | 4 | | | |
| TC-01: Start Screen | 4 | | | |
| TC-02: Required Tags | 7 | | | |
| TC-03: Optional Tags | 4 | | | |
| TC-04: Naming Rules | 5 | | | |
| TC-05: Validation | 6 | | | |
| TC-06: AWS Import | 6 | | | |
| TC-07: Templates | 5 | | | |
| TC-08: Export | 6 | | | |
| TC-09: Live Preview | 4 | | | |
| TC-10: Cross-Browser | 16 | | | |
| TC-11: Responsive | 9 | | | |
| **TOTAL** | **76** | | | |

---

## Defects Found

| # | Test ID | Severity | Description |
|---|---------|----------|-------------|
| 1 | | ☐ Critical ☐ Major ☐ Minor | |
| 2 | | ☐ Critical ☐ Major ☐ Minor | |
| 3 | | ☐ Critical ☐ Major ☐ Minor | |
| 4 | | ☐ Critical ☐ Major ☐ Minor | |
| 5 | | ☐ Critical ☐ Major ☐ Minor | |

---

## Sign-Off Section

### Pass/Fail Criteria
- **Pass**: All smoke tests pass AND all feature tests pass AND cross-browser smoke tests pass
- **Conditional Pass**: Minor issues in responsive/cross-browser that don't block core functionality
- **Fail**: Any smoke test fails OR any critical feature test fails

### Final Result

☐ **PASS** - All tests passed, ready for release  
☐ **CONDITIONAL PASS** - Minor issues noted, acceptable for release  
☐ **FAIL** - Critical issues found, requires fixes before release

### Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Tester | | | |
| QA Lead | | | |
| Product Owner | | | |

### Comments

_________________________________________________________________________

_________________________________________________________________________

_________________________________________________________________________

---

*Document Version: 1.0*  
*Last Updated: _______________*
