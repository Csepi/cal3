Unit tests are the fast layer.

## Scope

- Backend unit specs live in `backend-nestjs/src/**/*.spec.ts`.
- Frontend unit tests live in `frontend/src/__tests__/**/*.test.ts(x)`.

## Commands

- `npm run test:unit`
- `npm --prefix backend-nestjs run test:unit`
- `npm --prefix frontend run test:unit`
- Optional stricter backend gate: `npm --prefix backend-nestjs run test:unit:strict`

## When To Use

Use this lane for every local edit loop and for change sets that should not need a database, browser, or external service.
