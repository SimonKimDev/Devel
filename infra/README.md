# Infrastructure

Hosting for the blog on Azure. Everything here is Bicep and GitHub Actions. Nothing in this folder depends on how the app code is written: ports, image and build details are parameters.

| Piece | Azure resource | Cost |
|---|---|---|
| React SPA (`devel-frontend`) | Static Web Apps, Free (`swa-devel`) | $0 |
| Go API (`blog-engine`) | Container Apps, Consumption, scales to zero (`ca-devel-api`) | ~$0 at low traffic |
| API logs | Log Analytics (`log-devel`, 0.1 GB/day cap) | ~$0 |
| API image | GitHub Container Registry (`ghcr.io/simonkimdev/devel-api`) | $0 |
| CI identity | User-assigned managed identity (`id-devel-github`), GitHub OIDC | $0 |

Everything lives in resource group `rg-devel-blog` (westus2), subscription `SimonKimBlog`.

## Files

- `bootstrap.bicep`: one-time, subscription scope. Creates the resource group and the identity GitHub Actions signs in as (Contributor on the RG only).
- `main.bicep` + `main.bicepparam`: the app hosting. Deployed by `.github/workflows/deploy.yml` on every push to `main`.
- `modules/`: Static Web App, Container App (+ environment + logs), GitHub OIDC identity.
- `web/staticwebapp.config.json`: SPA routing fallback and headers for Static Web Apps.

## Pipelines

- **CI** (`ci.yml`): runs on PRs and pushes to `main`, only for the parts that changed.
  - Frontend: build and test. Tests are non-blocking until the app's test setup is fixed.
  - API: `go vet`, `go test` and a Docker build.
  - Infra: Bicep lint, plus a what-if summary on PRs.
- **Deploy** (`deploy.yml`): runs on push to `main` or manually, in this order:
  1. Pushes the API image to GHCR.
  2. Deploys `main.bicep` with that image.
  3. Builds the SPA against the deployed API URL and uploads it to Static Web Apps.
  
  The Bicep deployment (`devel-main`) is the source of truth. Later jobs read its outputs, and infra-only changes keep the running image.
- **Frontend preview** (`frontend-preview.yml`): PRs touching the frontend get a temporary Static Web Apps URL. The API and sign-in won't work there, because the preview origin isn't allowed by CORS or Entra.

## One-time setup (already done once; repeat only for a new subscription)

```powershell
$sub = '<subscription id>'
az provider register -n Microsoft.App --subscription $sub
az deployment sub create -l westus2 -n devel-bootstrap -f infra/bootstrap.bicep --subscription $sub
```

Copy the outputs into the GitHub repo settings:

- Secrets: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`
- Variable: `AZURE_RESOURCE_GROUP`

After the first Deploy run pushes the API image, open the `devel-api` package settings on GitHub. Set its visibility to **Public**, so Container Apps can pull it without credentials. Then re-run the failed job.

For MSAL sign-in, add the site URL as a SPA redirect URI on the `Devel` app registration.

## Deploying by hand

```powershell
az deployment group create -g rg-devel-blog -n devel-main -f infra/main.bicep -p infra/main.bicepparam -p apiImage=<image>
```

Omit `apiImage` to run the public placeholder image. Always use `-n devel-main`, because the pipelines read that deployment's outputs.

## Custom domain

1. Create a CNAME from the domain to the Static Web App's default hostname.
2. Set `customDomain` in `main.bicepparam` and push.

The domain is added to the API's CORS allow-list automatically. Add `https://<domain>` as a redirect URI on the app registration.
