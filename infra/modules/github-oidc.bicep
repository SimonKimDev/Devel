// User-assigned managed identity trusted by GitHub Actions via federated credentials,
// granted Contributor on this resource group only.
param location string
param identityName string

@description('GitHub OIDC token subjects allowed to sign in as this identity.')
param subjects string[]

param tags object = {}

var contributorRoleId = 'b24988ac-6180-42a0-ab88-20f7382dd24c'

resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2024-11-30' = {
  name: identityName
  location: location
  tags: tags
}

// Federated credentials on one identity can't be written concurrently.
@batchSize(1)
resource federatedCredentials 'Microsoft.ManagedIdentity/userAssignedIdentities/federatedIdentityCredentials@2024-11-30' = [
  for (subject, i) in subjects: {
    parent: identity
    name: 'github-${i}'
    properties: {
      issuer: 'https://token.actions.githubusercontent.com'
      subject: subject
      audiences: [
        'api://AzureADTokenExchange'
      ]
    }
  }
]

resource contributor 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(resourceGroup().id, identity.id, contributorRoleId)
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', contributorRoleId)
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

output clientId string = identity.properties.clientId
output principalId string = identity.properties.principalId
