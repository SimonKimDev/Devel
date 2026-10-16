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

- `bootstrap.bicep`: one-time, subscription scope. Creates the resource group and the identity GitHub Actions signs in as (Contributor on the RG only, plus a tiny custom role at subscription scope that can only read `Microsoft.Web/locations/*` operation status; without it, deploys that touch the SWA custom domain hang forever).
- `budget.bicep`: one-time, subscription scope. $25/month cost budget that emails at 80% and 100% of actual spend, and when the month is forecast to go over.
- `main.bicep` + `main.bicepparam`: the app hosting. Deployed by `.github/workflows/deploy.yml` on pushes to `main` that change them or `modules/`.
- `modules/`: Static Web App, Container App (+ environment + logs), GitHub OIDC identity.
- `web/staticwebapp.config.json`: SPA routing fallback and headers for Static Web Apps.

## Pipelines

- **CI** (`ci.yml`): runs on PRs and pushes to `main`, only for the parts that changed. Editing a workflow file runs everything that workflow covers. Builds and tests are separate checks, so a test failure is visible on its own.
  - `frontend-build` and `frontend-test`. `frontend-test` fails until the app overhaul fixes the test setup (CRA rejects `setupFilesAfterEnv` in `package.json`). It's informational; don't make it a required check until it passes.
  - `api-build` (`go vet` and a Docker build) and `api-test` (`go test`).
  - `infra`: Bicep lint, plus `infra-what-if`, a what-if summary on PRs.
- **Deploy** (`deploy.yml`): runs on push to `main` or manually, in this order:
  1. Pushes the API image to GHCR.
  2. Deploys `main.bicep` with that image.
  3. Builds the SPA against the deployed API URL and uploads it to Static Web Apps.

  Each step runs only when its part changed. The infra step watches `main.bicep`, `main.bicepparam` and `modules/` only, so edits to this README, `bootstrap.bicep` or `budget.bicep` don't redeploy anything. A change to `deploy.yml` itself runs all three.
  
  The Bicep deployment (`devel-main`) is the source of truth for names and URLs; later jobs read its outputs. Infra-only changes keep the image the Container App is actually running, read from Azure, so a failed or cancelled deploy can't fall back to the placeholder.
- **Frontend preview** (`frontend-preview.yml`): PRs touching the frontend get a temporary Static Web Apps URL. The API and sign-in won't work there, because the preview origin isn't allowed by CORS or Entra.
- **Dependabot** (`.github/dependabot.yml`): once a month, opens one grouped PR that bumps the GitHub Actions used by the workflows and the `build-frontend` action. Dependabot PRs get no Actions secrets, so the jobs that sign in to Azure (infra what-if, frontend preview) are skipped on them. A bad bump to an Azure action shows up in the Deploy run after merge; revert the PR to recover.

## One-time setup (already done once; repeat only for a new subscription)

```powershell
$sub = '<subscription id>'
az provider register -n Microsoft.App --subscription $sub
az deployment sub create -l westus2 -n devel-bootstrap -f infra/bootstrap.bicep --subscription $sub
az deployment sub create -l westus2 -n devel-budget -f infra/budget.bicep --subscription $sub
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

The site is served at `https://simonkimdevel.com`. The domain is registered at Cloudflare, so its DNS lives in Cloudflare and is managed by hand, not in Bicep. `www` redirects to the apex at Cloudflare.

Cloudflare DNS records:

| Type | Name | Content | Proxy |
|---|---|---|---|
| `TXT` | `@` | Validation token from `az staticwebapp hostname show` | n/a |
| `CNAME` | `@` | Static Web App default hostname (`az staticwebapp show --query defaultHostname`) | DNS only |
| `A` | `www` | `192.0.2.1` (placeholder, never reached) | Proxied |

Plus, in Cloudflare:

- A redirect rule from the "Redirect from WWW to root" template (Rules → Redirect Rules): `https://www.*` → `https://${1}`, 301, preserve query string.
- **Always Use HTTPS** turned on (SSL/TLS → Edge Certificates), so `http://www` is upgraded before the redirect rule runs.

Keep the apex records **DNS only**. Azure issues and renews the HTTPS certificate itself, which fails if Cloudflare proxies the traffic. Keep the `TXT` record too: every deploy re-applies the custom domain and may revalidate it.

To change or move the domain:

1. Add it before deploying, otherwise the deploy waits on validation:

   ```powershell
   az staticwebapp hostname set -n swa-devel -g rg-devel-blog --hostname <domain> --validation-method dns-txt-token --no-wait
   az staticwebapp hostname show -n swa-devel -g rg-devel-blog --hostname <domain> --query validationToken
   ```

   Use `--validation-method cname-delegation` and a `CNAME` record instead for a subdomain such as `blog.example.com`.
2. Create the DNS records above and wait for `az staticwebapp hostname show ... --query status` to report `Ready`.
3. Set `customDomain` in `main.bicepparam` and push. The domain is added to the API's CORS allow-list automatically.
4. Add `https://<domain>` as a SPA redirect URI on the `Devel` app registration, for sign-in.
