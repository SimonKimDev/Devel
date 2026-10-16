# devel-frontend

The blog's single-page app: React + TypeScript, built with [Vite](https://vite.dev), tested with [Vitest](https://vitest.dev).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` (or `npm start`) | Dev server on http://localhost:3000 with hot reload. |
| `npm test` | Runs the tests once. `npm run test:watch` reruns them on change. |
| `npm run lint` | ESLint. |
| `npm run build` | Type-checks, then builds the static site into `dist/`. |
| `npm run preview` | Serves `dist/` locally to check a production build. |

Port 3000 matters: the API's dev CORS config and the Entra sign-in redirect URIs expect it.

## API URL

The app calls `VITE_API_BASE_URL` (for example `http://localhost:18080/api`). Locally, `run-local-dev.sh` in the repo root sets it and starts both the API and this dev server. In CI and Deploy, the `build-frontend` action bakes in the deployed API's URL.

Vite only exposes variables that start with `VITE_`, and their values end up in the public bundle, so never put secrets in them.
