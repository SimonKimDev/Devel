param location string
param logAnalyticsName string
param environmentName string
param containerAppName string
param image string
param targetPort int
param cpu string
param memory string
param minReplicas int
param maxReplicas int
param env array = []
param corsAllowedOrigins string[]
param logDailyQuotaGb string
param tags object = {}

resource logs 'Microsoft.OperationalInsights/workspaces@2025-02-01' = {
  name: logAnalyticsName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
    workspaceCapping: {
      dailyQuotaGb: json(logDailyQuotaGb)
    }
  }
}

// Consumption-only environment (no workload profiles): pay per use, scales to zero.
resource environment 'Microsoft.App/managedEnvironments@2025-07-01' = {
  name: environmentName
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logs.properties.customerId
        sharedKey: logs.listKeys().primarySharedKey
      }
    }
  }
}

resource app 'Microsoft.App/containerApps@2025-07-01' = {
  name: containerAppName
  location: location
  tags: tags
  properties: {
    managedEnvironmentId: environment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: targetPort
        transport: 'auto'
        allowInsecure: false
        // CORS handled at the ingress so the API image doesn't need to know the site's origin.
        corsPolicy: {
          allowedOrigins: corsAllowedOrigins
          allowedMethods: [
            'GET'
            'POST'
            'PUT'
            'PATCH'
            'DELETE'
            'OPTIONS'
          ]
          allowedHeaders: [
            '*'
          ]
          allowCredentials: false
          maxAge: 3600
        }
      }
    }
    template: {
      containers: [
        {
          name: 'api'
          image: image
          resources: {
            cpu: json(cpu)
            memory: memory
          }
          env: env
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'http'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
}

output name string = app.name
output url string = 'https://${app.properties.configuration.ingress.fqdn}'
