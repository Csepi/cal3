# Docker Troubleshooting Guide

## 1. Inspecting Containers
- Tail logs during startup:
  ```bash
  docker compose -f docker/compose.yaml --profile local logs backend -f
  docker compose -f docker/compose.yaml --profile local logs frontend -f
  ```
- Open a shell for deeper inspection:
  ```bash
  docker compose -f docker/compose.yaml --profile local exec backend sh
  docker compose -f docker/compose.yaml --profile local exec db sh
  ```
  Inside the backend container you can run `npm run typeorm:migration:run` (if configured) or `npx typeorm migration:run` after setting `DB_*` env vars to confirm schema parity.

## 2. Database Connectivity
- Test whether PostgreSQL is reachable from the host:
  ```bash
  pg_isready -h 127.0.0.1 -p ${DB_HOST_PORT:-5432} -d cal3 -U cal3_admin
  ```
- From inside the backend container:
  ```bash
  docker compose exec backend sh -c "PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USERNAME -d $DB_NAME -c 'SELECT 1'"
  ```
- Common failure modes:
  - Wrong `DB_HOST`/`DB_PORT`: ensure the backend uses the Docker service name `db` when talking to the bundled container.
  - SSL flags: set `DB_SSL=true` and `DB_SSL_REJECT_UNAUTHORIZED=false` when pointing to Azure PostgreSQL with self-signed certificates.

## 3. Health Checks & HTTP Verification
- Backend exposes `/api/healthz` (in addition to `/api/health`). Validate via:
  ```bash
  curl -f http://localhost:${BACKEND_HOST_PORT:-8081}/api/healthz
  ```
- Frontend serves `http://localhost:${FRONTEND_HOST_PORT:-8080}/healthz`. If the curl command fails, run `docker compose logs frontend` and ensure the runtime config file exists.
- The compose files already contain `healthcheck` definitions so `depends_on` waits for the DB before starting the backend, and for the backend before the frontend. If containers keep restarting, inspect `docker inspect <container> --format '{{json .State}}'`.

## 4. Authentication / Configuration Issues
- CORS failures usually mean `BASE_URL`, `FRONTEND_URL`, or `SECURITY_ALLOWED_ORIGINS` are misconfigured. Update `docker/.env.local` and rerun `npm run docker:precheck`.
- JWT signature errors occur when `JWT_SECRET` differs between backend container and clients. Rotate the secret and restart the stack; invalidate existing tokens.
- If runtime config shows the wrong API URL, delete `frontend/public/runtime-config.js` and let `scripts/sync-app-config.cjs` regenerate it during the Docker build.

## 5. General Tips
- When debugging builds, use plain progress for verbose logs:
  ```bash
  DOCKER_BUILDKIT=1 docker compose -f docker/compose.yaml build backend --progress=plain
  ```
- To reset the local DB, stop the stack and remove the volume:
  ```bash
  docker compose -f docker/compose.yaml --profile local down
  docker volume rm cal3_postgres-data
  ```
- Keep `docker/.env.local` in sync with production values and run `npm run docker:check-env` whenever you change secrets to catch typos early.
