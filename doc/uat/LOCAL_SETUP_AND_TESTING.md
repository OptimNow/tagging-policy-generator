# Local Setup and Testing Guide

## AWS Tagging Policy Generator V1

This guide provides step-by-step instructions for setting up the application locally and running basic tests.

---

## 1. Environment Setup

### 1.1 Pre-Requisites Checklist

Before starting UAT, verify the following requirements are met:

| Requirement | How to Verify | Status |
|-------------|---------------|--------|
| Node.js v18+ | Run `node --version` in terminal | ☐ |
| npm installed | Run `npm --version` in terminal | ☐ |
| Chrome (last 2 versions) | Check browser version in Settings > About | ☐ |
| Firefox (last 2 versions) | Check browser version in Settings > About | ☐ |
| Safari (last 2 versions) | Check browser version in Safari > About | ☐ |
| Edge (last 2 versions) | Check browser version in Settings > About | ☐ |
| Clipboard access enabled | Browser permissions allow clipboard | ☐ |
| Tablet viewport simulation | DevTools responsive mode available | ☐ |

### 1.2 Application Setup

1. **Clone/Access the repository**
   ```bash
   cd <project-directory>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Verify application is running**
   - Open browser and navigate to the local URL (typically `http://localhost:5173`)
   - Confirm the start screen displays with "Create from Scratch" and "Import AWS Policy" options

### 1.3 Test Data Verification

Confirm the following sample files exist in the `examples/` folder:

| File | Purpose |
|------|---------|
| `aws-policy-example.json` | Valid AWS Organizations policy for import testing |
| `enterprise-policy.json` | Complex policy with multiple tags |
| `startup-policy.json` | Simple policy for quick validation |

---

## 2. Test Execution Order

Execute tests in the following sequence to ensure proper coverage:

```
┌─────────────────────────────────────────────────────────────┐
│                    UAT Execution Flow                       │
├─────────────────────────────────────────────────────────────┤
│  Phase 1: Environment Setup (Pre-requisites)                │
│  Phase 2: Smoke Tests (Basic functionality)                 │
│  Phase 3: Feature Tests (Detailed scenarios)                │
│  Phase 4: Edge Case Tests (Validation boundaries)           │
│  Phase 5: Cross-Browser Tests (Compatibility)               │
│  Phase 6: Responsive Tests (Layout verification)            │
│  Phase 7: Sign-off (Pass/Fail determination)                │
└─────────────────────────────────────────────────────────────┘
```

### Phase 1: Environment Setup
- Complete all items in Section 1 above
- Duration: ~15 minutes

### Phase 2: Smoke Tests (SM-01 to SM-04)
Run these first to confirm basic functionality:

| ID | Test | Expected Result |
|----|------|-----------------|
| SM-01 | App loads | Start screen displays with two options |
| SM-02 | Create blank policy | Editor opens with empty policy |
| SM-03 | Add one tag | JSON preview updates |
| SM-04 | Download works | File downloads as tagging_policy.json |

**If any smoke test fails, STOP and report the issue before proceeding.**

### Phase 3: Feature Tests (TC-01 to TC-09)
Execute detailed test scenarios for each feature:

| Test Case | Feature | Requirements |
|-----------|---------|--------------|
| TC-01 | Start Screen Navigation | Req 1 |
| TC-02 | Required Tag Management | Req 2 |
| TC-03 | Optional Tag Management | Req 3 |
| TC-04 | Naming Rules Configuration | Req 4 |
| TC-05 | Real-Time Validation | Req 5 |
| TC-06 | AWS Policy Import | Req 6 |
| TC-07 | Template Application | Req 7 |
| TC-08 | Export Functionality | Req 8 |
| TC-09 | Live Preview Accuracy | Req 9 |

### Phase 4: Edge Case Tests
Test validation boundaries documented in TC-05 and TC-06:
- Empty inputs
- Invalid JSON formats
- Duplicate tag names
- Invalid regex patterns

### Phase 5: Cross-Browser Tests (TC-10)
Run smoke tests on each browser:
- Chrome
- Firefox
- Safari
- Edge

### Phase 6: Responsive Tests (TC-11)
Test layout at different viewports:
- Desktop: 1920px width
- Tablet: 768px width
- Resize transitions

### Phase 7: Sign-off
- Review all test results
- Document any defects
- Complete sign-off section

---

## 3. Browser DevTools Setup

### Enabling Tablet Viewport Simulation

**Chrome/Edge:**
1. Press F12 to open DevTools
2. Click the "Toggle device toolbar" icon (or Ctrl+Shift+M)
3. Select "iPad" or set custom dimensions to 768x1024

**Firefox:**
1. Press F12 to open DevTools
2. Click the "Responsive Design Mode" icon (or Ctrl+Shift+M)
3. Set viewport to 768x1024

**Safari:**
1. Enable Developer menu in Preferences > Advanced
2. Select Develop > Enter Responsive Design Mode
3. Choose iPad or set custom dimensions

### Enabling Clipboard Access

Most browsers prompt for clipboard permission on first use. If blocked:
- Chrome: Settings > Privacy > Site Settings > Clipboard
- Firefox: about:config > dom.events.asyncClipboard.clipboardItem
- Safari: Enabled by default for user-initiated actions
- Edge: Settings > Cookies and site permissions > Clipboard

---

## 4. Defect Reporting

When a test fails, document the following:

1. **Test Case ID** - e.g., TC-05, SM-02
2. **Actual Result** - What happened
3. **Expected Result** - What should have happened
4. **Screenshot** - Capture the issue if visual
5. **Environment** - Browser, OS, viewport size
6. **Severity**:
   - **Critical**: Blocks core functionality
   - **Major**: Feature doesn't work but workaround exists
   - **Minor**: Cosmetic or edge case issue

---

## 5. Pass/Fail Criteria

| Result | Criteria |
|--------|----------|
| **Pass** | All smoke tests pass AND all feature tests pass AND cross-browser smoke tests pass |
| **Conditional Pass** | Minor issues in responsive/cross-browser that don't block core functionality |
| **Fail** | Any smoke test fails OR any critical feature test fails |

---

## 6. Quick Reference

### Useful Commands
```bash
# Start development server
npm run dev

# Check Node.js version
node --version

# Check npm version
npm --version
```

### Key Test Data
- Valid AWS Policy: `examples/aws-policy-example.json`
- Invalid JSON: `{broken` or `not json`
- Edge cases: Empty strings, strings >256 chars, special characters

### Contact
For questions during UAT execution, contact the development team.
