# Requirements Document

## Introduction

This document defines the User Acceptance Testing (UAT) protocol for the AWS Tagging Policy Generator V1. The UAT protocol ensures the tool meets FinOps practitioner needs for creating, validating, and exporting AWS tagging policies in a lean, straightforward manner.

## Glossary

- **Policy_Generator**: The AWS Tagging Policy Generator web application
- **Tester**: The person executing UAT scenarios
- **Policy**: A JSON document containing required tags, optional tags, and naming rules
- **MCP_Format**: The JSON schema compatible with FinOps Tag Compliance MCP Server
- **AWS_Policy**: An AWS Organizations tag policy JSON format

## Requirements

### Requirement 0: UAT Pre-Requisites

**User Story:** As a tester, I want clear pre-requisites documented, so that I can properly set up the test environment before executing UAT.

#### Acceptance Criteria

1. THE Tester SHALL have Node.js (v18+) installed to run the local development server
2. THE Tester SHALL have access to Chrome, Firefox, Safari, and Edge browsers (last 2 versions)
3. THE Tester SHALL have sample AWS Organizations policy JSON files available in the examples/ folder
4. THE Tester SHALL have the application running locally via `npm run dev` or deployed to a test URL
5. THE Tester SHALL have clipboard access enabled in the browser for copy functionality testing
6. THE Tester SHALL have a device or browser window capable of simulating tablet viewport (768px width)

### Requirement 1: Start Screen Navigation

**User Story:** As a tester, I want to verify the start screen options work correctly, so that users can begin policy creation via any entry point.

#### Acceptance Criteria

1. WHEN the Tester loads the application THEN the Policy_Generator SHALL display two options: "Create from Scratch" and "Import AWS Policy"
2. WHEN the Tester clicks "Start Blank" THEN the Policy_Generator SHALL navigate to an empty editor view
3. WHEN the Tester selects a template THEN the Policy_Generator SHALL pre-populate the editor with that template's tags

### Requirement 2: Required Tag Management

**User Story:** As a tester, I want to verify required tag CRUD operations, so that users can build policies with mandatory tags.

#### Acceptance Criteria

1. WHEN the Tester clicks "Add Required Tag" THEN the Policy_Generator SHALL add a new empty required tag form
2. WHEN the Tester fills in tag name, description, and selects resource types THEN the Policy_Generator SHALL update the live JSON preview immediately
3. WHEN the Tester adds allowed values to a required tag THEN the Policy_Generator SHALL include those values in the JSON output
4. WHEN the Tester enters a validation regex THEN the Policy_Generator SHALL validate the regex syntax
5. WHEN the Tester clicks remove on a required tag THEN the Policy_Generator SHALL remove that tag from the policy

### Requirement 3: Optional Tag Management

**User Story:** As a tester, I want to verify optional tag operations, so that users can add non-mandatory tags to policies.

#### Acceptance Criteria

1. WHEN the Tester clicks "Add Optional Tag" THEN the Policy_Generator SHALL add a new empty optional tag form
2. WHEN the Tester fills in optional tag details THEN the Policy_Generator SHALL update the live JSON preview
3. WHEN the Tester removes an optional tag THEN the Policy_Generator SHALL remove it from the policy

### Requirement 4: Tag Naming Rules Configuration

**User Story:** As a tester, I want to verify naming rules configuration, so that users can set global tag constraints.

#### Acceptance Criteria

1. WHEN the Tester toggles "Case Sensitive" THEN the Policy_Generator SHALL update the JSON with case_sensitivity true or false
2. WHEN the Tester toggles "Allow Special Chars" THEN the Policy_Generator SHALL update allow_special_characters in the JSON
3. WHEN the Tester changes max key length THEN the Policy_Generator SHALL reflect the new value in the JSON
4. WHEN the Tester changes max value length THEN the Policy_Generator SHALL reflect the new value in the JSON

### Requirement 5: Real-Time Validation

**User Story:** As a tester, I want to verify validation feedback, so that users receive immediate error guidance.

#### Acceptance Criteria

