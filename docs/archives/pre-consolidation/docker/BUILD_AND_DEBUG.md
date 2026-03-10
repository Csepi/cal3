# Docker Build & Debug Checklist

## Pre-build validation
- Run `npm run docker:precheck` to execute `docker:check-env`, backend lint, and backend tests before building images.
- `docker:check-env` reads `docker/.env.local` (or the path passed as the first argument) and fails if required keys (BASE_URL, DB credentials, JWT secret, host ports, etc.) are missing or empty.
- CI/CD: mirror these steps in GitHub Actions before invoking `docker build` to guarantee consistent results.

## Building locally
```bash
# Normal build (local profile)
npm run docker:build

# Build a single service with verbose progress
DOCKER_BUILDKIT=1 docker compose -f docker/compose.yaml \
  --profile local build backend --progress=plain
```

Notes:
- The Dockerfiles already use multi-stage builds; plain progress is helpful when diagnosing dependency installs in the builder stage.
- Pass private-registry tokens via `--build-arg NPM_TOKEN=xxxx` (both backend and frontend Dockerfiles accept this arg and configure npm accordingly).

## Troubleshooting tips
- `docker compose logs backend -f` to stream server output.
- `docker compose exec backend sh` gives an interactive shell for inspecting `/app/dist`, checking environment variables, or probing the database via `psql`.
- If `docker:check-env` fails, edit `docker/.env.local` or provide an alternate file path: `npm run docker:check-env -- docker/.env.portainer`.
