// Blog hosting: React SPA on Static Web Apps (Free) + Go API on Container Apps (scale-to-zero).
// Deployed by .github/workflows/deploy.yml; safe to re-run (idempotent).
targetScope = 'resourceGroup'

@description('Region for the API, its environment, and logs.')
param location string = resourceGroup().location

@description('Static Web Apps only supports a few regions.')
@allowed([
  'westus2'
  'centralus'
  'eastus2'
  'westeurope'
  'eastasia'
])
param staticWebAppLocation string = 'westus2'

@description('Short name used to derive resource names.')
param appName string = 'devel'

@description('Full API container image reference. Empty uses a public placeholder until the first API build.')
param apiImage string = ''

@description('Port the API container listens on.')
param apiTargetPort int = 18080

param apiCpu string = '0.25'
param apiMemory string = '0.5Gi'

@minValue(0)
param apiMinReplicas int = 0

@minValue(1)
param apiMaxReplicas int = 2

@description('Extra environment variables for the API container: [{ name, value }].')
param apiEnv array = []

@description('Additional browser origins allowed to call the API (e.g. local dev).')
param extraCorsOrigins string[] = []

@description('Optional custom domain for the site (e.g. www.example.com). Requires DNS CNAME to the SWA hostname first.')
param customDomain string = ''

@description('Daily Log Analytics ingestion cap in GB, to keep costs bounded.')
param logDailyQuotaGb string = '0.1'

param tags object = {
  app: 'devel-blog'
  managedBy: 'bicep'
}

var placeholderImage = 'mcr.microsoft.com/k8se/quickstart:latest'
var usePlaceholder = empty(apiImage) || apiImage == placeholderImage

module web 'modules/static-web-app.bicep' = {
  name: 'web'
  params: {
    name: 'swa-${appName}'
    location: staticWebAppLocation
    customDomain: customDomain
    tags: tags
  }
}

var siteOrigins = concat(
  [
    'https://${web.outputs.defaultHostname}'
  ],
  empty(customDomain) ? [] : ['https://${customDomain}'],
  extraCorsOrigins
)

module api 'modules/container-app.bicep' = {
  name: 'api'
  params: {
    location: location
    logAnalyticsName: 'log-${appName}'
    environmentName: 'cae-${appName}'
    containerAppName: 'ca-${appName}-api'
    image: usePlaceholder ? placeholderImage : apiImage
    // The placeholder image listens on 80; real images use apiTargetPort.
    targetPort: usePlaceholder ? 80 : apiTargetPort
    cpu: apiCpu
    memory: apiMemory
    minReplicas: apiMinReplicas
    maxReplicas: apiMaxReplicas
    env: apiEnv
    corsAllowedOrigins: siteOrigins
    logDailyQuotaGb: logDailyQuotaGb
    tags: tags
  }
}

output apiUrl string = api.outputs.url
// Read back by CI so infra-only deploys keep the currently running image.
output apiImage string = usePlaceholder ? '' : apiImage
output containerAppName string = api.outputs.name
output staticWebAppName string = web.outputs.name
output siteUrl string = 'https://${web.outputs.defaultHostname}'
