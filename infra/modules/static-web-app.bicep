param name string
param location string
param customDomain string = ''
param tags object = {}

resource site 'Microsoft.Web/staticSites@2024-11-01' = {
  name: name
  location: location
  tags: tags
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    // Content is uploaded by GitHub Actions with a deployment token, not linked to a repo.
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
  }
}

// Apex domains (example.com) can't be validated by CNAME, so they use a TXT token.
var isApexDomain = length(split(customDomain, '.')) == 2

resource domain 'Microsoft.Web/staticSites/customDomains@2024-11-01' = if (!empty(customDomain)) {
  parent: site
  name: empty(customDomain) ? 'unused' : customDomain
  properties: {
    validationMethod: isApexDomain ? 'dns-txt-token' : 'cname-delegation'
  }
}

output name string = site.name
output defaultHostname string = site.properties.defaultHostname
