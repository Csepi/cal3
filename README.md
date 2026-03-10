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

## Internationalization

```bash
npm run i18n:extract
npm run i18n:export
npm run i18n:validate
npm run i18n:expand
npm run i18n:test
```

- Extraction report: `reports/i18n/string-inventory.csv`
- Translator export: `reports/i18n/frontend-en-keys.csv`, `reports/i18n/backend-en-keys.csv`

## Documentation

- Quick start: `docs/QUICKSTART.md`
- Docs index: `docs/README.md`
- API reference: `docs/04-API-REFERENCE/README.md`
- Deployment: `docs/07-DEPLOYMENT/README.md`
