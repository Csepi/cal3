# MCP Agent Integration – Setup Guide

Follow these steps to enable the new MCP agent integration capability.

## 1. Update environment configuration

- **backend-nestjs/.env**
  ```env
  ENABLE_AGENT_INTEGRATIONS=true
  ```
- **frontend/.env** – no change is required, the frontend auto-detects the flag from the backend.

Restart any running processes after editing the environment files.

## 2. Apply database migration

A new migration adds the agent tables (`agent_profiles`, `agent_permissions`, `agent_api_keys`). Run the migration against the target database before starting the API:

```bash
cd backend-nestjs
npx typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts
```

> **Tip:** Adjust the command if you use a different TypeORM CLI wrapper. The important part is running the migration `1732905600000-CreateAgentTables.ts` in the backend project.

## 3. Re-build services

```bash
# Backend
cd backend-nestjs
npm install
npm run build

# Frontend
cd ../frontend
npm install
npm run build
```

## 4. Restart the stack

Start (or restart) the backend and frontend applications as usual. The “Agent settings” feature becomes available once:

- The feature flag is enabled.
- The migration has been applied.
- A user is authenticated in the UI.

You can now continue with the [usage guide](usage.md) to configure agents and generate access tokens.
