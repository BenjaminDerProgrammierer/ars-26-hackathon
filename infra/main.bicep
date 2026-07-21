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

@description('Full container image reference, including its registry and tag or digest.')
param webAppContainerImage string = 'ghcr.io/benjaminderprogrammierer/ars-26-hackathon-web:latest'

var storageTableDataReaderRoleId = '76199698-9eea-4c19-bc75-cec21354c6b6'

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
      healthCheckPath: '/en/'
      http20Enabled: true
      linuxFxVersion: 'DOCKER|${webAppContainerImage}'
      minTlsVersion: '1.2'
      appSettings: [
        {
          name: 'WEBSITES_PORT'
          value: '80'
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

resource webAppTableReaderRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(accessCodesTable.id, webAppIdentity.id, storageTableDataReaderRoleId)
  scope: accessCodesTable
  properties: {
    principalId: webAppIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', storageTableDataReaderRoleId)
  }
}

output storageAccountResourceId string = storageAccount.id
output storageAccountName string = storageAccount.name
output tableName string = accessCodesTable.name
output tableServiceEndpoint string = 'https://${storageAccount.name}.table.${environment().suffixes.storage}'
output webAppDefaultHostname string = webApp.properties.defaultHostName
output webAppIdentityClientId string = webAppIdentity.properties.clientId
output webAppIdentityPrincipalId string = webAppIdentity.properties.principalId
