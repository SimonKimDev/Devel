# devel-frontend

The blog's single-page app: React + TypeScript, built with [Vite](https://vite.dev), styled with [Tailwind CSS](https://tailwindcss.com), tested with [Vitest](https://vitest.dev).

New here? [docs/LEARNING.md](../docs/LEARNING.md) maps which file to open for each kind of change.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` (or `npm start`) | Dev server on http://localhost:3000 with hot reload. |
| `npm test` | Runs the tests once. `npm run test:watch` reruns them on change. |
| `npm run lint` | ESLint. |
| `npm run format` | Formats the code with Prettier (double quotes, 120 columns; see `.prettierrc.json`). `npm run format:check` only reports. |
| `npm run build` | Type-checks, then builds the static site into `dist/`. |
| `npm run preview` | Serves `dist/` locally to check a production build. |

Port 3000 matters: the API's dev CORS config expects it.

## Layout

| Folder | What's in it |
|---|---|
| `src/app/` | Routes: which URL shows which page |
| `src/pages/` | One component per page |
| `src/components/` | Reusable pieces; `layout/` holds the header, footer and page frame |
| `src/hooks/` | Reusable behavior (data loading, theme, document title) |
| `src/services/` | Where data comes from; the only place that will talk to the API |
| `src/lib/` | Pure functions, unit tested |
| `src/types/` | Shared TypeScript types, mirroring the Go API's JSON |
| `src/data/` | Sample posts (Markdown in `posts/`) until the API serves real ones |
| `src/config/` | Site name, author, GitHub link |

## API URL

The app calls `VITE_API_BASE_URL` (for example `http://localhost:18080/api`). Locally, `run-local-dev.sh` in the repo root sets it and starts both the API and this dev server. In CI and Deploy, the `build-frontend` action bakes in the deployed API's URL.

Vite only exposes variables that start with `VITE_`, and their values end up in the public bundle, so never put secrets in them.
