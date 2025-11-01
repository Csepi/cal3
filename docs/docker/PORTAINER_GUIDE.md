
## Portainer Stack Deployment (Git-backed)

This guide walks through deploying the Cal3 stack with Portainer using the
Git repository as the source of truth. Following these steps keeps your Docker
configuration in sync with the codebase and unlocks click-to-update workflows.

---

### 1. Prerequisites

- Docker Engine ≥ 24 on the target host.
- Portainer CE or Business Edition with access to the Docker environment.
- Outbound network access to reach your Git provider.
- A personal access token if the repository is private.

Double-check Docker connectivity first:

```bash
docker ps
```

If the command returns an empty list, Docker is running. Address any errors
before continuing.

---

### 2. Add the Git repository

1. Sign in to Portainer and open **Stacks → Add stack → Web editor**.
2. Switch to the **Repository** tab.
3. Fill in the form:
   - **Name**: `cal3`
   - **Repository URL**: `https://github.com/<org-or-user>/cal3.git`
   - **Repository reference**: branch or tag to deploy (e.g. `main`).
   - **Compose path**: `docker/docker-compose.portainer-local.yml` (or an
     alternative compose file from the `docker/` directory).
   - **Repository authentication**: enable and supply credentials or token if
     the repository is private.
4. Optionally enable **Automatic updates** so Portainer polls for changes.

Portainer displays the latest commit hash once the connection succeeds.

---

### 3. Seed environment variables

Click **Advanced mode → Environment variables**. Copy the contents of
`docker/.env.example` and configure the required values:

| Variable                    | Purpose                                                          |
|-----------------------------|------------------------------------------------------------------|
| `DB_USERNAME` / `DB_PASSWORD` | Database credentials (PostgreSQL)                               |
| `DB_NAME`                   | Database name                                                    |
| `JWT_SECRET`                | 32+ character signing key                                        |
| `BASE_URL`                  | Public base URL (e.g. `https://app.foo`)                         |
| `FRONTEND_PORT` *(optional)*| Published HTTP port for the React UI (defaults to `8080`)        |
| `BACKEND_PORT` *(optional)* | Published HTTP port for the NestJS API (defaults to `8081`)      |
| `DB_PORT` *(optional)*      | Published TCP port for PostgreSQL (defaults to `5433`)           |
| Optional OAuth keys         | Google / Microsoft client credentials (hand over via Admin UI)   |

Leave values blank for settings you intend to manage through the Admin UI.
They will fall back to the database-managed configuration described in
`RUNTIME_CONFIGURATION.md`.

---

### 4. Deploy the stack

1. Review the parsed compose file in the preview panel.
2. Click **Deploy the stack**.
3. Watch the **Stack status** page until all services report **Running**.

The compose file provisions three containers by default: PostgreSQL, the NestJS
backend, and the React frontend. Additional variants point to external
databases—choose the compose file that matches your topology.

---

### 5. Verify the deployment

| Checkpoint                  | Command or URL                                  |
|-----------------------------|-------------------------------------------------| 
| Containers running          | `docker ps` on the target host                  |
| Backend health              | `http://<backend-host>:8081/api/health`         |
| Admin panel                 | `http://<frontend-host>:8080/admin`             |
| Runtime configuration panel | **Admin → Runtime Configuration**               |
| OAuth callback preview      | Copy URLs from the runtime configuration panel  |

Use the admin panel to toggle feature flags or paste OAuth secrets. Changes
take effect immediately and are persisted in the Cal3 database.

---

### 6. Roll out updates

Because the stack is Git-backed, updates are single-click:

1. Commit and push your changes to the branch referenced by the stack.
2. In Portainer, open **Stacks → cal3 → Pull and redeploy**.
3. Portainer fetches the new compose definition and recreates the services.

Need to change published ports later?

1. Open **Stacks � cal3 � Editor**.
2. Switch to **Environment variables** and adjust `FRONTEND_PORT`, `BACKEND_PORT`, or `DB_PORT`.
3. Click **Update the stack** � Portainer redeploys the containers with the new port mappings.

For fully automated rollouts enable **Auto update → Webhook** and connect it to
your CI/CD pipeline or Git provider.

---

### 7. Maintenance and troubleshooting

- **Secrets rotation**: update the value in the Admin panel or `.env`, then
  use **Pull and redeploy**.
- **External databases**: swap to `docker-compose.portainer-external-db.yml`
  and supply the remote connection variables (`DB_HOST`, `DB_SSL`, etc.).
- **Logs**: open the stack and click **Containers → Logs**, or use
  `docker logs <container>` on the host.
- **Rollback**: redeploy a previous Git tag or commit reference.

If deployment fails, inspect the stack deployment logs in Portainer. Typical
causes include invalid `.env` formatting, wrong compose path, or missing Git
credentials.

---

### 8. Related references

- `RUNTIME_CONFIGURATION.md` — how to manage runtime settings via the Admin UI.
- `docker/README.md` — general Docker workflow, common commands, and backups.
- `DEPLOYMENT_GUIDE.md` — end-to-end installation outside of Portainer.

Once the stack is healthy, bookmark the admin panel. Most operational tweaks
can now be handled directly inside Cal3 without editing compose files.


