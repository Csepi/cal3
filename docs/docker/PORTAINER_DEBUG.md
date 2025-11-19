# Portainer Deployment Workflow & Debugging

## 1. Create the Stack
1. Portainer → **Stacks → Add stack → From git repository**.
2. Repository URL: your fork of `https://github.com/Csepi/cal3.git`, choose the target branch/tag.
3. Compose path: `docker/compose.portainer.yml`.
4. Supply environment variables via the stack UI/secrets store (no `.env` file is required). Mirror `docker/.env.example` – e.g. `BACKEND_HOST_PORT`, `FRONTEND_HOST_PORT`, `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `BASE_URL`. OAuth credentials are configured inside the Cal3 admin console, not via environment variables.
5. Enable *Auto update* or configure a webhook so pushes to Git trigger redeploys.
6. Deploy the stack and note the stack ID for future webhook usage.

## 2. Redeploy & Monitor
- **Pull and redeploy:** fetches the latest commit from Git and recreates containers.
- **Logs:** Stack → Containers → select service → *Logs* (equivalent to `docker logs <container>`).
- **Console:** use the *Console* tab to run `/bin/sh` inside the container (equivalent to `docker exec -it`).
- **Volumes:** remove `cal3_postgres-data` or `backend-logs` from the Volumes UI when you need a clean slate.
- **Webhooks:** create a webhook under Stack settings and call it from GitHub Actions or other CI after pushing new images/commits.

## 3. Health Verification
- Backend health: `curl -f http://<PUBLIC_HOST>:${BACKEND_HOST_PORT:-8081}/healthz`.
- Frontend health: `curl -f http://<PUBLIC_HOST>:${FRONTEND_HOST_PORT:-8080}/healthz`.
- Database: Portainer automatically runs `pg_isready`; check the stack Events tab if healthchecks fail.
- If healthchecks keep failing, inspect container logs and confirm the environment variables match the desired environment (DB host, JWT secret, etc.).

## 4. Troubleshooting Tips
- **Stack stuck at "Updating":** usually network/authentication issues reaching the Git repo. Verify credentials and connectivity from the Portainer host.
- **Secrets not updating:** after editing env vars/secrets in Portainer, click *Pull and redeploy* so new values flow into containers.
- **Live restore:** enable the *Live restore* option when editing the stack so containers stay up if the Portainer service restarts.
- **Console diagnostics:** run commands like `pg_isready -h $DB_HOST` or `curl http://localhost:8081/healthz` from within the backend container to debug connectivity.

## 5. Alternative Flow: External Registry
If Docker builds are heavy on the Portainer host:
1. Use GitHub Actions (or another CI) to run `npm run docker:precheck`, build images, and push them to a registry such as GHCR.
2. Update `docker/compose.portainer.yml` to reference the tagged images (`ghcr.io/<org>/cal3-backend:<tag>`).
3. Trigger Portainer redeploy via webhook or the UI.
4. Benefit: offloads build/push to CI; trade-off: requires registry credentials and automation.
