targetScope = 'resourceGroup'

@description('Azure region for the storage account.')
@allowed([
  'austriaeast'
])
param location string = 'austriaeast'

@description('Globally unique name of the storage account.')
@minLength(3)
@maxLength(24)
param storageAccountName string = 'arselectronicahackathon'

@description('Name of the table that stores access-code records.')
@minLength(3)
@maxLength(63)
param accessCodesTableName string = 'AccessCodes'

@description('Globally unique name of the Linux web app.')
@minLength(2)
@maxLength(60)
param webAppName string = 'arselectronicahackathon-web'

@description('Name of the App Service plan that hosts the web app.')
param appServicePlanName string = 'arselectronicahackathon-web-plan'

@description('App Service plan SKU. B1 is the default production baseline with Always On support.')
param appServicePlanSkuName string = 'B1'

@description('Number of App Service workers. Health Check requires at least two for traffic failover.')
@minValue(2)
param appServicePlanCapacity int = 2

@description('Full container image reference, including its registry and tag or digest.')
param webAppContainerImage string = 'ghcr.io/benjaminderprogrammierer/ars-26-hackathon-web:latest'

@description('Name of the Log Analytics workspace for retained web app diagnostics.')
param logAnalyticsWorkspaceName string = 'arselectronicahackathon-web-logs'

@description('Email address that receives web app HTTP 5xx alerts. Leave empty to create the alert without email delivery.')
param alertEmailAddress string = ''

resource storageAccount 'Microsoft.Storage/storageAccounts@2025-01-01' = {
  name: storageAccountName
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    allowBlobPublicAccess: false
    allowCrossTenantReplication: false
    allowSharedKeyAccess: false
    defaultToOAuthAuthentication: true
    minimumTlsVersion: 'TLS1_2'
    publicNetworkAccess: 'Enabled'
    supportsHttpsTrafficOnly: true
    networkAcls: {
      bypass: 'None'
      defaultAction: 'Allow'
      ipRules: []
      virtualNetworkRules: []
    }
  }
}

resource tableService 'Microsoft.Storage/storageAccounts/tableServices@2025-01-01' = {
  parent: storageAccount
  name: 'default'
}

resource accessCodesTable 'Microsoft.Storage/storageAccounts/tableServices/tables@2025-01-01' = {
  parent: tableService
  name: accessCodesTableName
  properties: {}
}

resource webAppIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2024-11-30' = {
  name: '${webAppName}-identity'
  location: location
}

resource appServicePlan 'Microsoft.Web/serverFarms@2024-11-01' = {
  name: appServicePlanName
  location: location
  kind: 'linux'
  sku: {
    name: appServicePlanSkuName
    capacity: appServicePlanCapacity
  }
  properties: {
    reserved: true
  }
}

resource webApp 'Microsoft.Web/sites@2024-11-01' = {
  name: webAppName
  location: location
  kind: 'app,linux,container'
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${webAppIdentity.id}': {}
    }
  }
  properties: {
    clientAffinityEnabled: false
    httpsOnly: true
    publicNetworkAccess: 'Enabled'
    serverFarmId: appServicePlan.id
    siteConfig: {
      alwaysOn: true
      ftpsState: 'Disabled'
      healthCheckPath: '/api/health/'
      http20Enabled: true
      linuxFxVersion: 'DOCKER|${webAppContainerImage}'
      minTlsVersion: '1.2'
      appSettings: [
        {
          name: 'WEBSITES_PORT'
          value: '80'
        }
        {
          name: 'WEBSITE_HEALTHCHECK_MAXPINGFAILURES'
          value: '2'
        }
        {
          name: 'SITE_URL'
          value: 'https://${webAppName}.azurewebsites.net'
        }
        {
          name: 'AZURE_STORAGE_ACCOUNT_NAME'
          value: storageAccount.name
        }
        {
          name: 'AZURE_STORAGE_TABLE_NAME'
          value: accessCodesTable.name
        }
        {
          name: 'AZURE_STORAGE_TABLE_ENDPOINT'
          value: 'https://${storageAccount.name}.table.${environment().suffixes.storage}'
        }
        {
          name: 'AZURE_CLIENT_ID'
          value: webAppIdentity.properties.clientId
        }
        {
          name: 'AZURE_TOKEN_CREDENTIALS'
          value: 'prod'
        }
      ]
    }
  }
}

module webAppTableReaderRole 'modules/table-reader-role.bicep' = {
  name: 'table-reader-${uniqueString(webAppName)}'
  params: {
    storageAccountName: storageAccount.name
    tableName: accessCodesTable.name
    principalId: webAppIdentity.properties.principalId
  }
}

resource webAppLogs 'Microsoft.Web/sites/config@2024-11-01' = {
  parent: webApp
  name: 'logs'
  properties: {
    applicationLogs: {
      fileSystem: {
        level: 'Information'
      }
    }
    detailedErrorMessages: {
      enabled: true
    }
    failedRequestsTracing: {
      enabled: true
    }
    httpLogs: {
      fileSystem: {
        enabled: true
        retentionInDays: 7
        retentionInMb: 35
      }
    }
  }
}

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsWorkspaceName
  location: location
  properties: {
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
    retentionInDays: 30
    sku: {
      name: 'PerGB2018'
    }
  }
}

resource webAppDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: '${webAppName}-diagnostics'
  scope: webApp
  properties: {
    workspaceId: logAnalyticsWorkspace.id
    logs: [
      {
        category: 'AppServiceConsoleLogs'
        enabled: true
      }
      {
        category: 'AppServicePlatformLogs'
        enabled: true
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
      }
    ]
  }
}

resource webAppAlertActionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: '${webAppName}-alerts'
  location: 'Global'
  properties: {
    enabled: true
    groupShortName: 'arsweb'
    emailReceivers: empty(alertEmailAddress) ? [] : [
      {
        name: 'Web operations'
        emailAddress: alertEmailAddress
        useCommonAlertSchema: true
      }
    ]
  }
}

resource webAppServerErrorAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${webAppName}-http-5xx'
  location: 'global'
  properties: {
    description: 'The web app returned one or more HTTP 5xx responses in five minutes.'
    severity: 2
    enabled: true
    scopes: [
      webApp.id
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    autoMitigate: true
    targetResourceType: 'Microsoft.Web/sites'
    targetResourceRegion: location
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          criterionType: 'StaticThresholdCriterion'
          name: 'Http5xx'
          metricName: 'Http5xx'
          metricNamespace: 'Microsoft.Web/sites'
          operator: 'GreaterThan'
          threshold: 0
          timeAggregation: 'Total'
          skipMetricValidation: false
        }
      ]
    }
    actions: [
      {
        actionGroupId: webAppAlertActionGroup.id
      }
    ]
  }
}

output storageAccountResourceId string = storageAccount.id
output storageAccountName string = storageAccount.name
output tableName string = accessCodesTable.name
output tableServiceEndpoint string = 'https://${storageAccount.name}.table.${environment().suffixes.storage}'
output webAppDefaultHostname string = webApp.properties.defaultHostName
output webAppIdentityClientId string = webAppIdentity.properties.clientId
output webAppIdentityPrincipalId string = webAppIdentity.properties.principalId
output logAnalyticsWorkspaceId string = logAnalyticsWorkspace.id
