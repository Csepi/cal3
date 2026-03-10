# Azure Deployment: SWA Frontend + Container Apps Backend

This setup keeps local Docker/Portainer untouched and adds Azure production deployment using environment variables only.

## Architecture

- Frontend: Azure Static Web Apps
  - `app.primecal.eu`
- Backend: Azure Container Apps
  - `api.primecal.eu`
- Database: Azure Database for PostgreSQL

## Why this matches the codebase

- Frontend resolves API endpoint from runtime config (`API_URL` / `BACKEND_URL`) before local port fallbacks.
- Backend already supports env-based host/port/database/CORS config.
- Docker and Portainer paths remain unchanged because no compose behavior was removed.

## Backend deployment from Azure Bash

1. Copy the env template and fill values:
```bash
cp docker/.env.azure.backend.example docker/.env.azure.backend
```

2. Run deployment/update script:
```bash
bash scripts/azure/update-backend-containerapp.sh --env-file docker/.env.azure.backend
```

What it does:
- Builds and pushes backend image to ACR.
- Updates Container App image + env variables.
- Stores `DB_PASSWORD` and `JWT_SECRET` as Container App secrets.
- Ensures external ingress on backend port.

## Frontend deployment (SWA)

Use the GitHub workflow `Deploy Azure Frontend (Static Web App)` and set repository variables:

- `CAL3_FRONTEND_URL` = `https://app.primecal.eu`
- `CAL3_BACKEND_URL` = `https://api.primecal.eu`
- `CAL3_FRONTEND_PORT` = `443`
- `CAL3_BACKEND_PORT` = `443`

And secret:

- `AZURE_STATIC_WEB_APPS_API_TOKEN_PRIMECAL_FRONTEND`

This ensures frontend build embeds the correct runtime config for Azure.

## Recommended backend env values on Azure

These match your requested configuration pattern:

```env
BACKEND_PORT=8081
PORT=8081
FRONTEND_HOST_PORT=443
BACKEND_HOST_PORT=443
DB_HOST=primecal-db-new.postgres.database.azure.com
DB_PORT=5432
DB_USERNAME=adminuser
DB_PASSWORD=... (secret)
DB_NAME=cal3
DB_SSL=false
DB_SSL_REJECT_UNAUTHORIZED=false
JWT_SECRET=... (secret)
BASE_URL=https://api.primecal.eu
FRONTEND_URL=https://app.primecal.eu
BACKEND_URL=https://api.primecal.eu
API_URL=https://api.primecal.eu
DB_CONNECTION_TIMEOUT=60000
DB_IDLE_TIMEOUT=60000
WAIT_FOR_DB=true
WAIT_FOR_DB_MAX_ATTEMPTS=60
WAIT_FOR_DB_INTERVAL=2
SECURITY_ALLOWED_ORIGINS=https://app.primecal.eu
```

## Azure account changes required

1. Container Apps and ACR
- Ensure an Azure Container Apps Environment exists.
- Ensure backend Container App exists.
- Ensure ACR exists and Container App can pull images from it.

2. DNS and TLS
- Map `api.primecal.eu` to backend Container App ingress.
- Map `app.primecal.eu` to Static Web App.
- Bind managed certificates for both custom domains.

3. GitHub integrations
- Add repository secret `AZURE_CREDENTIALS` (service principal for `az login`).
- Add secret `AZURE_STATIC_WEB_APPS_API_TOKEN_PRIMECAL_FRONTEND`.
- Add repository variables listed above for workflow/runtime.
- Add backend deployment variables:
  - `AZ_RESOURCE_GROUP`
  - `AZ_CONTAINERAPP_NAME`
  - `AZ_ACR_NAME`
  - `CAL3_DB_HOST`
  - `CAL3_DB_PORT`
  - `CAL3_DB_USERNAME`
  - `CAL3_DB_NAME`
  - `CAL3_DB_SSL`
  - `CAL3_DB_SSL_REJECT_UNAUTHORIZED`
  - `CAL3_FRONTEND_URL`
  - `CAL3_BACKEND_URL`

4. GitHub backend secrets
- `CAL3_DB_PASSWORD`
- `CAL3_JWT_SECRET`

## Local and Portainer compatibility

No local Docker compose workflow was removed or changed.

- Local dev: still uses existing `BACKEND_HOST_PORT` / `FRONTEND_HOST_PORT`.
- Portainer stack: still uses `docker-compose.yml` as before.
- Azure path: isolated through new script/workflow/env template.
