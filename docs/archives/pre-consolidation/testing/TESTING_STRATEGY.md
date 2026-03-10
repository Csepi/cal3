# CAL3 Testing Strategy

## Goals

- Prevent runtime regressions across backend, frontend, and mobile clients.
- Enforce security behavior (authn/authz, injection resilience, CSRF, rate limiting).
- Keep tenant isolation and token hardening verifiable in CI.
- Gate production changes on deterministic automated checks.

## Test Pyramid

1. Unit tests
- Backend: Jest service-level specs with mocked dependencies and branch coverage thresholds (80% global).
- Frontend: Jest + jsdom tests for service and utility layers (`csrf`, `authErrorHandler`, `offlineTimelineCache`, `htmlSecurity`).

2. Integration tests
- Backend integration uses Nest testing module + `supertest` + PostgreSQL testcontainers.
- Covered flows:
  - Register/login/refresh/logout token lifecycle.
  - Multi-tenant access isolation.
  - Concurrent refresh replay handling.

3. E2E tests
- Web: Playwright tests under `/e2e/web` with API-level network mocking for deterministic UI journeys.
- Mobile: Appium harness under `/e2e/mobile` (executes when Android/Appium env vars are provided).

4. API, load, and security automation
- API: Postman/Newman collection in `tests/api`.
- Load: Artillery + k6 smoke scenarios in `tests/load`.
- Security: OWASP ZAP baseline automation + payload dictionaries in `tests/security`.

## Repository Layout

- `backend-nestjs/test/`
  - `integration/*.integration-spec.ts`
  - `security/*.security-spec.ts`
  - `support/postgres-nest.harness.ts`
  - `jest-integration.json`, `jest-security.json`
- `frontend/src/__tests__/`
  - `htmlSecurity.test.ts`
  - `csrf.test.ts`
  - `offlineTimelineCache.test.ts`
  - `authErrorHandler.test.ts`
- `/e2e/`
  - `playwright.config.ts`
  - `web/*.spec.ts`
  - `mobile/run-mobile-e2e.mjs`
- `/tests/`
  - `unit/`, `integration/`, `e2e/`, `security/`, `load/`, `fixtures/`, `api/`

## Execution Commands

From repo root:

- `npm run test:unit`
- `npm run test:integration`
- `npm run test:e2e:web`
- `npm run test:e2e:mobile`
- `npm run test:api`
- `npm run test:security`
- `npm run test:load`
- `npm run test:all`
- `npm run test:ci`

Backend-only:

- `npm --prefix backend-nestjs run test:unit`
- `npm --prefix backend-nestjs run test:integration`
- `npm --prefix backend-nestjs run test:security`

Frontend-only:

- `npm --prefix frontend run test:unit`
- `npm --prefix frontend run test:cov`

## CI/CD Enforcement

Workflow: `.github/workflows/ci-tests-security.yml`

Runs on PRs to `main`, pushes to `main`, and manual dispatch:

- Backend unit + backend security.
- Backend integration (testcontainers).
- Frontend unit + coverage artifact.
- Playwright web E2E.
- Newman API suite.
- Artillery load smoke.
- OWASP ZAP baseline scan.

Build fails on test or scan failures.

## GitHub Features Used

- PR and push-triggered workflows.
- Artifact uploads (coverage, Playwright report, Newman/ZAP outputs, backend logs).
- Concurrency controls to prevent stale runs.

## Azure Features Used

- Manual `azure_smoke` workflow job for environment checks.
- Optional Azure login (`azure/login`) with `AZURE_CREDENTIALS`.
- Optional subscription targeting via `vars.AZ_SUBSCRIPTION_ID`.
- Optional production URL health checks via `vars.CAL3_BACKEND_URL` and `vars.CAL3_FRONTEND_URL`.

## Required Secrets/Variables

For full CI + Azure smoke coverage:

- GitHub secrets:
  - `AZURE_CREDENTIALS`
- GitHub variables:
  - `AZ_SUBSCRIPTION_ID`
  - `CAL3_BACKEND_URL`
  - `CAL3_FRONTEND_URL`

## Notes on Determinism

- Integration/security tests gracefully tolerate missing local Docker runtime by reporting explicit skip conditions in test output.
- Web E2E uses route-level API mocking for stable UI assertions independent of backend availability.
- Mobile E2E runner exits cleanly when Appium/app variables are missing.
