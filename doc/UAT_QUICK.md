# FinOps Tagging Policy Generator - Quick UAT

**Tester:** _______________  **Date:** _______________

This quick UAT validates the three core workflows. Takes approximately 20-30 minutes.

---

## Pre-Flight Check

- [ ] Application is running (locally or deployed)
- [ ] AWS Console access available for validation
- [ ] Have the example files ready: `examples/aws-policy-example.json`

---

## Scenario 1: Template → AWS Export → AWS Console

**Goal:** Create a policy from a template and use it in AWS Organizations.

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|:---------:|
| 1.1 | Open the app, click "Cost Allocation" template | Editor opens with CostCenter, Owner, Environment tags | ☐ |
| 1.2 | Review the JSON preview | Shows 3 required tags with `applies_to` arrays | ☐ |
| 1.3 | Verify "Policy Valid" indicator | Green checkmark, no validation errors | ☐ |
| 1.4 | Click Download → "AWS Tag Policy" | File `aws_tag_policy.json` downloads | ☐ |
| 1.5 | Open downloaded file in text editor | JSON has `"tags": { ... }` with `@@assign` operators | ☐ |
| 1.6 | In AWS Console: Organizations → Policies → Tag Policies | Navigate to tag policies section | ☐ |
| 1.7 | Create new tag policy, paste the exported JSON | Policy validates in AWS console | ☐ |
| 1.8 | Save the policy (can delete after test) | Policy saves successfully | ☐ |

**Result:** ☐ Pass | ☐ Fail
**Notes:** _________________________________________________

---

## Scenario 2: Import AWS Policy → Edit → Re-Export

**Goal:** Round-trip an AWS policy through the tool.

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|:---------:|
| 2.1 | Open `examples/aws-policy-example.json` | Copy the JSON content | ☐ |
| 2.2 | On start screen, paste into "Import from AWS Policy" | JSON appears in textarea | ☐ |
| 2.3 | Click "Import & Edit" | Editor opens with converted policy | ☐ |
| 2.4 | Verify tags were imported | CostCenter, Environment, Owner, Project, DataClassification visible | ☐ |
| 2.5 | Edit: Change Environment allowed values to "prod, dev, test" | JSON preview updates with new values | ☐ |
| 2.6 | Add new required tag: "Team" with description "Team name" | Tag appears in JSON with applies_to | ☐ |
| 2.7 | Select at least one resource for Team tag | applies_to array populated | ☐ |
| 2.8 | Click Download → "AWS Tag Policy" | File downloads | ☐ |
| 2.9 | Open file, verify "Team" tag exists | `"Team": { "tag_key": { "@@assign": "Team" } ...}` | ☐ |
| 2.10 | Verify modified Environment values | `"tag_value": { "@@assign": ["prod", "dev", "test"] }` | ☐ |

**Result:** ☐ Pass | ☐ Fail
**Notes:** _________________________________________________

---

## Scenario 3: Create from Scratch → Validate

**Goal:** Build a simple policy manually and verify it's valid.

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|:---------:|
| 3.1 | Click "Start Blank" | Editor opens with empty policy | ☐ |
| 3.2 | Note validation error | Shows "At least one required tag" error | ☐ |
| 3.3 | Click "Add Required Tag" | Empty tag form appears | ☐ |
| 3.4 | Enter Name: "BusinessUnit" | JSON shows `"name": "BusinessUnit"` | ☐ |
| 3.5 | Enter Description: "Cost allocation unit" | Description in JSON | ☐ |
| 3.6 | Enter Allowed Values: "Engineering, Marketing, Sales" | `allowed_values: ["Engineering", "Marketing", "Sales"]` | ☐ |
| 3.7 | Check resources: ec2:instance, rds:db, s3:bucket | applies_to shows all three | ☐ |
| 3.8 | Verify still shows validation error | "Name is required" or similar for description | ☐ |
| 3.9 | Fill in any missing required fields | All validation errors cleared | ☐ |
| 3.10 | Verify "Policy Valid" indicator | Green checkmark appears | ☐ |
| 3.11 | Click Download → "JSON" | File `tagging_policy.json` downloads | ☐ |
| 3.12 | Open file, verify structure | Has version, required_tags, tag_naming_rules | ☐ |
| 3.13 | Click Download → "Markdown" | File `tagging_policy.md` downloads | ☐ |
| 3.14 | Open markdown, verify readable | Human-readable format with tables | ☐ |

**Result:** ☐ Pass | ☐ Fail
**Notes:** _________________________________________________

---

## Quick Feature Checks

| Feature | How to Test | Pass/Fail |
|---------|-------------|:---------:|
| Dark/Light Mode Toggle | Click sun/moon icon, UI changes theme | ☐ |
| User Manual Link | Click "User Manual" button, opens GitHub doc | ☐ |
| Logo Link | Click logo, goes to optimnow.io or returns to start | ☐ |
| Copy to Clipboard | Click "Copy" in editor, paste elsewhere | ☐ |
| Regex Tester | Enter regex `^[A-Z]+$`, use Test field, click Run | ☐ |

---

## Summary

| Scenario | Result |
|----------|--------|
| 1. Template → AWS Export → AWS Console | ☐ Pass ☐ Fail |
| 2. Import AWS → Edit → Re-Export | ☐ Pass ☐ Fail |
| 3. Create from Scratch → Validate | ☐ Pass ☐ Fail |
| Quick Feature Checks | ☐ Pass ☐ Fail |

### Overall Result

☐ **PASS** - All scenarios work correctly
☐ **FAIL** - Issues found (document below)

### Issues Found

| Scenario | Step | Issue Description |
|----------|------|-------------------|
| | | |
| | | |

### Sign-Off

**Tester:** _______________ **Date:** _______________

---

*Quick UAT v1.0 - FinOps Tagging Policy Generator*
