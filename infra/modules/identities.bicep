targetScope = 'resourceGroup'

param location string
param webAppName string
param githubOrganization string
param githubRepository string

resource webAppIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2024-11-30' = {
  name: '${webAppName}-identity'
  location: location
}

resource githubDeploymentIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2024-11-30' = {
  name: '${webAppName}-github-deploy'
  location: location
}

resource githubMainFederatedCredential 'Microsoft.ManagedIdentity/userAssignedIdentities/federatedIdentityCredentials@2024-11-30' = {
  parent: githubDeploymentIdentity
  name: 'github-main'
  properties: {
    audiences: [
      'api://AzureADTokenExchange'
    ]
    issuer: 'https://token.actions.githubusercontent.com'
    subject: 'repo:${githubOrganization}/${githubRepository}:ref:refs/heads/main'
  }
}

output webAppIdentityResourceId string = webAppIdentity.id
output webAppIdentityClientId string = webAppIdentity.properties.clientId
output webAppIdentityPrincipalId string = webAppIdentity.properties.principalId
output githubDeploymentIdentityResourceId string = githubDeploymentIdentity.id
output githubDeploymentClientId string = githubDeploymentIdentity.properties.clientId
output githubDeploymentPrincipalId string = githubDeploymentIdentity.properties.principalId
