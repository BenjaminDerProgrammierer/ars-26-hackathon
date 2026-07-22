targetScope = 'resourceGroup'

param location string
param webAppName string
param appServicePlanName string
param appServicePlanSkuName string
param appServicePlanCapacity int
param webAppContainerImage string
param storageAccountName string
param accessCodesTableName string
param webAppIdentityName string
param githubDeploymentIdentityName string
param logAnalyticsWorkspaceName string
param alertEmailAddress string

var websiteContributorRoleId = 'de139f84-1756-47ae-9be6-808fbbe84772'
var tableServiceEndpoint = 'https://${storageAccountName}.table.${environment().suffixes.storage}'

resource webAppIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2024-11-30' existing = {
  name: webAppIdentityName
}

resource githubDeploymentIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2024-11-30' existing = {
  name: githubDeploymentIdentityName
}

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' existing = {
  name: logAnalyticsWorkspaceName
}

resource existingWebApp 'Microsoft.Web/sites@2024-11-01' existing = {
  name: webAppName
}

module appServicePlan 'br/public:avm/res/web/serverfarm:0.7.0' = {
  params: {
    name: appServicePlanName
    kind: 'linux'
    skuName: appServicePlanSkuName
    skuCapacity: appServicePlanCapacity
  }
}

module webApp 'br/public:avm/res/web/site:0.24.0' = {
  params: {
    name: webAppName
    kind: 'app,linux,container'
    serverFarmResourceId: resourceId('Microsoft.Web/serverFarms', appServicePlanName)
    clientAffinityEnabled: false
    managedIdentities: {
      userAssignedResourceIds: [
        webAppIdentity.id
      ]
    }
    siteConfig: {
      alwaysOn: true
      ftpsState: 'Disabled'
      healthCheckPath: '/api/health/'
      http20Enabled: true
      linuxFxVersion: 'DOCKER|${webAppContainerImage}'
      minTlsVersion: '1.2'
    }
    configs: [
      {
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
    ]
    diagnosticSettings: [
      {
        name: '${webAppName}-diagnostics'
        workspaceResourceId: logAnalyticsWorkspace.id
        logCategoriesAndGroups: [
          {
            category: 'AppServiceConsoleLogs'
          }
          {
            category: 'AppServicePlatformLogs'
          }
        ]
        metricCategories: [
          {
            category: 'AllMetrics'
          }
        ]
      }
    ]
  }
  dependsOn: [
    appServicePlan
  ]
}

resource webAppSettings 'Microsoft.Web/sites/config@2024-11-01' = {
  parent: existingWebApp
  name: 'appsettings'
  properties: {
    WEBSITES_PORT: '80'
    WEBSITE_HEALTHCHECK_MAXPINGFAILURES: '2'
    SITE_URL: 'https://${webAppName}.azurewebsites.net'
    AZURE_STORAGE_ACCOUNT_NAME: storageAccountName
    AZURE_STORAGE_TABLE_NAME: accessCodesTableName
    AZURE_STORAGE_TABLE_ENDPOINT: tableServiceEndpoint
    AZURE_CLIENT_ID: webAppIdentity.properties.clientId
    AZURE_TOKEN_CREDENTIALS: 'prod'
  }
  dependsOn: [
    webApp
  ]
}

resource githubWebAppRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(existingWebApp.id, githubDeploymentIdentity.id, 'Website Contributor')
  scope: existingWebApp
  properties: {
    principalId: githubDeploymentIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      websiteContributorRoleId
    )
  }
  dependsOn: [
    webApp
  ]
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
      webApp.outputs.resourceId
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

output defaultHostname string = webApp.outputs.defaultHostname
