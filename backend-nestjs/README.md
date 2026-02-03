# Cal3 Backend (NestJS)

## Overview
Backend API for authentication, calendar/events, reservations/resources, tasks, notifications, automation, and external calendar sync.

## Main Modules
- `auth`
- `events`, `calendar-sync`
- `organisations`, `resources`, `reservations`, `resource-types`
- `tasks`
- `notifications`
- `automation`
- `admin`
- `common` (guards/pipes/filters/interceptors/services)

## Type System
- Central backend types: `src/types/*`
- Public shared exports: `src/types/shared.ts`

## Run
```bash
npm install
npm run start:dev
```

Default dev port: `8081`

## Quality Checks
```bash
npx tsc --noEmit
npm run lint
npm run build
```

## Documentation
See repository `docs/` folder:
- `docs/BACKEND_GUIDE.md`
- `docs/API_SPEC.md`
- `docs/DATABASE.md`
- `docs/DEPLOYMENT.md`