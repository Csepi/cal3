# Dockerization Plan (Cal3)

## Environment & Settings Review
- [ ] Backend (NestJS 11, Node 20+, `npm run build && npm run start:prod`), relies on `backend-nestjs/.env` and TypeORM (PostgreSQL by default, SQLite optional for dev). Needs static `dist/` artifacts plus Prisma-like TypeORM migrations run before serve.
- [ ] Frontend (Vite + React 19) builds static assets via `npm run build` after `scripts/sync-app-config.cjs` injects runtime URLs from backend env. Output served via any static server (Nginx preferred).
- [ ] Existing helper scripts: `scripts/sync-app-config.cjs` and `config/app-env.js` must run in CI/build stages so `frontend/public/runtime-config.js` matches container env; we will provide Docker build args/ENV to feed these.
- [ ] Database: PostgreSQL 14+ recommended. Can point to external Azure instance or optional Compose-managed `postgres` service with persistent volume and health checks.
- [ ] Networking: `BASE_URL`, `FRONTEND_PORT`, `BACKEND_PORT`, new `FRONTEND_HOST_PORT` and `BACKEND_HOST_PORT` govern published ports; SSL flags (`DB_SSL`, `DB_SSL_REJECT_UNAUTHORIZED`) determine driver config.

### Environment Variable Matrix (Docker scope)
| Variable | Purpose / Notes | Default / Example | Targets |
| --- | --- | --- | --- |
| `NODE_ENV` | Controls NestJS mode (`production` inside container). | `production` | backend |
| `BASE_URL` | Canonical app origin; drives URL generation & runtime config sync. | `http://localhost` | backend, frontend build |
| `FRONTEND_PORT` | Internal listening port inside frontend container (Nginx). | `80` | frontend |
| `FRONTEND_HOST_PORT` | Host/Portainer published port for UI (new). | `8080` | compose stack |
| `BACKEND_PORT`/`PORT` | Internal NestJS port (container). | `8081` | backend |
| `BACKEND_HOST_PORT` | Host/Portainer published API port (new). | `8081` | compose stack |
| `FRONTEND_URL`/`BACKEND_URL`/`API_URL` | Optional overrides for runtime-config script if not derivable from `BASE_URL`. | empty (auto) | frontend build, backend |
| `SECURITY_ALLOWED_ORIGINS` | CSV for CORS and websocket handshake. | `http://localhost:8080` | backend |
| `LOG_RETENTION_DAYS_DEFAULT` | Cleanup policy for audit logs. | `30` | backend |
| `DB_TYPE` | `postgres` (default) or `sqlite` for dev. | `postgres` | backend |
| `DB_HOST` | Database hostname/IP or service name (`db`). | `db` | backend |
| `DB_PORT` | Database port (exposed/published). | `5432` | backend |
| `DB_USERNAME` | DB auth user. | `db_admin` | backend |
| `DB_PASSWORD` | DB auth password/secret. | `***` | backend |
| `DB_NAME` | Database to connect to. | `cal3` | backend |
| `DB_SSL` | Enable TLS for managed Postgres. | `false` (local), `true` (Azure) | backend |
| `DB_SSL_REJECT_UNAUTHORIZED` | Whether to enforce CA trust (set `false` for self-signed). | `false` | backend |
| `DB_SYNCHRONIZE` | TypeORM schema sync (keep `false` except for disposable envs). | `false` | backend |
| `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE` | Auth token signing & validation. | secrets per env | backend |
| `RATE_LIMIT_WINDOW_SEC`, `RATE_LIMIT_MAX_REQUESTS` | Throttling knobs. | `60` / `120` | backend |
| `LOGIN_MAX_ATTEMPTS`, `LOGIN_BLOCK_SECONDS` | Brute-force protection. | `5` / `900` | backend |
| `IDEMPOTENCY_DEFAULT_TTL_SEC` | Default TTL for API idempotency keys. | `3600` | backend |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `GOOGLE_CALENDAR_SYNC_CALLBACK_URL` | Managed via runtime configuration stored in the database (set inside Admin → Runtime Configuration). | configured in app | backend |
| `MICROSOFT_TENANT_ID`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_CALLBACK_URL`, `MICROSOFT_CALENDAR_SYNC_CALLBACK_URL` | Managed via runtime configuration stored in the database (set inside Admin → Runtime Configuration). | configured in app | backend |
| `ENABLE_OAUTH`, `ENABLE_CALENDAR_SYNC`, `ENABLE_RESERVATIONS`, `ENABLE_AUTOMATION`, `ENABLE_AGENT_INTEGRATIONS` | Feature flags toggled at runtime. | `true` | backend, docs |
| `GOOGLE_FIREBASE_*`, `WEB_PUSH_*` (if added later) | Reserve placeholders for push/email secrets if added to `.env`. | n/a | backend |
| `PERSIST_DATA_PATH`, `BACKUP_CRON` (optional new) | To be added if backup scripts needed in containers. | tbd | Postgres cron sidecar |

> Action Items: Add missing `FRONTEND_HOST_PORT`, `BACKEND_HOST_PORT`, ensure `.env.example` + `backend-nestjs/.env` include all rows above, and prepare a Docker-specific `.env.docker` for Compose/Portainer.

## Implementation Plan
- [x] Reintroduce `docker/` structure  
  - Directories: `docker/backend`, `docker/frontend`, `docker/postgres`, `docker/templates`.  
  - Files: `.dockerignore` (root), `docker/.env.example`, `docker/compose.yaml`, `docker/compose.portainer.yml`.
- [x] Backend Dockerfile  
  - Multi-stage (`node:20-alpine` builder -> smaller runtime).  
  - Install dependencies with `npm ci --omit=dev`, copy source, build, prune dev deps.  
  - Provide ARGs/ENVs for all listed variables; run `node scripts/sync-app-config.cjs --mode backend` if needed before build (ensures runtime-config).  
  - Expose `BACKEND_PORT`, add `HEALTHCHECK` hitting `/api/healthz` (implement Nest endpoint if missing).  
  - Include wait-for DB script or `CMD ["node","dist/main"]` preceded by small entrypoint that checks DB reachability.
- [x] Frontend Dockerfile  
  - Builder stage `node:20-alpine` to run `npm ci && npm run build`.  
  - Prior to build, run `node ../scripts/sync-app-config.cjs --source docker` with `DOCKER=true` env to emit runtime config matching Compose values.  
  - Runtime stage `nginx:alpine`, copy `dist` to `/usr/share/nginx/html`, inject templated `runtime-config.js` (if needing runtime overrides consider env-substitution via entrypoint).  
  - Provide custom `nginx.conf` enabling SPA routes + reverse proxy fallback? (If backend on different host/port, mostly not needed; rely on API URL).  
  - Healthcheck via `curl -f http://localhost/healthz` (serve static JSON).
