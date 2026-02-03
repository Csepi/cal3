# Cal3 Frontend (React + Vite)

## Overview
React UI for calendar, reservations, admin tools, automation UX, and notifications.

## Structure
- `src/components` - feature and shared UI components
- `src/context` - app-wide providers
- `src/hooks` - reusable hooks
- `src/services` - API/domain service layer
- `src/types` - centralized frontend types

## Type System
Use `src/types/index.ts` exports instead of redefining model interfaces in components.

## Run
```bash
npm install
npm run dev -- --port 8080
```

Default dev port: `8080`

## Quality Checks
```bash
npx tsc --noEmit
npm run lint
npm run build
```

## Documentation
See repository `docs/` folder:
- `docs/FRONTEND_GUIDE.md`
- `docs/API_SPEC.md`
- `docs/GETTING_STARTED.md`
- `docs/TROUBLESHOOTING.md`