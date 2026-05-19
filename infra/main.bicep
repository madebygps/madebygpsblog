targetScope = 'subscription'

@minLength(1)
param environmentName string

@description('Azure region for the Static Web Apps resource. Use westus2, centralus, eastus2, westeurope, or eastasia.')
param location string

var tags = {
  'azd-env-name': environmentName
}

resource resourceGroup 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name: 'rg-${environmentName}'
  location: location
  tags: tags
}

module web './modules/static-web-app.bicep' = {
  name: 'web'
  scope: resourceGroup
  params: {
    environmentName: environmentName
    location: location
    tags: tags
  }
}

output AZURE_RESOURCE_GROUP string = resourceGroup.name
output WEB_URL string = 'https://${web.outputs.defaultHostname}'