- [x] Optional `postgres` service definition  
  - Use `postgres:15-alpine`, `POSTGRES_DB/USER/PASSWORD` tied to env matrix.  
  - Attach persistent volume `postgres-data`, optional init scripts for schema/migrations.  
  - Document how to disable when pointing to Azure.
- [x] Docker Compose v2 spec  
  - Services: `backend`, `frontend`, optional `db`.  
  - Networks: `cal3_net`.  
  - Bindings use `FRONTEND_HOST_PORT:FRONTEND_PORT`, `BACKEND_HOST_PORT:BACKEND_PORT`.  
  - Inject `.env.docker` file or Compose `env_file`.  
  - Add `depends_on` with condition `service_healthy` (db -> backend -> frontend).  
  - Mount `backend/logs` volume if file logs needed; otherwise rely on stdout.  
  - Provide `profiles` (`local`, `portainer`) to switch DB provider.  
  - Compose labels for Portainer stack metadata.
- [x] Automation scripts  
  - Add `npm run docker:build`, `npm run docker:up`, `npm run docker:logs`.  
  - Provide `Makefile` or `scripts/docker-up.ps1` wrappers for Windows devs.
- [x] Security & secrets  
  - Document safe handling of JWT/db secrets via `.env.docker` (ignored by git).  
  - Encourage usage of Portainer env vars/secret store rather than committed files.  
  - Validate HTTP -> HTTPS termination plan (maybe front behind reverse proxy/Load Balancer).  
  - Add `CSP`/`X-Forwarded-*` support by enabling `trust proxy`.

