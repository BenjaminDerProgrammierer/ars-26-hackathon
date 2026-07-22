targetScope = 'resourceGroup'

param location string
param virtualNetworkName string
param subnetName string
param networkSecurityGroupName string

var tags = {
  managedBy: 'ars-hackathon-infra'
}

module networkSecurityGroup 'br/public:avm/res/network/network-security-group:0.5.3' = {
  name: 'development-environments-network-security-group'
  params: {
    name: networkSecurityGroupName
    location: location
    tags: tags
    securityRules: [
      {
        name: 'AllowSSH'
        properties: {
          priority: 1000
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '22'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
        }
      }
      {
        name: 'AllowHttp'
        properties: {
          priority: 1010
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '80'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
        }
      }
      {
        name: 'AllowCodeServerHttps'
        properties: {
          priority: 1020
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '443'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
        }
      }
      {
        name: 'AllowDevServer'
        properties: {
          priority: 1030
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '8080'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
        }
      }
    ]
  }
}

module virtualNetwork 'br/public:avm/res/network/virtual-network:0.10.0' = {
  name: 'development-environments-virtual-network'
  params: {
    name: virtualNetworkName
    location: location
    tags: tags
    addressPrefixes: [
      '10.10.0.0/16'
    ]
    subnets: [
      {
        name: subnetName
        addressPrefix: '10.10.1.0/24'
        networkSecurityGroupResourceId: networkSecurityGroup.outputs.resourceId
      }
    ]
  }
}

output virtualNetworkResourceId string = virtualNetwork.outputs.resourceId
output networkSecurityGroupResourceId string = networkSecurityGroup.outputs.resourceId
output subnetResourceId string = virtualNetwork.outputs.subnetResourceIds[0]
