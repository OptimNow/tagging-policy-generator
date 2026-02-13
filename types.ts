export type CloudProvider = 'aws' | 'gcp' | 'azure';

export interface TagNamingRules {
  case_sensitivity: boolean;
  allow_special_characters: boolean;
  max_key_length: number;
  max_value_length: number;
}

export interface RequiredTag {
  name: string;
  description: string;
  allowed_values: string[] | null;
  validation_regex: string | null;
  applies_to: string[];
}

export interface OptionalTag {
  name: string;
  description: string;
  allowed_values: string[] | null;
}

export interface Policy {
  version: string;
  last_updated: string;
  cloud_provider: CloudProvider;
  required_tags: RequiredTag[];
  optional_tags: OptionalTag[];
  tag_naming_rules: TagNamingRules;
}

// Resource categories organized by typical spend impact for FinOps prioritization
export interface ResourceCategory {
  name: string;
  description: string;
  resources: string[];
}

// AWS Tag Policy enforced_for resource types
// Only includes resource types with "Enforce for IaC" = Yes per AWS documentation
// Reference: https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_supported-resources-enforcement.html
export const AWS_RESOURCE_CATEGORIES: ResourceCategory[] = [
  {
    name: 'Compute',
    description: '40-60% of typical spend',
    resources: [
      'ec2:instance',
      'ec2:volume',
      'lambda:function',
      'ecs:service',
      'ecs:cluster',
      'ecs:task-definition',
      'eks:cluster',
      'eks:nodegroup',
    ]
  },
  {
    name: 'Storage',
    description: '10-20% of typical spend',
    resources: [
      's3:bucket',
      'elasticfilesystem:file-system',
      'fsx:file-system',
    ]
  },
  {
    name: 'Database',
    description: '15-25% of typical spend',
    resources: [
      'rds:db',
      'dynamodb:table',
      'elasticache:cluster',
      'redshift:cluster',
    ]
  },
  {
    name: 'AI/ML',
    description: 'Growing rapidly',
    resources: [
      'sagemaker:endpoint',
      'sagemaker:notebook-instance',
      'bedrock:agent',
      'bedrock:knowledge-base',
    ]
  },
  {
    name: 'Networking',
    description: 'Often overlooked',
    resources: [
      'elasticloadbalancing:loadbalancer',
      'elasticloadbalancing:targetgroup',
      'ec2:natgateway',
      'ec2:vpc',
      'ec2:subnet',
      'ec2:security-group',
    ]
  },
  {
    name: 'Analytics',
    description: 'Data & streaming',
    resources: [
      'kinesis:stream',
      'glue:job',
    ]
  },
];

// GCP label resource types organized by typical spend impact
// Uses full GCP resource type URIs (service.googleapis.com/ResourceType)
export const GCP_RESOURCE_CATEGORIES: ResourceCategory[] = [
  {
    name: 'Compute',
    description: '40-60% of typical spend',
    resources: [
      'compute.googleapis.com/Instance',
      'compute.googleapis.com/Disk',
      'compute.googleapis.com/Image',
      'compute.googleapis.com/Snapshot',
      'run.googleapis.com/Service',
      'container.googleapis.com/Cluster',
      'cloudworkstations.googleapis.com/Cluster',
    ]
  },
  {
    name: 'Storage',
    description: '10-20% of typical spend',
    resources: [
      'storage.googleapis.com/Bucket',
      'filestore.googleapis.com/Instance',
      'artifactregistry.googleapis.com/Repository',
    ]
  },
  {
    name: 'Database',
    description: '15-25% of typical spend',
    resources: [
      'sqladmin.googleapis.com/Instance',
      'bigtable.googleapis.com/Instance',
      'spanner.googleapis.com/Instance',
      'alloydb.googleapis.com/Cluster',
      'firestore.googleapis.com/Database',
      'datastore.googleapis.com/Database',
      'memorystore.googleapis.com/Instance',
    ]
  },
  {
    name: 'AI/ML',
    description: 'Growing rapidly',
    resources: [
      'aiplatform.googleapis.com/Endpoint',
      'aiplatform.googleapis.com/NotebookRuntime',
      'datafusion.googleapis.com/Instance',
    ]
  },
  {
    name: 'Networking',
    description: 'Often overlooked',
    resources: [
      'compute.googleapis.com/ForwardingRule',
      'compute.googleapis.com/Network',
      'compute.googleapis.com/Subnetwork',
      'compute.googleapis.com/Router',
      'compute.googleapis.com/VpnGateway',
      'compute.googleapis.com/VpnTunnel',
      'compute.googleapis.com/Interconnect',
      'compute.googleapis.com/InterconnectAttachment',
      'compute.googleapis.com/BackendService',
    ]
  },
  {
    name: 'Analytics',
    description: 'Data & streaming',
    resources: [
      'bigquery.googleapis.com/Dataset',
      'bigquery.googleapis.com/Table',
      'dataflow.googleapis.com/Job',
      'dataproc.googleapis.com/Cluster',
      'pubsub.googleapis.com/Topic',
      'pubsub.googleapis.com/Subscription',
      'dataprocmetastore.googleapis.com/Service',
    ]
  },
  {
    name: 'Security & Operations',
    description: 'Security, compliance, and observability',
    resources: [
      'cloudkms.googleapis.com/KeyRing',
      'secretmanager.googleapis.com/Secret',
      'logging.googleapis.com/LogBucket',
    ]
  },
];

