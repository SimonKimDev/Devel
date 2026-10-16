// One-time, run locally by a subscription Owner:
//   az deployment sub create -l westus2 -f infra/bootstrap.bicep
// Creates the resource group and the identity GitHub Actions uses (OIDC, no secrets).
targetScope = 'subscription'

@description('Region for the resource group and CI identity.')
param location string = 'westus2'

@description('Resource group that holds all blog resources.')
param resourceGroupName string = 'rg-devel-blog'

@description('GitHub repository (owner/name) allowed to deploy.')
param githubRepository string = 'SimonKimDev/Devel'

@description('Branch whose pushes may deploy.')
param deployBranch string = 'main'

param tags object = {
  app: 'devel-blog'
  managedBy: 'bicep'
}

resource rg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}

module githubOidc 'modules/github-oidc.bicep' = {
  name: 'github-oidc'
  scope: rg
  params: {
    location: location
    identityName: 'id-devel-github'
    subjects: [
      'repo:${githubRepository}:ref:refs/heads/${deployBranch}'
      'repo:${githubRepository}:pull_request'
    ]
    tags: tags
  }
}

output AZURE_CLIENT_ID string = githubOidc.outputs.clientId
output AZURE_TENANT_ID string = tenant().tenantId
output AZURE_SUBSCRIPTION_ID string = subscription().subscriptionId
output AZURE_RESOURCE_GROUP string = rg.name
