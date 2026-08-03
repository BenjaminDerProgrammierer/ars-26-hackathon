targetScope = 'resourceGroup'

param storageAccountName string
param tableName string
param principalId string

var storageTableDataContributorRoleId = '0a9a7e1f-b9d0-4cc4-a60d-0319b160aaa3'

resource table 'Microsoft.Storage/storageAccounts/tableServices/tables@2025-01-01' existing = {
  name: '${storageAccountName}/default/${tableName}'
}

resource tableContributorRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(table.id, principalId, storageTableDataContributorRoleId)
  scope: table
  properties: {
    principalId: principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', storageTableDataContributorRoleId)
  }
}
