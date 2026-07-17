// A single Linux VM built from the Azure Verified Module for virtual machines.
// The public IP (with a DNS label) is created by the module via pipConfiguration.

@description('VM name, e.g. vcenv-vm-1.')
param name string

@description('Azure region.')
param location string = resourceGroup().location

@description('SSH admin username.')
param adminUsername string

@description('SSH admin password.')
@secure()
param adminPassword string

@description('Resource ID of the subnet to attach the NIC to.')
param subnetResourceId string

@description('Raw cloud-init cloud-config (the module base64-encodes it).')
param customData string

@description('VM size.')
param vmSize string = 'Standard_B2als_v2'

@description('OS disk size in GB.')
param osDiskSizeGB int = 64

@description('Tags applied to every resource that belongs to this VM/environment.')
param tags object = {}

// Clean, predictable label (globally unique within the region). The VM name
// (e.g. vcenv-vm-1) is already lowercase/hyphen-safe for a DNS label.
var dnsLabel = toLower(name)

module vm 'br/public:avm/res/compute/virtual-machine:0.22.2' = {
  name: 'avm-${name}'
  params: {
    name: name
    location: location
    tags: tags
    availabilityZone: -1
    osType: 'Linux'
    vmSize: vmSize
    adminUsername: adminUsername
    adminPassword: adminPassword
    disablePasswordAuthentication: false
    encryptionAtHost: false
    imageReference: {
      publisher: 'Canonical'
      offer: 'ubuntu-24_04-lts'
      sku: 'server'
      version: 'latest'
    }
    osDisk: {
      diskSizeGB: osDiskSizeGB
      caching: 'ReadWrite'
      managedDisk: {
        storageAccountType: 'StandardSSD_LRS'
      }
    }
    customData: customData
    nicConfigurations: [
      {
        nicSuffix: '-nic-01'
        tags: tags
        ipConfigurations: [
          {
            name: 'ipconfig01'
            subnetResourceId: subnetResourceId
            pipConfiguration: {
              publicIpNameSuffix: '-pip-01'
              tags: tags
              dnsSettings: {
                domainNameLabel: dnsLabel
              }
            }
          }
        ]
      }
    ]
  }
}

output name string = name
output dnsLabel string = dnsLabel
