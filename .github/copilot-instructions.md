# Copilot instructions for Devel

Devel is the repository for studioindigoblue.com, the blog of Studio Indigoblue (Simon Kim's one-person studio): a React + TypeScript SPA built with Vite (`devel-frontend/`) and a Go API on the standard library `net/http` router (`blog-engine/`). It's hosted on Azure Static Web Apps and Azure Container Apps, defined in Bicep (`infra/`), and deployed by GitHub Actions (`.github/`). The plan of work lives in the repo's issues and milestones.

The owner is learning full-stack development through this project. He's comfortable with C# and backend services, has some Go, and is new to TypeScript, React and the frontend ecosystem. When explaining or suggesting code, say why, and link the docs.

## Conventions

- Frontend: function components and hooks only. Read config from `import.meta.env.VITE_*`, and never put secrets there; they end up in the public bundle. Tests use Vitest and Testing Library, and query by role or text, not by CSS class.
- Backend: layered as `cmd/` → `internal/api` (routes, handlers, middleware) → `internal/application` → `internal/infra`. Handlers stay thin. Errors are wrapped with context. Configuration comes from `configs/<env>.yaml`, and secrets come from the environment or Key Vault, never from the repo.
- Every behavior change comes with tests: `npm test` and `npm run lint` in `devel-frontend/`, `go test ./...` and `go vet ./...` in `blog-engine/`.
- Infra changes go through Bicep. Workflows sign in to Azure with OIDC, never stored credentials.
