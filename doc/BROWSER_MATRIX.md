# Browser Compatibility Test Matrix

## Overview

This document provides a structured matrix for cross-browser testing of the AWS Tagging Policy Generator. Testers should execute smoke tests on each supported browser and record results.

## Supported Browsers

| Browser | Minimum Version | Notes |
|---------|-----------------|-------|
| Chrome | 120+ | Primary development browser |
| Firefox | 120+ | Full support expected |
| Safari | 17+ | macOS/iOS testing |
| Edge | 120+ | Chromium-based |

## Test Environment

- **Test URL**: Local (`http://localhost:5173`) or deployed URL
- **Viewport**: Desktop (1920x1080) for initial browser tests
- **Prerequisites**: Application running, clipboard access enabled

---

## Smoke Test Matrix

Execute each smoke test on all browsers. Mark results as:
- ✅ Pass
- ❌ Fail
- ⚠️ Partial (works with issues)
- ⏭️ Skipped

### SM-01: Application Loads

**Test**: Navigate to application URL and verify start screen displays with two options.

| Browser | Version | Result | Notes |
|---------|---------|--------|-------|
| Chrome  |         |        |       |
| Firefox |         |        |       |
| Safari  |         |        |       |
| Edge    |         |        |       |

### SM-02: Create Blank Policy

**Test**: Click "Start Blank" and verify editor opens with empty policy.

| Browser | Version | Result | Notes |
|---------|---------|--------|-------|
| Chrome  |         |        |       |
| Firefox |         |        |       |
| Safari  |         |        |       |
| Edge    |         |        |       |

### SM-03: Add One Tag

**Test**: Add a required tag, fill name/description, select resource type, verify JSON preview updates.

| Browser | Version | Result | Notes |
|---------|---------|--------|-------|
| Chrome  |         |        |       |
| Firefox |         |        |       |
| Safari  |         |        |       |
| Edge    |         |        |       |

### SM-04: Download Works

**Test**: Click Download button and verify file downloads as `tagging_policy.json`.

| Browser | Version | Result | Notes |
|---------|---------|--------|-------|
| Chrome  |         |        |       |
| Firefox |         |        |       |
| Safari  |         |        |       |
| Edge    |         |        |       |

---

## Summary Matrix

| Test ID | Test Name | Chrome | Firefox | Safari | Edge |
|---------|-----------|--------|---------|--------|------|
| SM-01 | App Loads | | | | |
| SM-02 | Create Blank Policy | | | | |
| SM-03 | Add One Tag | | | | |
| SM-04 | Download Works | | | | |

---

## Browser-Specific Notes

### Chrome
- Primary development browser
- DevTools recommended for debugging
- Check clipboard permissions in site settings

### Firefox
- May require explicit clipboard permission grant
- Check for any CSS rendering differences

### Safari
- Test on macOS for accurate results
- Clipboard API may behave differently
- Check for any WebKit-specific issues

### Edge
- Chromium-based, should match Chrome behavior
- Test on Windows for accurate results

---

## Test Execution Record

| Field | Value |
|-------|-------|
| Tester Name | |
| Test Date | |
| App Version | |
| Overall Result | Pass / Fail / Conditional |

### Sign-Off

- [ ] All smoke tests executed on Chrome
- [ ] All smoke tests executed on Firefox
- [ ] All smoke tests executed on Safari
- [ ] All smoke tests executed on Edge
- [ ] All critical issues documented
- [ ] Matrix completed and reviewed

**Approved By**: _______________  
**Date**: _______________

---

## Defect Log

| ID | Browser | Test | Description | Severity | Status |
|----|---------|------|-------------|----------|--------|
| | | | | | |
| | | | | | |
| | | | | | |

**Severity Levels**: Critical / Major / Minor
