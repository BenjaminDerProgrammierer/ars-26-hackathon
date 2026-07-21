targetScope = 'resourceGroup'

param storageAccountName string
param tableName string
param principalId string

var storageTableDataReaderRoleId = '76199698-9eea-4c19-bc75-cec21354c6b6'

resource accessCodesTable 'Microsoft.Storage/storageAccounts/tableServices/tables@2025-01-01' existing = {
  name: '${storageAccountName}/default/${tableName}'
}

resource tableReaderRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(accessCodesTable.id, principalId, storageTableDataReaderRoleId)
  scope: accessCodesTable
  properties: {
    principalId: principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', storageTableDataReaderRoleId)
  }
}
