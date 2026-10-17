The first version of this blog ran on a two-node AKS cluster. It worked, and it cost about seventy dollars a month to serve a page almost nobody visited.

## Why AKS was overkill

Kubernetes is great when you have many services, teams and scaling needs. I had one container and one static site. I was paying for:

1. Two always-on nodes.
2. Three public IPs left behind by the cluster's load balancer.
3. A container registry for a single image.

## What replaced it

The frontend moved to **Azure Static Web Apps** (free tier, global CDN, free TLS) and the API to **Azure Container Apps**, which scales to zero when nobody is calling it.

```bicep
resource api 'Microsoft.App/containerApps@2024-03-01' = {
  name: 'ca-devel-api'
  properties: {
    template: {
      scale: {
        minReplicas: 0
        maxReplicas: 1
      }
    }
  }
}
```

The image now lives in GitHub Container Registry, which is free for public images.

## The bill

From roughly $70 a month to a few cents. The only thing I miss is `kubectl get pods` making me feel important.

### Lessons

- Start with the smallest thing that can host your code.
- Infra as code made the migration boring, which is the best kind of migration.