targetScope = 'resourceGroup'

param location string
param webAppName string
param webAppCustomHostname string
param appServicePlanName string

resource existingWebApp 'Microsoft.Web/sites@2024-11-01' existing = {
  name: webAppName
}

resource managedCertificate 'Microsoft.Web/certificates@2024-11-01' = {
  name: '${webAppName}-managed-certificate'
  location: location
  properties: {
    canonicalName: webAppCustomHostname
    hostNames: [
      webAppCustomHostname
    ]
    serverFarmId: resourceId('Microsoft.Web/serverFarms', appServicePlanName)
  }
}

resource webAppCustomHostnameSniBinding 'Microsoft.Web/sites/hostNameBindings@2024-11-01' = {
  parent: existingWebApp
  name: webAppCustomHostname
  properties: {
    customHostNameDnsRecordType: 'CName'
    hostNameType: 'Verified'
    siteName: webAppName
    sslState: 'SniEnabled'
    thumbprint: managedCertificate.properties.thumbprint
  }
}

output certificateName string = managedCertificate.name
output certificateThumbprint string = managedCertificate.properties.thumbprint
