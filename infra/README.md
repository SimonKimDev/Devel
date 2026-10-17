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
  - `frontend-build` and `frontend-test`.
  - `api-build` (`go vet` and a Docker build) and `api-test` (`go test`).
  - `infra`: Bicep lint, plus `infra-what-if`, a what-if summary on PRs.
- **Deploy** (`deploy.yml`): runs on push to `main` or manually, in this order:
  1. Pushes the API image to GHCR.
  2. Deploys `main.bicep` with that image.
  3. Builds the SPA against the deployed API URL and uploads it to Static Web Apps.

  It doesn't rerun tests: the `main` ruleset (below) requires CI to pass first. If you bypass it with red checks, that commit deploys anyway.

  Each step runs only when its part changed. The infra step watches `main.bicep`, `main.bicepparam` and `modules/` only, so edits to this README, `bootstrap.bicep` or `budget.bicep` don't redeploy anything. A change to `deploy.yml` itself runs all three.
  
  The Bicep deployment (`devel-main`) is the source of truth for names and URLs; later jobs read its outputs. Infra-only changes keep the image the Container App is actually running, read from Azure, so a failed or cancelled deploy can't fall back to the placeholder.
- **Frontend preview** (`frontend-preview.yml`): PRs touching the frontend get a temporary Static Web Apps URL. Calls to the API won't work there, because the preview origin isn't in the API's CORS list.
- **PR review** (`pr-review.md`): an AI reviewer, written as [GitHub Agentic Workflows](https://github.github.com/gh-aw/). It runs **only when someone with write access comments `/review` on a PR**; reviewing on every push hit Copilot's rate limit. It posts inline comments and a summary, and it's advisory: it never approves or blocks merging.
  - How it works (`shared/pr-review.md`): two reviewers on different models (`claude-reviewer`, `gpt-reviewer`) review the PR independently. A lead agent merges their findings, asks each reviewer to check what only the other found, verifies disputes against the code, and posts the result with a *Review context and counts* table. `Consensus reached: False` or a low reliability score means the round deserves a second look; comment `/review` again.
  - Each review ends with a verdict (*Ready to merge* or *Needs changes*) and two scores, and sets a `pr-review` commit status on the reviewed commit (it doesn't block merging). Ready means no high- or medium-severity findings, both reviewers completed, and reliability of at least 60. Both scores are fixed rubrics: **readiness** is how clean the code is (100, −40 per high, −15 per medium, −3 per low finding); **reliability** is how much to trust the review itself (100, −10 per disputed finding, −5 per kept finding the reviewers rated differently, −20 if the diff couldn't be fully reviewed, capped at 40 if a reviewer was unavailable). A new push has no `pr-review` status until the next `/review`.
  - What it reports is in `.github/agents/pr-reviewer.agent.md` (also available in the repo's Agents tab): findings are judged by real impact, and it skips wording-only nits, threats that need a hostile collaborator or fork, and hypotheticals. The sub-agents' task and output format are in `shared/pr-reviewer-subagent.md`.
  - Models are pinned: the lead's in `pr-review.md`, the reviewers' in the `## agent:` blocks of `shared/pr-review.md`. The reviewers get a read-only tool allow-list (file viewing and GitHub reads only), so they can't post, set the verdict or run commands; only the lead's safe outputs do. In SDK mode GitHub tools are named `github-<tool>`, not `github/<tool>`. The engine runs in Copilot SDK mode (`copilot-sdk: true`) so each model uses its own API; in CLI mode, Responses-only models such as newer GPTs fail as sub-agents of a Claude lead with a 400.
  - The agent always uses the instructions on `main`, not the PR's copy, so a PR can't rewrite its own reviewer. Test reviewer changes with `/review` after merging.
  - Edit the `.md` files, then run `gh aw compile` (needs `gh extension install github/gh-aw`, v0.92.0) to regenerate the `.lock.yml` file GitHub actually runs. CI's `agentic-lock` job recompiles and fails if the committed lock files don't match. Bump the version pinned in `ci.yml` when you upgrade gh-aw.
  - It runs Copilot with the `COPILOT_GITHUB_TOKEN` secret: a fine-grained personal access token with the **Copilot Requests** permission. Each run is three model sessions (the lead and two reviewers) and uses Copilot premium requests. A `429 Too Many Requests` in the `agent` job means the account hit its rate limit; wait and comment `/review` again.
  - Each run shows up as seven checks (`pre_activation`, `activation`, `agent`, `detection`, `safe_outputs`, `set_review_verdict`, `conclusion`). The verdict is written only if threat detection passed and the PR head is still the commit the agent reviewed. If `pr-review` is missing after a run, open its `set_review_verdict` job: it's skipped when the agent never recorded a verdict.- **Dependabot** (`.github/dependabot.yml`):
  - GitHub Actions: once a month, one grouped PR that bumps the Actions used by the workflows and the `build-frontend` action.
  - Frontend (npm) and API (Go): security fixes only, grouped into one PR per app. Routine version bumps are off until the overhaul settles the stack.

  Dependabot PRs get no Actions secrets, so the jobs that sign in to Azure (infra what-if, frontend preview) are skipped on them. A bad bump to an Azure action shows up in the Deploy run after merge; revert the PR to recover.

## Repository protection

The repo is public, which is what makes these free.

- **`Protect main` ruleset** (Settings → Rules). Repo admins can bypass it, so you can still push or merge anything; GitHub just warns you first. Loose on purpose while the site changes fast:
  - Changes reach `main` through a PR. No approval is needed, since it's a solo repo.
  - The CI checks `changes`, `frontend-build`, `frontend-test`, `api-build`, `api-test` and `infra` must pass. The branch doesn't need to be up to date with `main`. Jobs skipped by the path filter count as passed.
  - Force-pushes to `main` and deleting it are blocked.
- **Security** (Settings → Code security): Dependabot alerts and security-update PRs, and secret scanning with push protection.
- **CodeQL** (`codeql.yml`): code scanning for Actions workflows, Go and TypeScript. On PRs and pushes to `main`, each language is scanned only when its own files change, so docs-only changes skip it. A weekly run (and a manual run) scans everything. Default setup is off, because GitHub rejects results from both at once.

If a CI job is renamed, update the ruleset's required checks too, or PRs will wait forever for the old name.
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
