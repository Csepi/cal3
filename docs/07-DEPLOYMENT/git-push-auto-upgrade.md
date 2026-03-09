# Git Push Auto-Upgrade (Frontend + Backend)

Last updated: 2026-02-18

This document explains exactly what happens after you change code locally and push to GitHub, and how to make both frontend and backend deploy automatically.

## Current Behavior In This Repository

- Frontend auto-deploy is push-based:
  - Workflow: `.github/workflows/azure-static-web-apps-agreeable-ground-098c86f03.yml`
  - Trigger: push to `main`
  - Target: Azure Static Web App `primecal-app` (`app.primecal.eu`)

- Backend deploy is manual by default:
  - Workflow: `.github/workflows/deploy-azure-backend-containerapp.yml`
  - Trigger: `workflow_dispatch` only
  - Target: Azure Container App `primecal-backend` (`api.primecal.eu`)

## Local To Production Flow

1. Make changes locally.
2. Test locally (`npm run dev` or your Docker flow).
3. Commit and push to `main`:
   - `git add .`
   - `git commit -m "your message"`
   - `git push origin main`
4. GitHub Actions runs:
   - Frontend deploy runs automatically on push.
   - Backend deploy runs only if manually started (unless you enable auto mode below).
5. Verify production:
   - `https://app.primecal.eu`
   - `https://api.primecal.eu/api/health`

## Required GitHub Secrets And Variables

### Frontend (SWA)

- Secret:
  - `AZURE_STATIC_WEB_APPS_API_TOKEN_AGREEABLE_GROUND_098C86F03`

### Backend (Container Apps)

- Secrets:
  - `AZURE_CREDENTIALS`
  - `CAL3_DB_PASSWORD`
  - `CAL3_JWT_SECRET`
- Variables:
  - `AZ_SUBSCRIPTION_ID`
  - `AZ_RESOURCE_GROUP`
  - `AZ_CONTAINERAPP_NAME`
  - `AZ_ACR_NAME`
  - `AZ_ACR_IMAGE_REPO`
  - `CAL3_FRONTEND_URL`
  - `CAL3_BACKEND_URL`
  - `CAL3_DB_HOST`
  - `CAL3_DB_PORT`
  - `CAL3_DB_USERNAME`
  - `CAL3_DB_NAME`
  - `CAL3_DB_SSL`
  - `CAL3_DB_SSL_REJECT_UNAUTHORIZED`

## Enable Full Automatic Backend Deploy On Push

If you want backend upgrades automatically after push (not manual dispatch), change the backend workflow trigger in `.github/workflows/deploy-azure-backend-containerapp.yml`:

```yaml
on:
  push:
    branches:
      - main
    paths:
      - backend-nestjs/**
      - docker/backend/**
      - scripts/azure/**
      - .github/workflows/deploy-azure-backend-containerapp.yml
  workflow_dispatch:
    inputs:
      image_tag:
        description: "Optional image tag override (default: short SHA)"
        required: false
        type: string
```

This keeps manual deploy available, but also auto-deploys backend when backend-related files change.

## Recommended Trigger Strategy

- Frontend-only changes:
  - Auto frontend deploy only.
- Backend-only changes:
  - Auto backend deploy (if trigger above is enabled), else run backend workflow manually.
- Shared changes:
  - Both workflows run.

## How To Run Backend Deploy Manually (Current Default)

In GitHub:
1. Actions
2. Select `Deploy Azure Backend (Container App)`
3. Click `Run workflow`
4. Optional: provide `image_tag`
5. Run

## Troubleshooting

- Frontend still calls old API URL:
  - Hard refresh browser (`Ctrl+F5`) or clear site cache.
  - Check `https://app.primecal.eu/runtime-config.js`.
- Backend deploy workflow fails immediately:
  - Usually missing secret/variable or YAML syntax issue.
- Domain works on FQDN but not custom host:
  - Check DNS + certificate binding on Container Apps.

