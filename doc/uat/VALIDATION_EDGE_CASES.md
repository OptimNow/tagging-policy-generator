# Validation Edge Cases

## Overview

This document lists edge case scenarios for testing the real-time validation functionality of the AWS Tagging Policy Generator. These test cases verify that validation errors are properly detected and displayed (Requirements 5.1-5.5).

---

## 1. Empty Name Scenarios

Test cases for validating tag name requirements (Requirement 5.2).

### 1.1 Completely Empty Name
| Field | Value |
|-------|-------|
| Tag Name | *(leave completely empty)* |
| **Expected Error** | "Name is required" |

### 1.2 Single Space
| Field | Value |
|-------|-------|
| Tag Name | ` ` (single space) |
| **Expected Error** | "Name is required" |

### 1.3 Multiple Spaces
| Field | Value |
|-------|-------|
| Tag Name | `   ` (multiple spaces) |
| **Expected Error** | "Name is required" |

### 1.4 Tab Character
| Field | Value |
|-------|-------|
| Tag Name | `	` (tab character) |
| **Expected Error** | "Name is required" |

### 1.5 Newline Character
| Field | Value |
|-------|-------|
| Tag Name | *(newline only)* |
| **Expected Error** | "Name is required" |

### 1.6 Mixed Whitespace
| Field | Value |
|-------|-------|
| Tag Name | ` 	 ` (space, tab, space) |
| **Expected Error** | "Name is required" |

---

## 2. Duplicate Name Scenarios

Test cases for detecting duplicate tag names (Requirement 5.3).

### 2.1 Exact Duplicate - Required Tags
| Tag 1 Name | Tag 2 Name | Location |
|------------|------------|----------|
| `CostCenter` | `CostCenter` | Both in Required Tags |
| **Expected Error** | "Duplicate tag name" |

### 2.2 Exact Duplicate - Optional Tags
| Tag 1 Name | Tag 2 Name | Location |
|------------|------------|----------|
| `Project` | `Project` | Both in Optional Tags |
| **Expected Error** | "Duplicate tag name" |

### 2.3 Duplicate Across Required and Optional
| Tag 1 Name | Tag 2 Name | Location |
|------------|------------|----------|
| `Owner` | `Owner` | Tag 1 in Required, Tag 2 in Optional |
| **Expected Error** | "Duplicate tag name" |

### 2.4 Case Sensitivity - Same Case
| Tag 1 Name | Tag 2 Name | Case Sensitive Setting |
|------------|------------|------------------------|
| `Environment` | `Environment` | ON |
| **Expected Error** | "Duplicate tag name" |

### 2.5 Case Sensitivity - Different Case (Sensitive ON)
| Tag 1 Name | Tag 2 Name | Case Sensitive Setting |
|------------|------------|------------------------|
| `Environment` | `environment` | ON |
| **Expected Behavior** | No error (different names when case sensitive) |

### 2.6 Case Sensitivity - Different Case (Sensitive OFF)
| Tag 1 Name | Tag 2 Name | Case Sensitive Setting |
|------------|------------|------------------------|
| `Environment` | `environment` | OFF |
| **Expected Error** | "Duplicate tag name" (same name when case insensitive) |

### 2.7 Multiple Duplicates
| Tags | Names |
|------|-------|
| Tag 1 | `CostCenter` |
| Tag 2 | `CostCenter` |
| Tag 3 | `CostCenter` |
| **Expected Error** | "Duplicate tag name" (should identify all duplicates) |

### 2.8 Duplicate After Edit
| Action | Expected |
|--------|----------|
| Create Tag 1: `Owner` | No error |
| Create Tag 2: `Project` | No error |
| Edit Tag 2 name to `Owner` | "Duplicate tag name" error appears |

---

## 3. Invalid Regex Pattern Scenarios

Test cases for regex validation (Requirement 5.5).

### 3.1 Unclosed Bracket
| Regex Pattern | Issue |
|---------------|-------|
| `[A-Z` | Missing closing bracket |
| **Expected Error** | "Invalid regex pattern" |

### 3.2 Unclosed Parenthesis
| Regex Pattern | Issue |
|---------------|-------|
| `(test` | Missing closing parenthesis |
| **Expected Error** | "Invalid regex pattern" |

### 3.3 Unclosed Curly Brace
| Regex Pattern | Issue |
|---------------|-------|
| `a{2,5` | Missing closing brace |
| **Expected Error** | "Invalid regex pattern" |

### 3.4 Invalid Quantifier
| Regex Pattern | Issue |
|---------------|-------|
| `*abc` | Quantifier without preceding element |
| **Expected Error** | "Invalid regex pattern" |

### 3.5 Invalid Range
| Regex Pattern | Issue |
|---------------|-------|
| `[z-a]` | Invalid character range (z > a) |
| **Expected Error** | "Invalid regex pattern" |

### 3.6 Unescaped Special Character
| Regex Pattern | Issue |
|---------------|-------|
| `test(` | Unescaped parenthesis |
| **Expected Error** | "Invalid regex pattern" |

### 3.7 Invalid Escape Sequence
| Regex Pattern | Issue |
|---------------|-------|
| `\q` | Invalid escape character |
| **Expected Behavior** | May be valid (depends on regex engine) or error |

### 3.8 Empty Alternation
| Regex Pattern | Issue |
|---------------|-------|
| `a||b` | Empty alternative |
| **Expected Behavior** | May be valid (matches empty string) or error |

