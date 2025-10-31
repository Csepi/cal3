# Cal3 Docker Handbook

This handbook consolidates the practical information you need to run Cal3 with
Docker—whether you deploy manually, through Portainer, or via the CI/CD
pipeline.

---

## Document index

- **Deployment Guide** (`DEPLOYMENT_GUIDE.md`)  
  Opinionated walkthrough for first-time installations.
- **Portainer Guide** (`PORTAINER_GUIDE.md`)  
  UI-driven deployment that pulls the compose stack directly from Git.
- **CI/CD Setup** (`CI_CD_SETUP.md`)  
  GitHub Actions, webhook receiver, and automated rollouts.
- **Runtime Configuration** (`RUNTIME_CONFIGURATION.md`)  
  How environment variables map to the new Admin → Runtime Configuration panel.
- **Implementation Summary** (`IMPLEMENTATION_SUMMARY.md`)  
  Architecture overview, file layout, and feature inventory.

---

## Quick start

### Development stack

```bash
# From repository root
cd docker
cp .env.example .env
./scripts/start-dev.sh
```

Services:

- Frontend: http://localhost:8080
- Backend / API docs: http://localhost:8081

### Production stack (manual)

```bash
cp docker/.env.example .env          # Adjust values
openssl rand -base64 32              # Generate JWT_SECRET
docker compose up -d                 # Uses docker/docker-compose.yml
```

### Production stack (Portainer)

1. Install Portainer and add your Docker environment.
2. Create a new stack named `cal3`.
3. Choose **Repository** and point to this Git repository, directory `docker`.
4. Provide a `.env` file in the stack editor or use Portainer's environment UI.
5. Deploy the stack. Refer to `PORTAINER_GUIDE.md` for screenshots and
   troubleshooting.

---

## Directory tour

```
docker/
├── Dockerfile.backend            # NestJS production image
├── Dockerfile.backend.dev        # Hot-reload backend
├── Dockerfile.frontend           # React + Nginx production image
├── Dockerfile.frontend.dev       # Hot-reload frontend
├── docker-compose.yml            # Production stack
├── docker-compose.dev.yml        # Development stack
├── docker-compose.portainer*.yml # Portainer presets
├── .env.example                  # Bootstrap configuration
├── config/                       # Default env templates per scenario
├── scripts/                      # Start, stop, backup, webhook utilities
└── nginx/                        # Container nginx configuration
```

---

## Runtime configuration overview

The most frequently tuned variables now live in the database and can be managed
from **Admin → Runtime Configuration**. Highlights:

| Group            | Keys controlled in the UI                                   |
|------------------|--------------------------------------------------------------|
| OAuth providers  | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `MICROSOFT_*`    |
| Feature flags    | `ENABLE_OAUTH`, `ENABLE_CALENDAR_SYNC`, `ENABLE_AUTOMATION`, `ENABLE_RESERVATIONS`, `ENABLE_AGENT_INTEGRATIONS` |
| Environment tag  | `NODE_ENV` (restart after changing)                          |

The UI also displays read-only Google and Microsoft callback URLs built from
the backend base URL. See `RUNTIME_CONFIGURATION.md` for the full change
workflow and safe/unsafe settings.

Bootstrap-only values (**database host, passwords, JWT_SECRET, SMTP, etc.**)
remain in `.env` or your secret manager and still require a container restart
when changed.

---

## Common Docker tasks

### Inspect container health

```bash
docker compose ps
docker compose logs -f backend
```

### Rebuild after code changes

```bash
docker compose build backend frontend
docker compose up -d backend frontend
```

### Database backup & restore

```bash
# Backup (see scripts/db-backup.sh for automation)
docker compose exec postgres pg_dump -U "$DB_USERNAME" "$DB_NAME" > backup.sql

# Restore
cat backup.sql | docker compose exec -T postgres psql -U "$DB_USERNAME" "$DB_NAME"
```

### Clean up unused resources

```bash
docker image prune -a
docker volume ls
docker volume rm <volume>
```

---

## Maintenance checklist

- [ ] `.env` kept in sync with required secrets (DB, JWT, SMTP).
- [ ] Admin → Runtime Configuration values reviewed after deployments.
- [ ] Automated backups verified (database + configuration table).
- [ ] TLS certificates renewed (if terminating SSL).
- [ ] Monitoring / alerts wired to `docker stats` or external tools.
- [ ] CI/CD pipeline tested on a feature branch.

---

## Troubleshooting essentials

| Symptom | Quick checks |
|---------|--------------|
| Containers crash-looping | `docker compose logs <service>` for stack traces; verify environment variables. |
| Frontend works, backend 502 | Confirm backend container listens on `BACKEND_PORT`; check Nginx proxy logs. |
| OAuth redirect errors | Copy callback URLs from Admin → Runtime Configuration and update provider configuration. |
| Portainer stack fails to deploy | Refresh Git credentials / token, verify `.env` formatting, review Portainer stack logs. |
| CI/CD webhook no-ops | `curl http://localhost:3001/health`, inspect systemd/PM2 logs, confirm GitHub secret. |

---

## Additional resources

- Docker documentation: https://docs.docker.com/
- Compose reference: https://docs.docker.com/compose/compose-file/
- Cal3 project README: `../../README.md`
- API documentation: `../../API_DOCUMENTATION.md`

For questions or regressions, please open an issue with the compose file in use,
the relevant logs, and the steps taken so far.

