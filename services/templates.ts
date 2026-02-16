import { Policy, CloudProvider } from '../types';

interface Template {
  name: string;
  description: string;
  provider: CloudProvider;
  policy: Partial<Policy>;
}

// Templates using AWS Tag Policy enforced_for resource type names
// and GCP label resource type URIs
export const TEMPLATES: Template[] = [
  // ===== AWS Templates =====
  {
    name: "Cost Allocation",
    description: "Basic cost tracking and chargeback",
    provider: 'aws',
    policy: {
      cloud_provider: 'aws',
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
    provider: 'aws',
    policy: {
      cloud_provider: 'aws',
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
    provider: 'aws',
    policy: {
      cloud_provider: 'aws',
      required_tags: [
        {
          name: "CostCenter",
          description: "Financial cost center code for chargeback and showback",
          allowed_values: null,
          validation_regex: "^CC-[0-9]{4,6}$",
          applies_to: ["ec2:instance", "ec2:volume", "rds:db", "s3:bucket", "lambda:function", "ecs:service", "ecs:task-definition"]
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
          applies_to: ["ec2:instance", "ec2:volume", "rds:db", "s3:bucket", "lambda:function", "ecs:service", "ecs:task-definition"]
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
          applies_to: ["s3:bucket", "rds:db", "ec2:volume"]
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
    provider: 'aws',
    policy: {
      cloud_provider: 'aws',
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
  },

  // ===== GCP Templates =====
  {
    name: "Cost Allocation",
    description: "Basic cost tracking and chargeback",
    provider: 'gcp',
    policy: {
      cloud_provider: 'gcp',
      required_tags: [
        {
          name: "cost_center",
          description: "Department for cost allocation",
          allowed_values: ["engineering", "marketing", "sales", "operations"],
          validation_regex: null,
          applies_to: ["compute.googleapis.com/Instance", "sqladmin.googleapis.com/Instance", "storage.googleapis.com/Bucket", "run.googleapis.com/Service", "memorystore.googleapis.com/Instance", "bigquery.googleapis.com/Dataset"]
        },
        {
          name: "owner",
          description: "Email address of the resource owner",
          allowed_values: null,
          validation_regex: "^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$",
          applies_to: ["compute.googleapis.com/Instance", "sqladmin.googleapis.com/Instance", "storage.googleapis.com/Bucket", "run.googleapis.com/Service", "memorystore.googleapis.com/Instance", "bigquery.googleapis.com/Dataset"]
        },
        {
          name: "environment",
          description: "Deployment environment",
          allowed_values: ["production", "staging", "development", "test"],
          validation_regex: null,
          applies_to: ["compute.googleapis.com/Instance", "sqladmin.googleapis.com/Instance", "run.googleapis.com/Service", "memorystore.googleapis.com/Instance"]
        }
      ],
      optional_tags: [
        {
          name: "project_id",
          description: "Project identifier for cost tracking",
          allowed_values: null
        }
      ]
    }
  },
  {
    name: "Startup",
    description: "Lightweight policy for smaller organizations",
    provider: 'gcp',
    policy: {
      cloud_provider: 'gcp',
      required_tags: [
        {
          name: "environment",
          description: "Deployment environment for the resource",
          allowed_values: ["production", "staging", "development"],
          validation_regex: null,
          applies_to: ["compute.googleapis.com/Instance", "sqladmin.googleapis.com/Instance", "storage.googleapis.com/Bucket", "run.googleapis.com/Service", "memorystore.googleapis.com/Instance"]
        },
        {
          name: "owner",
          description: "Email address of the team or person responsible for this resource",
          allowed_values: null,
          validation_regex: "^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$",
          applies_to: ["compute.googleapis.com/Instance", "sqladmin.googleapis.com/Instance", "storage.googleapis.com/Bucket", "run.googleapis.com/Service", "memorystore.googleapis.com/Instance"]
        },
        {
          name: "project_name",
          description: "Project or product name this resource belongs to",
          allowed_values: null,
          validation_regex: "^[a-z0-9-]+$",
          applies_to: ["compute.googleapis.com/Instance", "sqladmin.googleapis.com/Instance", "storage.googleapis.com/Bucket", "run.googleapis.com/Service", "container.googleapis.com/Cluster", "memorystore.googleapis.com/Instance"]
        }
      ],
      optional_tags: [
        {
          name: "cost_center",
          description: "Cost center for billing allocation (optional for startups with simple cost structures)",
          allowed_values: null
        },
        {
          name: "team",
          description: "Team name responsible for the resource",
          allowed_values: null
        }
      ]
    }
  },
  {
    name: "Enterprise",
    description: "Comprehensive policy for large organizations",
    provider: 'gcp',
    policy: {
      cloud_provider: 'gcp',
      required_tags: [
        {
          name: "cost_center",
          description: "Financial cost center code for chargeback and showback",
          allowed_values: null,
          validation_regex: "^cc-[0-9]{4,6}$",
          applies_to: ["compute.googleapis.com/Instance", "compute.googleapis.com/Disk", "compute.googleapis.com/Snapshot", "sqladmin.googleapis.com/Instance", "storage.googleapis.com/Bucket", "run.googleapis.com/Service", "container.googleapis.com/Cluster", "memorystore.googleapis.com/Instance", "firestore.googleapis.com/Database", "bigquery.googleapis.com/Dataset", "spanner.googleapis.com/Instance"]
        },
        {
          name: "environment",
          description: "Deployment environment classification",
          allowed_values: ["production", "pre-production", "staging", "qa", "development", "sandbox", "disaster-recovery"],
          validation_regex: null,
          applies_to: ["compute.googleapis.com/Instance", "compute.googleapis.com/Disk", "sqladmin.googleapis.com/Instance", "storage.googleapis.com/Bucket", "run.googleapis.com/Service", "container.googleapis.com/Cluster", "memorystore.googleapis.com/Instance", "firestore.googleapis.com/Database", "spanner.googleapis.com/Instance"]
        },
        {
          name: "owner",
          description: "Email address of the resource owner for accountability",
          allowed_values: null,
          validation_regex: "^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$",
          applies_to: ["compute.googleapis.com/Instance", "compute.googleapis.com/Disk", "compute.googleapis.com/Snapshot", "sqladmin.googleapis.com/Instance", "storage.googleapis.com/Bucket", "run.googleapis.com/Service", "container.googleapis.com/Cluster", "memorystore.googleapis.com/Instance", "firestore.googleapis.com/Database", "bigquery.googleapis.com/Dataset", "spanner.googleapis.com/Instance"]
        },
        {
          name: "application",
          description: "Application or service identifier from the CMDB",
          allowed_values: null,
          validation_regex: "^app-[a-z0-9]{3,10}$",
          applies_to: ["compute.googleapis.com/Instance", "compute.googleapis.com/Disk", "sqladmin.googleapis.com/Instance", "storage.googleapis.com/Bucket", "run.googleapis.com/Service", "container.googleapis.com/Cluster", "memorystore.googleapis.com/Instance", "firestore.googleapis.com/Database"]
        },
        {
          name: "data_classification",
          description: "Data sensitivity classification per corporate security policy",
          allowed_values: ["public", "internal", "confidential", "restricted", "highly-restricted"],
          validation_regex: null,
          applies_to: ["storage.googleapis.com/Bucket", "sqladmin.googleapis.com/Instance", "compute.googleapis.com/Disk", "bigquery.googleapis.com/Dataset", "bigquery.googleapis.com/Table", "firestore.googleapis.com/Database", "spanner.googleapis.com/Instance", "secretmanager.googleapis.com/Secret"]
        },
        {
          name: "compliance",
          description: "Regulatory compliance requirements applicable to this resource",
          allowed_values: ["hipaa", "pci-dss", "soc2", "gdpr", "sox", "fedramp", "hitrust", "none"],
          validation_regex: null,
          applies_to: ["compute.googleapis.com/Instance", "sqladmin.googleapis.com/Instance", "storage.googleapis.com/Bucket", "run.googleapis.com/Service", "firestore.googleapis.com/Database", "spanner.googleapis.com/Instance", "cloudkms.googleapis.com/KeyRing"]
        },
        {
          name: "business_unit",
          description: "Business unit or division that owns this resource",
          allowed_values: ["engineering", "finance", "marketing", "sales", "operations", "hr", "legal", "it", "security", "product"],
          validation_regex: null,
          applies_to: ["compute.googleapis.com/Instance", "sqladmin.googleapis.com/Instance", "storage.googleapis.com/Bucket", "run.googleapis.com/Service", "container.googleapis.com/Cluster", "memorystore.googleapis.com/Instance", "bigquery.googleapis.com/Dataset"]
        }
      ],
      optional_tags: [
        {
          name: "project_name",
          description: "Project identifier for tracking project-specific costs",
          allowed_values: null
        },
        {
          name: "support_tier",
          description: "Support tier level for incident response prioritization",
          allowed_values: ["platinum", "gold", "silver", "bronze"]
        },
        {
          name: "backup_schedule",
          description: "Backup frequency and retention policy",
          allowed_values: ["daily-30d", "daily-90d", "weekly-1y", "monthly-7y", "none"]
        }
      ]
    }
  },
  {
    name: "Minimal Starter",
    description: "Essential labels to get started",
    provider: 'gcp',
    policy: {
      cloud_provider: 'gcp',
      required_tags: [
        {
          name: "cost_center",
          description: "Department for cost allocation",
          allowed_values: null,
          validation_regex: null,
          applies_to: ["compute.googleapis.com/Instance", "sqladmin.googleapis.com/Instance", "storage.googleapis.com/Bucket"]
        },
        {
          name: "owner",
          description: "Email address of the resource owner",
          allowed_values: null,
          validation_regex: null,
          applies_to: ["compute.googleapis.com/Instance", "sqladmin.googleapis.com/Instance", "storage.googleapis.com/Bucket"]
        },
        {
          name: "environment",
          description: "Deployment environment",
          allowed_values: ["production", "staging", "development"],
          validation_regex: null,
          applies_to: ["compute.googleapis.com/Instance", "sqladmin.googleapis.com/Instance"]
        }
      ],
      optional_tags: []
    }
  },

  // ===== Azure Templates =====
  {
    name: "Cost Allocation",
    description: "Basic cost tracking and chargeback",
    provider: 'azure',
    policy: {
      cloud_provider: 'azure',
      required_tags: [
        {
          name: "CostCenter",
          description: "Department for cost allocation",
          allowed_values: ["Engineering", "Marketing", "Sales", "Operations"],
          validation_regex: null,
          applies_to: ["Microsoft.Compute/virtualMachines", "Microsoft.Sql/servers/databases", "Microsoft.Storage/storageAccounts", "Microsoft.Web/sites", "Microsoft.ContainerService/managedClusters"]
        },
        {
          name: "Owner",
          description: "Email address of the resource owner",
          allowed_values: null,
          validation_regex: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          applies_to: ["Microsoft.Compute/virtualMachines", "Microsoft.Sql/servers/databases", "Microsoft.Storage/storageAccounts", "Microsoft.Web/sites", "Microsoft.ContainerService/managedClusters"]
        },
        {
          name: "Environment",
          description: "Deployment environment",
          allowed_values: ["production", "staging", "development", "test"],
          validation_regex: null,
          applies_to: ["Microsoft.Compute/virtualMachines", "Microsoft.Sql/servers/databases", "Microsoft.Web/sites"]
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
    provider: 'azure',
    policy: {
      cloud_provider: 'azure',
      required_tags: [
        {
          name: "Environment",
          description: "Deployment environment for the resource",
          allowed_values: ["production", "staging", "development"],
          validation_regex: null,
          applies_to: ["Microsoft.Compute/virtualMachines", "Microsoft.Sql/servers/databases", "Microsoft.Storage/storageAccounts", "Microsoft.Web/sites"]
        },
        {
          name: "Owner",
          description: "Email address of the team or person responsible for this resource",
          allowed_values: null,
          validation_regex: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          applies_to: ["Microsoft.Compute/virtualMachines", "Microsoft.Sql/servers/databases", "Microsoft.Storage/storageAccounts", "Microsoft.Web/sites"]
        },
        {
          name: "Project",
          description: "Project or product name this resource belongs to",
          allowed_values: null,
          validation_regex: "^[a-z0-9-]+$",
          applies_to: ["Microsoft.Compute/virtualMachines", "Microsoft.Sql/servers/databases", "Microsoft.Storage/storageAccounts", "Microsoft.Web/sites", "Microsoft.ContainerService/managedClusters"]
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
    provider: 'azure',
    policy: {
      cloud_provider: 'azure',
      required_tags: [
        {
          name: "CostCenter",
          description: "Financial cost center code for chargeback and showback",
          allowed_values: null,
          validation_regex: "^CC-[0-9]{4,6}$",
          applies_to: ["Microsoft.Compute/virtualMachines", "Microsoft.Compute/disks", "Microsoft.Compute/snapshots", "Microsoft.Sql/servers/databases", "Microsoft.Storage/storageAccounts", "Microsoft.Web/sites", "Microsoft.ContainerService/managedClusters", "Microsoft.DocumentDB/databaseAccounts"]
        },
        {
          name: "Environment",
          description: "Deployment environment classification",
          allowed_values: ["production", "pre-production", "staging", "qa", "development", "sandbox", "disaster-recovery"],
          validation_regex: null,
          applies_to: ["Microsoft.Compute/virtualMachines", "Microsoft.Compute/disks", "Microsoft.Sql/servers/databases", "Microsoft.Storage/storageAccounts", "Microsoft.Web/sites", "Microsoft.ContainerService/managedClusters", "Microsoft.DocumentDB/databaseAccounts"]
        },
        {
          name: "Owner",
          description: "Email address of the resource owner for accountability",
          allowed_values: null,
          validation_regex: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          applies_to: ["Microsoft.Compute/virtualMachines", "Microsoft.Compute/disks", "Microsoft.Compute/snapshots", "Microsoft.Sql/servers/databases", "Microsoft.Storage/storageAccounts", "Microsoft.Web/sites", "Microsoft.ContainerService/managedClusters", "Microsoft.DocumentDB/databaseAccounts"]
        },
        {
          name: "Application",
          description: "Application or service identifier from the CMDB",
          allowed_values: null,
          validation_regex: "^APP-[A-Z0-9]{3,10}$",
          applies_to: ["Microsoft.Compute/virtualMachines", "Microsoft.Compute/disks", "Microsoft.Sql/servers/databases", "Microsoft.Storage/storageAccounts", "Microsoft.Web/sites", "Microsoft.ContainerService/managedClusters", "Microsoft.DocumentDB/databaseAccounts"]
        },
        {
          name: "DataClassification",
          description: "Data sensitivity classification per corporate security policy",
          allowed_values: ["public", "internal", "confidential", "restricted", "highly-restricted"],
          validation_regex: null,
          applies_to: ["Microsoft.Storage/storageAccounts", "Microsoft.Sql/servers/databases", "Microsoft.Compute/disks", "Microsoft.DocumentDB/databaseAccounts", "Microsoft.KeyVault/vaults"]
        },
        {
          name: "Compliance",
          description: "Regulatory compliance requirements applicable to this resource",
          allowed_values: ["HIPAA", "PCI-DSS", "SOC2", "GDPR", "SOX", "FedRAMP", "HITRUST", "None"],
          validation_regex: null,
          applies_to: ["Microsoft.Compute/virtualMachines", "Microsoft.Sql/servers/databases", "Microsoft.Storage/storageAccounts", "Microsoft.Web/sites", "Microsoft.KeyVault/vaults"]
        },
        {
          name: "BusinessUnit",
          description: "Business unit or division that owns this resource",
          allowed_values: ["Engineering", "Finance", "Marketing", "Sales", "Operations", "HR", "Legal", "IT", "Security", "Product"],
          validation_regex: null,
          applies_to: ["Microsoft.Compute/virtualMachines", "Microsoft.Sql/servers/databases", "Microsoft.Storage/storageAccounts", "Microsoft.Web/sites", "Microsoft.ContainerService/managedClusters", "Microsoft.DocumentDB/databaseAccounts"]
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
    provider: 'azure',
    policy: {
      cloud_provider: 'azure',
      required_tags: [
        {
          name: "CostCenter",
          description: "Department for cost allocation",
          allowed_values: null,
          validation_regex: null,
          applies_to: ["Microsoft.Compute/virtualMachines", "Microsoft.Sql/servers/databases", "Microsoft.Storage/storageAccounts"]
        },
        {
          name: "Owner",
          description: "Email address of the resource owner",
          allowed_values: null,
          validation_regex: null,
          applies_to: ["Microsoft.Compute/virtualMachines", "Microsoft.Sql/servers/databases", "Microsoft.Storage/storageAccounts"]
        },
        {
          name: "Environment",
          description: "Deployment environment",
          allowed_values: ["production", "staging", "development"],
          validation_regex: null,
          applies_to: ["Microsoft.Compute/virtualMachines", "Microsoft.Sql/servers/databases"]
        }
      ],
      optional_tags: []
    }
  }
];
