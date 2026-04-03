Integration tests cover backend behavior that needs a real database or multi-service setup.

## Scope

- Backend integration specs live in `backend-nestjs/test/integration/*.integration-spec.ts`.
- Test setup lives in `backend-nestjs/test/jest-integration.json` and `backend-nestjs/test/support/`.

## Commands

- `npm run test:integration`
- `npm --prefix backend-nestjs run test:integration`

## When To Use

Use this lane when auth, automation, tenant isolation, concurrency, or other cross-module behavior changes. It is slower than unit tests, but still much cheaper than browser-driven E2E.