## Debugging & Validation Plan
- [x] Pre-build validation  
  - Run `npm run lint` and backend tests prior to Docker build; add GitHub action or manual step.  
  - Validate `.env.docker` completeness via script (fail if required keys missing).  
- [x] Build-time diagnostics  
  - Use multi-stage builds with `--progress=plain` when debugging.  
  - Add `ARG NPM_TOKEN` if private packages appear (currently not).  
- [x] Runtime health checks  
  - Implement `/api/healthz` route in backend and static `healthz.json` for frontend to allow Compose and Portainer health monitors.  
  - Compose `healthcheck` definitions ensure `depends_on` gating.  
- [x] Troubleshooting workflow  
  - `docker compose logs backend -f`, `docker compose exec backend sh`.  
  - `npm run typeorm:migration:run` (if script exists) inside container to ensure schema.  
  - Use `pg_isready` for db container, `curl`/`wget` for HTTP verification.  
  - Document common failure scenarios (bad DB SSL, wrong BASE_URL -> CORS fail, `JWT_SECRET` mismatch) and commands to inspect (e.g., `docker inspect <container> --format '{{json .Config.Env}}'`).  
- [x] Portainer-specific debugging  
  - Use Portainer console/log viewer; enable `Enable live restore` flag for stack.  
  - Provide section in docs for checking `Git latest commit`, forcing redeploy, clearing volumes.  
- [x] Observability enhancements  
  - Forward Nest logs to stdout JSON for consumption by Portainer/ELK later.  
  - Consider optional Prometheus/Grafana integration (future).

## Documentation Plan
- [x] Create `docs/docker/HOWTO.md` (or `docs/docker/SETUP.md`) covering: prerequisites (Docker, Portainer CE, Git repo access), env var preparation, building images locally, Compose commands, data persistence, security best practices.  
- [x] Include quick-start snippet plus advanced scenarios (local Compose vs Portainer Git stack, connecting to Azure Postgres vs bundled container).  
- [x] Provide `.env.docker.example` annotated comments describing each variable (mirroring matrix).  
- [x] Update root `README.md` with concise Docker section linking to full guide.  
- [x] Add troubleshooting appendix referencing debug plan, plus FAQ for SSL/callback URLs.  
- [x] Document release cadence (tagged images, versioning) and cleanup instructions.

## Portainer Deployment Strategy
- [x] Author `docker/compose.portainer.yml` tailored for Portainer stacks (no bind-mount paths outside workspace, uses named volumes).  
  - Compose file references Git repo context; specify `x-bake` labels if using Portainer build features.  
  - Provide `deploy` block with restart policies, resource limits.  
  - External secrets handled via Portainer environment variables/secrets UI.  
- [x] Document Portainer workflow:  
  1. Create stack → Git repository → set repo URL & reference branch/tag.  
  2. Provide path to `docker/compose.portainer.yml`.  
  3. Supply env vars via Portainer (or `.env` file) matching matrix.  
  4. Trigger webhook or auto-update to redeploy on git push.  
  5. Verify stack health (container logs & healthchecks).  
- [x] Consider alternative: GitHub Actions builds + push to registry, Portainer deploys from registry (if builds heavy). Evaluate cost/benefit before implementation.

> Next step after approval: start implementing Dockerfiles/Compose + supporting docs following checklist above.
