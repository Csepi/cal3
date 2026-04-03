# Testing Strategy

Use the cheapest layer that can answer the question you are asking.

`npm test` (`npm run test:all`) is a broader local regression command that runs unit, integration, and web E2E. It is not the fast pre-commit loop, and it intentionally leaves backend e2e out to keep the default runtime practical.

## Local Gates

- `npm run test:precommit`: lint + typecheck + backend/frontend unit tests.
- `npm run test:prepush`: `test:precommit` + backend integration tests.
- Use targeted heavy lanes (`test:e2e`, `test:security`, `test:load`) when touching trust boundaries, UI journeys, or performance-sensitive paths.

## Layers

| Layer | Current npm commands | Suite location | Guidance |
| --- | --- | --- | --- |
| Unit | `npm run test:unit`, `npm --prefix backend-nestjs run test:unit`, `npm --prefix frontend run test:unit` | `backend-nestjs/src/**/*.spec.ts`, `frontend/src/__tests__/**/*.test.ts(x)` | Fast. Run on every code edit and before pushing small changes. |
| Integration | `npm run test:integration`, `npm --prefix backend-nestjs run test:integration` | `backend-nestjs/test/integration/*.integration-spec.ts` | Medium. Use when DB, auth, automation, tenant, or cross-service behavior changes. |
| Backend E2E | `npm run ci:backend-e2e`, `npm --prefix backend-nestjs run test:e2e` | `backend-nestjs/test/*.e2e-spec.ts` | Medium to heavy. This sits between integration and browser E2E: broader than service/integration coverage, cheaper than Playwright/mobile journeys. |
| UI E2E | `npm run test:e2e:web`, `npm run test:e2e:mobile`, `npm run test:e2e` | `e2e/web/*.spec.ts`, `e2e/mobile/run-mobile-e2e.mjs` | Heavy. Use for full user-facing flows and before merging UI changes. |
| Security | `npm --prefix backend-nestjs run test:security`, `npm run test:security:web`, `npm run test:security` | `backend-nestjs/test/security/*.security-spec.ts`, `tests/security/run-zap-scan.mjs` | Medium to heavy. Run when touching auth, input handling, CSRF, webhooks, or other trust boundaries. |
| Load | `npm run test:load`, `npm run test:load:k6` | `tests/load/artillery-smoke.yml`, `tests/load/k6-smoke.js` | Heavy. Keep this for smoke checks, release candidates, and performance-sensitive changes. |
| i18n | `npm run i18n:validate`, `npm run i18n:test`, `npm run i18n:expand`, `npm run i18n:extract`, `npm run i18n:export` | `tests/i18n.validation.test.ts`, `tests/translation-quality.test.ts`, `e2e/web/language-switching.spec.ts` | Fast for validation and extraction, heavier only when locale flows or copy changes. |

## CI Coverage Today

Current CI lanes map to these commands:

- `npm run ci:backend-core`
- `npm run ci:backend-integration`
- `npm run ci:backend-e2e`
- `npm run ci:frontend-unit`
- `npm run ci:quality`
- `npm run ci:i18n`
- `npm run ci:web-e2e`
- `npm run ci:api`
- `npm run ci:load`
- `npm run ci:zap`

That means PR and `push` to `main` currently cover quality checks, i18n validation, backend unit, backend security, backend integration, backend e2e, frontend unit tests, web E2E, API collection tests, load smoke, and ZAP smoke. It does not currently run mobile E2E.

## PR vs Heavier Jobs

- Fast local gate: `npm run test:precommit`
- Default pre-push gate: `npm run test:prepush`
- PR and `main` CI: `ci:quality`, `ci:i18n`, `ci:backend-core`, `ci:backend-integration`, `ci:backend-e2e`, `ci:frontend-unit`, `ci:web-e2e`, `ci:api`, `ci:load`, and `ci:zap`
- Heavier or less frequent lanes: `npm run test:e2e:mobile`, `npm run test:load:k6`, and the workflow-dispatch-only Azure smoke job

## Current Gaps

### Backend

- `npm --prefix backend-nestjs run test:e2e` is now wired into PR and `main` CI through `npm run ci:backend-e2e`, but it remains outside `npm test` to keep the local default practical.
- Integration, backend e2e, and security coverage are strong around auth, automation, concurrency, RLS, CSRF, and injection, but there is still room to add more scenario coverage for booking, notifications, sync, and agent-facing edges.

### Frontend

- Frontend has only Jest unit coverage in `frontend/src/__tests__/`; there is no separate package-level browser/component integration lane.
- The current Playwright suite focuses on core flows, responsive recovery, and visual checks, so broader calendar, booking, and task path coverage is still backlog.

### CI

- `npm run test:e2e:mobile` is not wired into CI.
- Browser i18n is now part of `e2e/web/language-switching.spec.ts`, but full mobile locale journey coverage remains backlog.
- Load and security CI are smoke-oriented; if deeper coverage is needed, add scheduled or pre-release runs for `npm run test:load:k6` and broader security validation.
