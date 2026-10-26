# blog-engine

The Go API behind the blog. It uses only the standard library `net/http` router, and its layout follows the CoffeeChat practice project.

## Layout

```
cmd/blog-engine/      entry point: loads config, wires dependencies, runs the server
configs/              dev.yaml and prod.yaml
internal/
  api/
    handlers/         HTTP handlers and JSON helpers
    middleware/       CORS
    routes/           route registration (NewRouter)
  application/        PostService (blog post queries)
  domain/             config types and the blog Post model
  infra/
    config/           YAML config loader and validation
    db/               Postgres connection with Microsoft Entra tokens from Key Vault
```

## Routes

| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | Always on. Returns 200 `ok` if the process is up; doesn't check the database |
| POST | `/api/blogpost` | Database only |
| GET | `/api/blogpost` | Database only |
| GET | `/api/blogpost/{id}` | Database only |
| GET | `/api/blogpost/category/{id}` | Database only |
| POST | `/api/blogpost/update` | Database only |
| POST | `/api/blogpost/delete/{id}` | Database only |

The blog post routes are registered only when `database.enabled` is `true`. Otherwise they return 404.

## Configuration

The app reads `configs/<env>.yaml` relative to its working directory. `APP_ENV=prod` selects `prod.yaml`; anything else selects `dev.yaml`. The container image sets `APP_ENV=prod`.

- Unknown keys fail at startup, so a typo can't silently fall back to a default.
- `server.allowed_origins` turns on in-app CORS. It's empty in prod, because Container Apps ingress applies CORS there.
- `database.enabled` is `false` in both files for now. When it's `true`, the app reads the Postgres host, database name and user from Key Vault and signs in with a Microsoft Entra token:
  - In dev, it uses `DefaultAzureCredential`, such as your `az login` session.
  - In prod, it uses managed identity. Set `AZURE_CLIENT_ID` to pick a user-assigned identity.

## Run and test

From this directory:

```sh
make run     # or: go run ./cmd/blog-engine
make test    # or: go test ./...
make build   # binary in ./bin
```

The server listens on port 18080. `run-local-dev.sh` at the repo root builds it into `bin/`, waits for `/api/health`, and then starts the frontend. Ctrl+C stops both, and if either one exits, the script stops the other.