### 3.9 Nested Quantifiers
| Regex Pattern | Issue |
|---------------|-------|
| `a++` | Nested quantifiers |
| **Expected Error** | "Invalid regex pattern" |

### 3.10 Lookbehind (Browser Compatibility)
| Regex Pattern | Issue |
|---------------|-------|
| `(?<=test)abc` | Lookbehind (not supported in all browsers) |
| **Expected Behavior** | May work in Chrome/Edge, fail in Safari |

---

## 4. Empty Resource Type Scenarios

Test cases for required tag resource type validation (Requirement 5.4).

### 4.1 No Resource Types Selected
| Field | Value |
|-------|-------|
| Tag Name | `CostCenter` |
| Description | `Cost center code` |
| Resource Types | *(none selected)* |
| **Expected Error** | "At least one resource type must be selected" |

### 4.2 Deselect All After Selection
| Action | Expected |
|--------|----------|
| Select `ec2:instance` | No error |
| Deselect `ec2:instance` | "At least one resource type must be selected" |

### 4.3 Optional Tag Without Resources
| Tag Type | Resource Types |
|----------|----------------|
| Optional Tag | *(none selected)* |
| **Expected Behavior** | May be allowed (optional tags may not require resources) |

---

## 5. No Required Tags Scenario

Test case for policy-level validation (Requirement 5.1).

### 5.1 Empty Policy
| State | Expected |
|-------|----------|
| No required tags added | "At least one required tag must be defined" |
| No optional tags added | No additional error (optional tags are optional) |

### 5.2 Only Optional Tags
| State | Expected |
|-------|----------|
| 0 required tags | "At least one required tag must be defined" |
| 3 optional tags | Error persists until required tag added |

### 5.3 Remove Last Required Tag
| Action | Expected |
|--------|----------|
| Start with 1 required tag | No error |
| Remove the required tag | "At least one required tag must be defined" |

---

## 6. Boundary Value Tests

### 6.1 Tag Name Length
| Length | Value | Expected |
|--------|-------|----------|
| 1 char | `A` | Valid |
| 128 chars | `A` × 128 | Valid (AWS max key length) |
| 129 chars | `A` × 129 | May show length error |

### 6.2 Description Length
| Length | Value | Expected |
|--------|-------|----------|
| 0 chars | *(empty)* | Valid (description optional) |
| 256 chars | `A` × 256 | Valid |
| 1000 chars | `A` × 1000 | May show length warning |

### 6.3 Allowed Values Count
| Count | Expected |
|-------|----------|
| 0 values | Valid (no restriction) |
| 1 value | Valid |
| 50 values | Valid |
| 100+ values | May show performance warning |

### 6.4 Special Characters in Tag Name
| Character | Example | Expected |
|-----------|---------|----------|
| Space | `Cost Center` | Depends on allow_special_characters setting |
| Underscore | `Cost_Center` | Valid |
| Hyphen | `Cost-Center` | Valid |
| Period | `Cost.Center` | Depends on settings |
| Colon | `aws:CostCenter` | May be reserved prefix |

---

## 7. Test Execution Checklist

### Empty Name Tests
| ID | Scenario | Pass/Fail | Notes |
|----|----------|-----------|-------|
| 1.1 | Completely empty | | |
| 1.2 | Single space | | |
| 1.3 | Multiple spaces | | |
| 1.4 | Tab character | | |
| 1.5 | Newline character | | |
| 1.6 | Mixed whitespace | | |

### Duplicate Name Tests
| ID | Scenario | Pass/Fail | Notes |
|----|----------|-----------|-------|
| 2.1 | Exact duplicate - required | | |
| 2.2 | Exact duplicate - optional | | |
| 2.3 | Duplicate across types | | |
| 2.4 | Same case (sensitive ON) | | |
| 2.5 | Different case (sensitive ON) | | |
| 2.6 | Different case (sensitive OFF) | | |
| 2.7 | Multiple duplicates | | |
| 2.8 | Duplicate after edit | | |

### Invalid Regex Tests
| ID | Scenario | Pass/Fail | Notes |
|----|----------|-----------|-------|
| 3.1 | Unclosed bracket | | |
| 3.2 | Unclosed parenthesis | | |
| 3.3 | Unclosed curly brace | | |
| 3.4 | Invalid quantifier | | |
| 3.5 | Invalid range | | |
| 3.6 | Unescaped special char | | |
| 3.7 | Invalid escape sequence | | |
| 3.8 | Empty alternation | | |
| 3.9 | Nested quantifiers | | |
| 3.10 | Lookbehind | | |

### Resource Type Tests
| ID | Scenario | Pass/Fail | Notes |
|----|----------|-----------|-------|
| 4.1 | No resources selected | | |
| 4.2 | Deselect all | | |
| 4.3 | Optional without resources | | |

### Policy-Level Tests
| ID | Scenario | Pass/Fail | Notes |
|----|----------|-----------|-------|
| 5.1 | Empty policy | | |
| 5.2 | Only optional tags | | |
| 5.3 | Remove last required | | |

---

## References

- **Requirement 5.1:** No required tags validation
- **Requirement 5.2:** Empty tag name validation
- **Requirement 5.3:** Duplicate tag name validation
- **Requirement 5.4:** Empty applies_to validation
- **Requirement 5.5:** Invalid regex validation
- **Test Case TC-05:** Real-Time Validation scenarios
