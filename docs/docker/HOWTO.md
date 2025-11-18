# Docker Setup Guide

## 1. Prerequisites
- Docker Engine 24+ (or Docker Desktop for Windows/macOS).
- Node.js 20+ (for running local scripts, `npm run docker:*`).
- Optional: Portainer CE instance with Git access if deploying via stacks.
- Access to the required secrets (DB credentials, JWT secret, OAuth keys) stored outside Git.

## 2. Environment Preparation
1. Copy `docker/.env.example` to `docker/.env.local`.
2. Populate required variables (`BASE_URL`, `FRONTEND/BACKEND_PORT`, `DB_*`, `JWT_SECRET`, OAuth callbacks).
3. Run `npm run docker:check-env` to validate the file. The script fails if any critical values are missing or empty.
4. For Portainer deployments, either upload `docker/.env.portainer` manually or define each variable via the Portainer stack UI/secrets store.

## 3. Local Development Workflow
```bash
# Validate env + lint + test backend
npm run docker:precheck

# Build images
npm run docker:build

# Start stack (local profile, includes Postgres)
npm run docker:up

# Tail logs
npm run docker:logs
```
- Stop the stack with `docker compose -f docker/compose.yaml --profile local down`.
- Reset the database: `docker volume rm cal3_postgres-data`.
- Switch profiles: `docker compose --profile portainer up` runs only frontend/backend services pointing at an external DB.

## 4. Portainer Deployment (Git Stack)
1. In Portainer, create a new stack -> *From git repository*.
2. Repository URL: `https://github.com/Csepi/cal3.git` (or your fork). Reference branch/tag as needed.
3. Compose path: `docker/compose.portainer.yml`.
4. Add environment variables via the Portainer UI (matching `docker/.env.example`) or mount secrets:
   - `BACKEND_HOST_PORT`, `FRONTEND_HOST_PORT`, `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `BASE_URL`, `FRONTEND_URL`, `BACKEND_URL`, OAuth credentials.
5. Enable *Auto update* or use the stack's *Pull and redeploy* button to resync with Git.
6. For GitHub-hosted builds, prebuild/push images to a registry and update `compose.portainer.yml` to reference them.

## 5. Database Scenarios
- **Bundled Postgres (local profile):** default `db` service uses `postgres:15-alpine`, data stored in volume `postgres-data`. Healthcheck ensures backend waits until DB is ready.
- **External Postgres (Portainer or Azure):**
  - Set `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL=true`, `DB_SSL_REJECT_UNAUTHORIZED=false` (if using self-signed certs).
  - Run `docker compose --profile portainer up` locally to mimic the no-DB mode, or remove/comment the `db` service in `compose.portainer.yml`.
  - Keep `DB_SYNCHRONIZE=false`; run TypeORM migrations via `docker compose exec backend npm run typeorm:migration:run` if scripts are available.

## 6. Data Persistence & Backups
- Local volume names:
  - `postgres-data`: PostgreSQL data directory.
  - `backend-logs`: optional log directory for file-based persistence.
- To backup: `docker run --rm -v cal3_postgres-data:/var/lib/postgresql/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tgz /var/lib/postgresql/data`.
- For Portainer, use its volume backup/export feature or connect to Azure managed backups.

## 7. Security Best Practices
- Keep `.env.local` / `.env.portainer` out of Git (already ensured via `.gitignore`).
- Rotate JWT and DB credentials periodically; update secrets in Portainer and redeploy.
- Terminate TLS at a reverse proxy/load balancer; set `BASE_URL`, `FRONTEND_URL`, `BACKEND_URL` to HTTPS endpoints.
- Enable `LOG_JSON=true` when shipping logs to centralized collectors.
- Use Portainer secrets for passwords/tokens instead of embedding them in compose files.

## 8. Quick Reference Commands
| Task | Command |
| --- | --- |
| Build local stack | `npm run docker:build` |
| Start local stack | `npm run docker:up` |
| Tail backend logs | `docker compose -f docker/compose.yaml logs backend -f` |
| Exec shell in backend | `docker compose -f docker/compose.yaml exec backend sh` |
| Health check backend | `curl -f http://localhost:8081/healthz` |
| Portainer redeploy | Use UI -> *Pull and redeploy* |
| Portainer redeploy | Use UI -> *Pull and redeploy* |
| Portainer redeploy | Use UI → *Pull and redeploy* |

Consult `docs/docker/TROUBLESHOOTING.md` and `docs/docker/PORTAINER_DEBUG.md` for detailed debugging steps.




