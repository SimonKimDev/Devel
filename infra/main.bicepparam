using 'main.bicep'

param appName = 'devel'
param staticWebAppLocation = 'westus2'
param apiTargetPort = 18080
param extraCorsOrigins = [
  'http://localhost:3000'
]
// param customDomain = 'www.example.com'
