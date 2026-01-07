# FinOps tagging in AWS



## Why tagging matters for FinOps

In the context of AWS Cloud, resource tagging is the foundation of a reliable cost allocation model. Without consistent tags, financial reporting collapses into a single undifferentiated spend number. Tagging enables cost allocation, accountability, and actionable cost optimization: FinOps teams use tags to attribute cloud spend to the right teams, products, and business units.

Tags also serve other purposes such as operational grouping or compliance classification, but this document focuses primarily on **cost attribution tagging**.



---

## What good FinOps tagging looks like

From a FinOps perspective, tags answer core financial questions: Who owns this cost? Which business unit or product is responsible? In which environment (production, staging, development) was the cost generated?

A basic FinOps tagging schema typically includes tags such as:

- `CostCenter`
- `BusinessUnit`
- `Application`
- `Environment`
- `Owner`

Tags should be present at **resource creation**, consistently named, and well-structured so billing systems and analytics tools can use them.



---

## Tag governance mechanisms in AWS

AWS does not enforce tags automatically. Tag governance requires a combination of mechanisms that each live in different parts of the AWS console. For FinOps tagging, we focus on three mechanisms:

1. **Tag Policies** for standardization and compliance reporting
2. **Service Control Policies (SCPs)** for enforcing required tags on resource creation
3. **Operational automation** (auto-tagging) to remediate gaps

Each mechanism has a different scope and console location.



---

## Tag Policies: define and measure FinOps tagging standards

**Tag Policies** let you codify your tagging taxonomy at an organizational level and measure compliance.

A Tag Policy defines which tag keys and values are expected, and how they should be formatted. Once attached to an organizational unit (OU) or account, AWS evaluates resources against the policy and shows compliance results. Tag Policies in AWS Organizations offer both **reporting** and **enforcement** modes for supported resource types.

- You can learn more and view examples in the official AWS documentation:  
  **AWS Tag Policies (AWS Organizations)**: https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_tag-policies.html 
- **Getting started with Tag Policies**: https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_tag-policies-getting-started.html 



### Where to configure Tag Policies

1. Open the AWS Management Console
2. Navigate to **Organizations**
3. Select **Policies**
4. Choose **Tag policies**
5. Create and attach your policy to OUs or accounts

Tag Policies provide **visibility and standardization**. They do not block resource creation by default, and they do not auto-apply missing tags. For FinOps, they act as the **source of truth** for what your tagging standard should be.



---

## Enforcing key cost tags at creation with SCPs

To prevent cost-generating resources from being created without required tags, AWS supports enforcement through **Service Control Policies (SCPs)**.

SCPs operate at the AWS Organizations level and can **deny API calls** that create resources when required tags are not included in those requests. This is the only native AWS mechanism that stops untagged resources at creation time.

There are examples and further guidance in AWS documentation:  

- **SCP examples for tagging resources (Organizations)**: https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps_examples_tagging.html 

Additionally, the AWS Knowledge Center includes a short explanation of how Tag Policies and SCPs can be combined to govern tagging:  

- **Use SCPs with tag policies to enforce tags**: https://repost.aws/knowledge-center/organizations-scp-tag-policies 

### Where to configure SCP-based enforcement

1. Open the AWS Management Console
2. Navigate to **Organizations**
3. Select **Policies**
4. Choose **Service control policies**
5. Create an SCP that denies creation of resources without required tags
6. Attach the SCP to the relevant OU or account

SCP enforcement is typically applied only to a few **critical cost attribution tags** such as `CostCenter` or `Environment`, because strict enforcement across all tags or services can disrupt automation and CI/CD pipelines.



---

## Auto-tagging: operational tagging and remediation

AWS does not offer a built-in “auto-tagging” policy feature. Instead, auto-tagging is implemented as an **operational pattern** that combines multiple services to detect new resources and apply tags automatically.

Common architectural approaches use:

- **AWS CloudTrail** to capture API events (resource creation)
- **Amazon EventBridge** rules to detect specific events
- **AWS Lambda** functions to apply tags automatically after resource creation
- Optionally, **AWS Config** rules to detect missing tags and trigger remediation workflows

AWS Config also offers managed rules like `required-tags` that check whether resources have specific tags and report compliance or non-compliance. While this does not prevent untagged resources from being created, it provides a checkpoint and can be paired with remediation automation:  
**AWS Config required-tags rule**: https://docs.aws.amazon.com/config/latest/developerguide/required-tags.html 



### Where to implement auto-tagging

Auto-tagging is not centralized in one console screen. Instead, you use:

- **EventBridge** to create rules for resource creation events
- **Lambda** to write and deploy the tagging logic
- **CloudTrail** must be enabled to log events
- **AWS Config** to audit and optionally remediate missing tags

Auto-tagging is **reactive**. It improves tag coverage over time and especially helps with legacy or third-party resources. In a mature FinOps model, auto-tagging sits alongside Tag Policies and SCPs to close gaps and drive higher coverage.



---

## How the pieces fit together for FinOps

A reliable FinOps tagging strategy in AWS combines:

- **Tag Policies** as the authoritative definition and compliance measurement of your tagging model
- **SCP enforcement** for a minimum set of mandatory cost attribution tags at resource creation
- **Auto-tagging** to fill in gaps and improve overall coverage

By coordinating these mechanisms, you can achieve high quality cost attribution with clear accountability and minimal operational friction.



---

## Tagging ownership and operating model

In practice, teams divide responsibilities:

- **FinOps teams** define the cost tagging schema and maintain Tag Policies
- **Cloud governance teams** manage SCP enforcement
- **Platform or cloud engineering teams** implement and operate auto-tagging and remediation workflows

Clear ownership ensures tagging standards evolve with the organization’s needs and remain aligned with financial goals without introducing unnecessary bottlenecks.