// Azure tag resource types organized by typical spend impact
// Uses full Azure resource provider format (Microsoft.Provider/resourceType)
// Only includes resources where both "Supports tags" = Yes AND "Tag in cost report" = Yes
// Reference: https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/tag-support
export const AZURE_RESOURCE_CATEGORIES: ResourceCategory[] = [
  {
    name: 'Compute',
    description: '40-60% of typical spend',
    resources: [
      'Microsoft.Compute/virtualMachines',
      'Microsoft.Compute/virtualMachineScaleSets',
      'Microsoft.Compute/disks',
      'Microsoft.Compute/availabilitySets',
      'Microsoft.Compute/hostGroups',
      'Microsoft.Compute/hostGroups/hosts',
      'Microsoft.Compute/capacityReservationGroups',
      'Microsoft.Compute/cloudServices',
      'Microsoft.Compute/images',
      'Microsoft.Compute/snapshots',
      'Microsoft.App/containerApps',
      'Microsoft.App/managedEnvironments',
      'Microsoft.App/jobs',
      'Microsoft.ContainerInstance/containerGroups',
      'Microsoft.Batch/batchAccounts',
      'Microsoft.DesktopVirtualization/hostpools',
      'Microsoft.DesktopVirtualization/applicationgroups',
      'Microsoft.DesktopVirtualization/workspaces',
    ]
  },
  {
    name: 'Storage',
    description: '10-20% of typical spend',
    resources: [
      'Microsoft.Storage/storageAccounts',
      'Microsoft.DataLakeStore/accounts',
      'Microsoft.DataLakeAnalytics/accounts',
      'Microsoft.NetApp/netAppAccounts',
      'Microsoft.StorageCache/caches',
      'Microsoft.DataBox/jobs',
      'Microsoft.DataBoxEdge/DataBoxEdgeDevices',
    ]
  },
  {
    name: 'Database',
    description: '15-25% of typical spend',
    resources: [
      'Microsoft.Sql/servers',
      'Microsoft.Sql/servers/databases',
      'Microsoft.Sql/managedInstances',
      'Microsoft.Sql/servers/elasticPools',
      'Microsoft.DocumentDB/databaseAccounts',
      'Microsoft.DBforPostgreSQL/flexibleServers',
      'Microsoft.DBforMySQL/flexibleServers',
      'Microsoft.DBforMariaDB/servers',
      'Microsoft.Cache/redis',
      'Microsoft.Kusto/clusters',
    ]
  },
  {
    name: 'AI/ML',
    description: 'Growing rapidly',
    resources: [
      'Microsoft.MachineLearningServices/workspaces',
      'Microsoft.CognitiveServices/accounts',
      'Microsoft.CognitiveServices/commitmentPlans',
      'Microsoft.Search/searchServices',
      'Microsoft.BotService/botServices',
    ]
  },
  {
    name: 'Networking',
    description: 'Often overlooked',
    resources: [
      'Microsoft.Network/virtualNetworks',
      'Microsoft.Network/publicIPAddresses',
      'Microsoft.Network/networkSecurityGroups',
      'Microsoft.Network/loadBalancers',
      'Microsoft.Network/applicationGateways',
      'Microsoft.Network/virtualNetworkGateways',
      'Microsoft.Network/expressRouteCircuits',
      'Microsoft.Network/firewallPolicies',
      'Microsoft.Network/azureFirewalls',
      'Microsoft.Network/bastionHosts',
      'Microsoft.Network/frontDoors',
      'Microsoft.Network/privateDnsZones',
      'Microsoft.Network/dnsZones',
      'Microsoft.Network/natGateways',
      'Microsoft.Network/privateEndpoints',
      'Microsoft.Cdn/profiles',
    ]
  },
  {
    name: 'Containers & Kubernetes',
    description: 'Container orchestration',
    resources: [
      'Microsoft.ContainerService/managedClusters',
      'Microsoft.ContainerRegistry/registries',
      'Microsoft.ContainerService/fleets',
      'Microsoft.Kubernetes/connectedClusters',
    ]
  },
  {
    name: 'Analytics & Integration',
    description: 'Data & streaming',
    resources: [
      'Microsoft.Databricks/workspaces',
      'Microsoft.DataFactory/factories',
      'Microsoft.Synapse/workspaces',
      'Microsoft.StreamAnalytics/streamingjobs',
      'Microsoft.EventHub/namespaces',
      'Microsoft.EventHub/clusters',
      'Microsoft.EventGrid/topics',
      'Microsoft.EventGrid/domains',
      'Microsoft.ServiceBus/namespaces',
      'Microsoft.HDInsight/clusters',
      'Microsoft.Fabric/capacities',
    ]
  },
  {
    name: 'Web & Application',
    description: 'App hosting and APIs',
    resources: [
      'Microsoft.Web/sites',
      'Microsoft.Web/serverFarms',
      'Microsoft.Web/staticSites',
      'Microsoft.Web/certificates',
      'Microsoft.SignalRService/signalR',
      'Microsoft.ApiManagement/service',
    ]
  },
  {
    name: 'Security & Identity',
    description: 'Security, vaults, identity',
    resources: [
      'Microsoft.KeyVault/vaults',
      'Microsoft.KeyVault/managedHSMs',
      'Microsoft.ManagedIdentity/userAssignedIdentities',
    ]
  },
  {
    name: 'Monitoring',
    description: 'Observability and diagnostics',
    resources: [
      'Microsoft.Insights/components',
      'Microsoft.Insights/actionGroups',
      'Microsoft.Insights/autoscaleSettings',
      'Microsoft.OperationalInsights/workspaces',
      'Microsoft.Insights/workbooks',
    ]
  },
  {
    name: 'DevOps & DevCenter',
    description: 'Dev/test resources',
    resources: [
      'Microsoft.DevCenter/devcenters',
      'Microsoft.DevCenter/projects',
      'Microsoft.DevTestLab/labs',
      'Microsoft.LabServices/labs',
    ]
  },
];

// Backward-compatible alias
export const RESOURCE_CATEGORIES = AWS_RESOURCE_CATEGORIES;

// Flat lists of all resource types (derived from categories)
export const AWS_RESOURCE_TYPES = AWS_RESOURCE_CATEGORIES.flatMap(cat => cat.resources);
export const GCP_RESOURCE_TYPES = GCP_RESOURCE_CATEGORIES.flatMap(cat => cat.resources);
export const AZURE_RESOURCE_TYPES = AZURE_RESOURCE_CATEGORIES.flatMap(cat => cat.resources);

// Helper functions to get provider-specific categories/types
export function getResourceCategories(provider: CloudProvider): ResourceCategory[] {
  switch (provider) {
    case 'gcp': return GCP_RESOURCE_CATEGORIES;
    case 'azure': return AZURE_RESOURCE_CATEGORIES;
    default: return AWS_RESOURCE_CATEGORIES;
  }
}

export function getResourceTypes(provider: CloudProvider): string[] {
  switch (provider) {
    case 'gcp': return GCP_RESOURCE_TYPES;
    case 'azure': return AZURE_RESOURCE_TYPES;
    default: return AWS_RESOURCE_TYPES;
  }
}
