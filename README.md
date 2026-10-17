# Studio Indigoblue

The website of Studio Indigoblue, a loosely coupled indie software dev team, at https://studioindigoblue.com. It's a blog built from scratch to learn full-stack development. The repository keeps its original name, Devel.

- `devel-frontend/`: React + TypeScript SPA (Vite, Tailwind), hosted on Azure Static Web Apps
- `blog-engine/`: Go API (standard library `net/http`), hosted on Azure Container Apps
- `infra/`: Azure infrastructure (Bicep), plus docs on costs, pipelines and the custom domain
- `.github/`: GitHub Actions for CI, deploys, CodeQL and the AI pull request reviewer

Start with [docs/LEARNING.md](docs/LEARNING.md) to see where each kind of change lives and how to run the site locally.