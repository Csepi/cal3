# CAL3 App Workspace

This repository contains only application code:
- backend API: `backend-nestjs`
- web frontend: `frontend`
- mobile app (Capacitor Android): `frontend/android`
- shared scripts and deployment config

## Build And Start

```bash
npm run build
npm start
```

`npm start` runs both backend and web services.

## Development

```bash
npm run dev
```

This starts backend and frontend in watch mode.

## Docker

```bash
npm run docker:build
npm run docker:up
```

## Documentation

- Quick start: `docs/QUICKSTART.md`
- Docs index: `docs/README.md`
- API reference: `docs/04-API-REFERENCE/README.md`
- Deployment: `docs/07-DEPLOYMENT/README.md`
