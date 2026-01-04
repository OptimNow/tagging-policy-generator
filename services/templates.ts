import { Policy } from '../types';

interface Template {
  name: string;
  description: string;
  policy: Partial<Policy>;
}

export const TEMPLATES: Template[] = [
  {
    name: "Cost Allocation",
    description: "Basic cost tracking and chargeback",
    policy: {
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
  },
  {
    name: "Security & Compliance",
    description: "Data classification and compliance tracking",
    policy: {
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
  },
  {
    name: "Minimal Starter",
    description: "Essential tags to get started",
    policy: {
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
  }
];