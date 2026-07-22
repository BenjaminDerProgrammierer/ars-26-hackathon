targetScope = 'resourceGroup'

@description('Name of the development-environment virtual machine.')
param name string

@description('Azure region for the virtual machine and its network resources.')
@allowed([
  'austriaeast'
])
param location string = 'austriaeast'

@description('Administrator username for SSH and code-server access.')
param adminUsername string

@description('Administrator password for SSH and code-server access.')
@secure()
param adminPassword string

@description('Resource ID of the predeployed development-environment subnet.')
param subnetResourceId string

@description('Shell command executed by the VM Custom Script extension after provisioning.')
@secure()
param provisioningCommand string

@description('Tags applied to the VM and its supporting resources.')
param tags object = {}

module virtualMachine 'br/public:avm/res/compute/virtual-machine:0.22.2' = {
  name: 'virtual-machine-${name}'
  params: {
    name: name
    location: location
    tags: tags
    availabilityZone: -1
    osType: 'Linux'
    vmSize: 'Standard_B2als_v2'
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
      name: '${name}-osdisk'
      createOption: 'FromImage'
      deleteOption: 'Delete'
      diskSizeGB: 64
      caching: 'ReadWrite'
      managedDisk: {
        storageAccountType: 'StandardSSD_LRS'
      }
    }
    extensionCustomScriptConfig: {
      protectedSettings: {
        commandToExecute: provisioningCommand
      }
    }
    nicConfigurations: [
      {
        name: '${name}-nic'
        nicSuffix: '-nic'
        deleteOption: 'Delete'
        enableAcceleratedNetworking: false
        tags: tags
        ipConfigurations: [
          {
            name: 'ipconfig1'
            subnetResourceId: subnetResourceId
            pipConfiguration: {
              name: '${name}-pip'
              publicIpNameSuffix: '-pip'
              publicIPAllocationMethod: 'Static'
              skuName: 'Standard'
              availabilityZones: []
              tags: tags
              dnsSettings: {
                domainNameLabel: name
              }
            }
          }
        ]
      }
    ]
  }
}

output virtualMachineResourceId string = virtualMachine.outputs.resourceId
output networkInterfaceName string = '${name}-nic'
output publicIpAddressName string = '${name}-pip'
