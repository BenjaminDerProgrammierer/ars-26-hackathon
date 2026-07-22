targetScope = 'resourceGroup'

@description('Azure region for the deployed resources.')
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

@description('GitHub organization trusted to redeploy the web app from Actions.')
param githubOrganization string = 'BenjaminDerProgrammierer'

@description('GitHub repository trusted to redeploy the web app from Actions.')
param githubRepository string = 'ars-26-hackathon'

@description('Name of the Log Analytics workspace for retained web app diagnostics.')
param logAnalyticsWorkspaceName string = 'arselectronicahackathon-web-logs'

@description('Email address that receives web app HTTP 5xx alerts. Leave empty to create the alert without email delivery.')
param alertEmailAddress string = ''

module storage 'modules/storage.bicep' = {
  params: {
    location: location
    storageAccountName: storageAccountName
    accessCodesTableName: accessCodesTableName
  }
}

module identities 'modules/identities.bicep' = {
  params: {
    location: location
    webAppName: webAppName
    githubOrganization: githubOrganization
    githubRepository: githubRepository
  }
}

module logAnalytics 'modules/log-analytics.bicep' = {
  params: {
    location: location
    workspaceName: logAnalyticsWorkspaceName
  }
}

module webApp 'modules/web-app.bicep' = {
  params: {
    location: location
    webAppName: webAppName
    appServicePlanName: appServicePlanName
    appServicePlanSkuName: appServicePlanSkuName
    appServicePlanCapacity: appServicePlanCapacity
    webAppContainerImage: webAppContainerImage
    storageAccountName: storageAccountName
    accessCodesTableName: accessCodesTableName
    webAppIdentityName: '${webAppName}-identity'
    githubDeploymentIdentityName: '${webAppName}-github-deploy'
    logAnalyticsWorkspaceName: logAnalyticsWorkspaceName
    alertEmailAddress: alertEmailAddress
  }
  dependsOn: [
    storage
    identities
    logAnalytics
  ]
}

module webAppTableReaderRole 'modules/table-reader-role.bicep' = {
  name: 'table-reader-${uniqueString(webAppName)}'
  params: {
    storageAccountName: storageAccountName
    tableName: accessCodesTableName
    #disable-next-line what-if-short-circuiting
    principalId: identities.outputs.webAppIdentityPrincipalId
  }
  dependsOn: [
    storage
  ]
}

output storageAccountResourceId string = storage.outputs.storageAccountResourceId
output storageAccountName string = storage.outputs.storageAccountName
output tableName string = storage.outputs.tableName
output tableServiceEndpoint string = storage.outputs.tableServiceEndpoint
output webAppDefaultHostname string = webApp.outputs.defaultHostname
output webAppIdentityClientId string = identities.outputs.webAppIdentityClientId
output webAppIdentityPrincipalId string = identities.outputs.webAppIdentityPrincipalId
output githubDeploymentClientId string = identities.outputs.githubDeploymentClientId
output githubDeploymentPrincipalId string = identities.outputs.githubDeploymentPrincipalId
output tenantId string = tenant().tenantId
output subscriptionId string = subscription().subscriptionId
output logAnalyticsWorkspaceId string = logAnalytics.outputs.resourceId