1. WHEN the Tester creates a policy with no required tags THEN the Policy_Generator SHALL display a validation error
2. WHEN the Tester leaves a tag name empty THEN the Policy_Generator SHALL display "Name is required" error
3. WHEN the Tester creates duplicate tag names THEN the Policy_Generator SHALL display a duplicate name error
4. WHEN the Tester leaves "applies_to" empty on a required tag THEN the Policy_Generator SHALL display a resource type error
5. WHEN the Tester enters an invalid regex pattern THEN the Policy_Generator SHALL display an invalid regex error
6. WHEN all validation passes THEN the Policy_Generator SHALL display "Policy Valid" indicator

### Requirement 6: AWS Policy Import

**User Story:** As a tester, I want to verify AWS policy import conversion, so that users can migrate existing policies.

#### Acceptance Criteria

1. WHEN the Tester pastes valid AWS Organizations policy JSON THEN the Policy_Generator SHALL convert it to MCP_Format
2. WHEN the Tester pastes invalid JSON THEN the Policy_Generator SHALL display "Invalid JSON format" error
3. WHEN the AWS policy contains enforced_for tags THEN the Policy_Generator SHALL map them to required_tags
4. WHEN the AWS policy contains tags without enforced_for THEN the Policy_Generator SHALL map them to optional_tags
5. WHEN the AWS policy uses ":ALL_SUPPORTED" resource syntax THEN the Policy_Generator SHALL expand to specific resource types

### Requirement 7: Template Application

**User Story:** As a tester, I want to verify template loading, so that users can quickly start with common patterns.

#### Acceptance Criteria

1. WHEN the Tester selects "Cost Allocation" template THEN the Policy_Generator SHALL load CostCenter, Owner, and Environment tags
2. WHEN the Tester selects "Security & Compliance" template THEN the Policy_Generator SHALL load DataClassification, Compliance, and Owner tags
3. WHEN the Tester selects "Minimal Starter" template THEN the Policy_Generator SHALL load basic CostCenter, Owner, and Environment tags
4. WHEN the Tester loads a template from the editor dropdown THEN the Policy_Generator SHALL replace current policy with template

### Requirement 8: Export Functionality

**User Story:** As a tester, I want to verify export options, so that users can save and share policies.

#### Acceptance Criteria

1. WHEN the Tester clicks "Copy" THEN the Policy_Generator SHALL copy the JSON to clipboard and show "Copied" confirmation
2. WHEN the Tester clicks "Download" with a valid policy THEN the Policy_Generator SHALL download "tagging_policy.json"
3. WHEN the Tester clicks "Download" with validation errors THEN the Policy_Generator SHALL disable the download button

### Requirement 9: Live Preview Accuracy

**User Story:** As a tester, I want to verify the JSON preview matches form state, so that users see accurate output.

#### Acceptance Criteria

1. WHEN the Tester modifies any form field THEN the Policy_Generator SHALL update the JSON preview within 1 second
2. WHEN the Tester views the preview THEN the Policy_Generator SHALL display properly formatted JSON with 2-space indentation
3. WHEN the Tester makes changes THEN the Policy_Generator SHALL update the last_updated timestamp

### Requirement 10: Cross-Browser Compatibility

**User Story:** As a tester, I want to verify browser support, so that users can access the tool on modern browsers.

#### Acceptance Criteria

1. THE Policy_Generator SHALL function correctly in Chrome (last 2 versions)
2. THE Policy_Generator SHALL function correctly in Firefox (last 2 versions)
3. THE Policy_Generator SHALL function correctly in Safari (last 2 versions)
4. THE Policy_Generator SHALL function correctly in Edge (last 2 versions)

### Requirement 11: Responsive Layout

**User Story:** As a tester, I want to verify responsive design, so that users can work on desktop and tablet.

#### Acceptance Criteria

1. WHEN the Tester views on desktop (1920px width) THEN the Policy_Generator SHALL display form and preview side-by-side
2. WHEN the Tester views on tablet (768px width) THEN the Policy_Generator SHALL display a usable layout
3. WHEN the Tester resizes the browser THEN the Policy_Generator SHALL adapt layout without breaking
