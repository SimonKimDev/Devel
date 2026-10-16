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

// Some Microsoft.Web operations (e.g. the Static Web Apps custom domain PUT) report progress
// through a subscription-level status endpoint. Without read access there, ARM retries forever
// and the deploy hangs, so grant just that, read-only.
resource operationStatusReader 'Microsoft.Authorization/roleDefinitions@2022-04-01' = {
  name: guid(subscription().id, 'devel-web-operation-status-reader')
  properties: {
    roleName: 'Devel Web operation status reader'
    description: 'Read Microsoft.Web regional operation status, so CI can wait on long-running Web operations.'
    type: 'CustomRole'
    assignableScopes: [
      subscription().id
    ]
    permissions: [
      {
        actions: [
          'Microsoft.Web/locations/*/read'
        ]
        notActions: []
      }
    ]
  }
}

resource operationStatusAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(subscription().id, rg.id, 'id-devel-github', operationStatusReader.id)
  properties: {
    roleDefinitionId: operationStatusReader.id
    principalId: githubOidc.outputs.principalId
    principalType: 'ServicePrincipal'
  }
}

output AZURE_CLIENT_ID string = githubOidc.outputs.clientId
output AZURE_TENANT_ID string = tenant().tenantId
output AZURE_SUBSCRIPTION_ID string = subscription().subscriptionId
output AZURE_RESOURCE_GROUP string = rg.name
