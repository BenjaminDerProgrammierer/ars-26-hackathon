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

output storageAccountResourceId string = storageAccount.id
output storageAccountName string = storageAccount.name
output tableName string = accessCodesTable.name
output tableServiceEndpoint string = 'https://${storageAccount.name}.table.${environment().suffixes.storage}'
