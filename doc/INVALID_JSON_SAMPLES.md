# Invalid JSON Samples for Import Testing

## Overview

This document provides invalid JSON samples for testing the AWS Policy Import functionality. These samples should be used to verify that the Policy Generator correctly handles and reports errors for malformed input (Requirement 6.2).

---

## 1. Malformed JSON Strings

Use these samples to test JSON parsing error handling:

### 1.1 Missing Closing Brace
```
{broken
```
**Expected Error:** Invalid JSON format

### 1.2 Missing Closing Bracket
```
{"tags": [}
```
**Expected Error:** Invalid JSON format

### 1.3 Unclosed String
```
{"name": "test
```
**Expected Error:** Invalid JSON format

### 1.4 Trailing Comma
```
{"tags": {"CostCenter": {}},}
```
**Expected Error:** Invalid JSON format

### 1.5 Missing Colon
```
{"tags" {"CostCenter": {}}}
```
**Expected Error:** Invalid JSON format

### 1.6 Single Quotes Instead of Double
```
{'tags': {'CostCenter': {}}}
```
**Expected Error:** Invalid JSON format

### 1.7 Unquoted Keys
```
{tags: {CostCenter: {}}}
```
**Expected Error:** Invalid JSON format

### 1.8 Missing Comma Between Properties
```
{"name": "test" "value": "data"}
```
**Expected Error:** Invalid JSON format

---

## 2. Empty and Whitespace Inputs

### 2.1 Empty String
```

```
**Expected Behavior:** Import button disabled or error displayed

### 2.2 Whitespace Only
```
   
```
**Expected Behavior:** Import button disabled or error displayed

### 2.3 Newlines Only
```


```
**Expected Behavior:** Import button disabled or error displayed

### 2.4 Tabs Only
```
			
```
**Expected Behavior:** Import button disabled or error displayed

---

## 3. Non-JSON Text

### 3.1 Plain Text
```
not json
```
**Expected Error:** Invalid JSON format

### 3.2 XML Format
```
<tags><CostCenter>Engineering</CostCenter></tags>
```
**Expected Error:** Invalid JSON format

### 3.3 YAML Format
```
tags:
  CostCenter:
    tag_key: CostCenter
```
**Expected Error:** Invalid JSON format

### 3.4 JavaScript Object (Not JSON)
```
{tags: {CostCenter: {tag_key: "CostCenter"}}}
```
**Expected Error:** Invalid JSON format

### 3.5 HTML Content
```
<html><body>Not a policy</body></html>
```
**Expected Error:** Invalid JSON format

### 3.6 Random Characters
```
!@#$%^&*()
```
**Expected Error:** Invalid JSON format

### 3.7 Numbers Only
```
12345
```
**Expected Behavior:** Valid JSON but invalid policy structure

### 3.8 Boolean Only
```
true
```
**Expected Behavior:** Valid JSON but invalid policy structure

### 3.9 Null Only
```
null
```
**Expected Behavior:** Valid JSON but invalid policy structure

---

## 4. Valid JSON but Invalid Policy Structure

These are syntactically valid JSON but don't match the expected AWS policy schema:

### 4.1 Empty Object
```json
{}
```
**Expected Behavior:** Import succeeds but creates empty policy or shows structure error

### 4.2 Empty Array
```json
[]
```
**Expected Behavior:** Invalid policy structure error

### 4.3 Missing Tags Property
```json
{"version": "1.0"}
```
**Expected Behavior:** Invalid policy structure or empty import

### 4.4 Wrong Property Names
```json
{"policies": {"CostCenter": {}}}
```
**Expected Behavior:** Invalid policy structure or empty import

### 4.5 Nested Too Deep
```json
{"tags": {"CostCenter": {"nested": {"too": {"deep": {}}}}}}
```
**Expected Behavior:** Partial import or structure error

---

## 5. Test Execution Instructions

### How to Use These Samples

1. Navigate to the Import AWS Policy screen
2. Copy the sample text (including any intentional errors)
3. Paste into the import text area
4. Click "Import & Convert" (if enabled)
5. Verify the expected error message or behavior

### Recording Results

| Sample ID | Sample Description | Expected | Actual | Pass/Fail |
|-----------|-------------------|----------|--------|-----------|
| 1.1 | Missing closing brace | Invalid JSON format | | |
| 1.2 | Missing closing bracket | Invalid JSON format | | |
| 1.3 | Unclosed string | Invalid JSON format | | |
| 1.4 | Trailing comma | Invalid JSON format | | |
| 1.5 | Missing colon | Invalid JSON format | | |
| 1.6 | Single quotes | Invalid JSON format | | |
| 1.7 | Unquoted keys | Invalid JSON format | | |
| 1.8 | Missing comma | Invalid JSON format | | |
| 2.1 | Empty string | Button disabled/error | | |
| 2.2 | Whitespace only | Button disabled/error | | |
| 2.3 | Newlines only | Button disabled/error | | |
| 2.4 | Tabs only | Button disabled/error | | |
| 3.1 | Plain text | Invalid JSON format | | |
| 3.2 | XML format | Invalid JSON format | | |
| 3.3 | YAML format | Invalid JSON format | | |
| 3.4 | JavaScript object | Invalid JSON format | | |
| 3.5 | HTML content | Invalid JSON format | | |
| 3.6 | Random characters | Invalid JSON format | | |
| 3.7 | Numbers only | Invalid structure | | |
| 3.8 | Boolean only | Invalid structure | | |
| 3.9 | Null only | Invalid structure | | |
| 4.1 | Empty object | Empty/structure error | | |
| 4.2 | Empty array | Invalid structure | | |
| 4.3 | Missing tags | Empty/structure error | | |
| 4.4 | Wrong property names | Empty/structure error | | |
| 4.5 | Nested too deep | Partial/structure error | | |

---

## References

- **Requirement 6.2:** WHEN the Tester pastes invalid JSON THEN the Policy_Generator SHALL display "Invalid JSON format" error
- **Test Case TC-06:** AWS Policy Import testing scenarios
