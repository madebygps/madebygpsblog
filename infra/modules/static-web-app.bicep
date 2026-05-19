targetScope = 'resourceGroup'

@minLength(1)
param environmentName string

param location string = resourceGroup().location

param tags object = {}

var normalizedEnvironmentName = replace(toLower(environmentName), '_', '-')
var resourceSuffix = take(uniqueString(subscription().id, resourceGroup().id, environmentName), 6)
var staticWebAppName = 'stapp-${take(normalizedEnvironmentName, 40)}-${resourceSuffix}'

resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' = {
  name: staticWebAppName
  location: location
  tags: union(tags, {
    'azd-service-name': 'web'
  })
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    buildProperties: {
      appLocation: '/'
      outputLocation: 'dist'
    }
  }
}

output defaultHostname string = staticWebApp.properties.defaultHostname
