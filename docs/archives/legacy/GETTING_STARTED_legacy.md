# Getting Started

## Prerequisites
- Node.js 18+
- npm 9+
- PostgreSQL (or Azure SQL) for full backend features

## Install
```bash
npm install
cd backend-nestjs && npm install
cd ../frontend && npm install
```

## Environment Setup
- Backend env: `backend-nestjs/.env`
- Frontend runtime config is synced from backend env via `scripts/sync-app-config.cjs`

## Run Development
### Backend (port 8081)
```bash
cd backend-nestjs
npm run start:dev
```

### Frontend (port 8080)
```bash
cd frontend
npm run dev -- --port 8080
```

## Useful Script Commands
```bash
# Type checks
cd backend-nestjs && npx tsc --noEmit
cd frontend && npx tsc --noEmit

# Lint
cd backend-nestjs && npm run lint
cd frontend && npm run lint

# Build
cd backend-nestjs && npm run build
cd frontend && npm run build
```

## Script Folder Usage
See `scripts/README.md` for consolidated script command map and migration of root scripts.