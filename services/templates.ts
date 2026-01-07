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
    name: "Startup",
    description: "Lightweight policy for smaller organizations",
    policy: {
      required_tags: [
        {
          name: "Environment",
          description: "Deployment environment for the resource",
          allowed_values: ["production", "staging", "development"],
          validation_regex: null,
          applies_to: ["ec2:instance", "rds:db", "s3:bucket", "lambda:function"]
        },
        {
          name: "Owner",
          description: "Email address of the team or person responsible for this resource",
          allowed_values: null,
          validation_regex: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          applies_to: ["ec2:instance", "rds:db", "s3:bucket", "lambda:function"]
        },
        {
          name: "Project",
          description: "Project or product name this resource belongs to",
          allowed_values: null,
          validation_regex: "^[a-z0-9-]+$",
          applies_to: ["ec2:instance", "rds:db", "s3:bucket", "lambda:function", "ecs:service"]
        }
      ],
      optional_tags: [
        {
          name: "CostCenter",
          description: "Cost center for billing allocation (optional for startups with simple cost structures)",
          allowed_values: null
        },
        {
          name: "Team",
          description: "Team name responsible for the resource",
          allowed_values: null
        }
      ]
    }
  },
  {
    name: "Enterprise",
    description: "Comprehensive policy for large organizations",
    policy: {
      required_tags: [
        {
          name: "CostCenter",
          description: "Financial cost center code for chargeback and showback",
          allowed_values: null,
          validation_regex: "^CC-[0-9]{4,6}$",
          applies_to: ["ec2:instance", "ec2:volume", "ec2:snapshot", "rds:db", "s3:bucket", "lambda:function", "ecs:service", "ecs:task"]
        },
        {
          name: "Environment",
          description: "Deployment environment classification",
          allowed_values: ["production", "pre-production", "staging", "qa", "development", "sandbox", "disaster-recovery"],
          validation_regex: null,
          applies_to: ["ec2:instance", "ec2:volume", "rds:db", "s3:bucket", "lambda:function", "ecs:service"]
        },
        {
          name: "Owner",
          description: "Email address of the resource owner for accountability",
          allowed_values: null,
          validation_regex: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          applies_to: ["ec2:instance", "ec2:volume", "ec2:snapshot", "rds:db", "s3:bucket", "lambda:function", "ecs:service", "ecs:task"]
        },
        {
          name: "Application",
          description: "Application or service identifier from the CMDB",
          allowed_values: null,
          validation_regex: "^APP-[A-Z0-9]{3,10}$",
          applies_to: ["ec2:instance", "ec2:volume", "rds:db", "s3:bucket", "lambda:function", "ecs:service"]
        },
        {
          name: "DataClassification",
          description: "Data sensitivity classification per corporate security policy",
          allowed_values: ["public", "internal", "confidential", "restricted", "highly-restricted"],
          validation_regex: null,
          applies_to: ["s3:bucket", "rds:db", "ec2:volume", "ec2:snapshot"]
        },
        {
          name: "Compliance",
          description: "Regulatory compliance requirements applicable to this resource",
          allowed_values: ["HIPAA", "PCI-DSS", "SOC2", "GDPR", "SOX", "FedRAMP", "HITRUST", "None"],
          validation_regex: null,
          applies_to: ["ec2:instance", "rds:db", "s3:bucket", "lambda:function"]
        },
        {
          name: "BusinessUnit",
          description: "Business unit or division that owns this resource",
          allowed_values: ["Engineering", "Finance", "Marketing", "Sales", "Operations", "HR", "Legal", "IT", "Security", "Product"],
          validation_regex: null,
          applies_to: ["ec2:instance", "rds:db", "s3:bucket", "lambda:function", "ecs:service"]
        }
      ],
      optional_tags: [
        {
          name: "Project",
          description: "Project identifier for tracking project-specific costs",
          allowed_values: null
        },
        {
          name: "SupportTier",
          description: "Support tier level for incident response prioritization",
          allowed_values: ["platinum", "gold", "silver", "bronze"]
        },
        {
          name: "BackupSchedule",
          description: "Backup frequency and retention policy",
          allowed_values: ["daily-30d", "daily-90d", "weekly-1y", "monthly-7y", "none"]
        }
      ]
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
