# Testing Strategy

Use the cheapest layer that can answer the question you are asking.

`npm test` (`npm run test:all`) is a broader local regression command that runs unit, frontend component integration, backend integration, and web E2E. It is intentionally not the fast pre-commit loop, and it intentionally leaves backend e2e out to keep local defaults practical.

## Local Gates

- `npm run test:precommit`: lint + typecheck + backend/frontend unit tests.
- `npm run test:prepush`: `test:precommit` + frontend component integration + backend integration tests.
- Heavy lanes (`test:e2e`, `test:security`, `test:load`) should be run when touching trust boundaries, UX journeys, or performance-sensitive behavior.

## Layers

| Layer | Current npm commands | Suite location | Guidance |
| --- | --- | --- | --- |
| Unit | `npm run test:unit`, `npm --prefix backend-nestjs run test:unit`, `npm --prefix frontend run test:unit` | `backend-nestjs/src/**/*.spec.ts`, `frontend/src/__tests__/**/*.test.ts(x)` | Fast. Run on every edit and before every push. |
| Frontend Component Integration | `npm run test:frontend:integration`, `npm --prefix frontend run test:integration` | `frontend/src/__tests__/**/*.integration.test.ts(x)` | Medium. Higher-level component workflows (calendar/group, booking, task composition) with mocked API seams. |
| Backend Integration | `npm run test:integration`, `npm --prefix backend-nestjs run test:integration` | `backend-nestjs/test/integration/*.integration-spec.ts` | Medium. Real persistence and module boundaries (auth, booking, notifications, sync, agents, automation, tenant isolation). |
| Backend E2E | `npm run ci:backend-e2e`, `npm --prefix backend-nestjs run test:e2e` | `backend-nestjs/test/*.e2e-spec.ts` | Medium to heavy. Full HTTP app behavior beyond service-level integration coverage. |
| UI E2E | `npm run test:e2e:web`, `npm run test:e2e:mobile`, `npm run test:e2e:mobile:native`, `npm run test:e2e` | `e2e/web/*.spec.ts`, `e2e/mobile/run-mobile-e2e.mjs` | Heavy. `test:e2e:mobile` runs Playwright mobile emulation; `test:e2e:mobile:native` runs the Appium harness. |
| Security | `npm --prefix backend-nestjs run test:security`, `npm run test:security:web`, `npm run test:security` | `backend-nestjs/test/security/*.security-spec.ts`, `tests/security/run-zap-scan.mjs` | Medium to heavy. Run for auth/input/csrf/webhook/trust-boundary changes. |
| Load | `npm run test:load`, `npm run test:load:k6` | `tests/load/artillery-smoke.yml`, `tests/load/k6-smoke.js` | Heavy. Smoke in PR lanes, deeper profiles in scheduled/manual runs. |
| i18n | `npm run i18n:validate`, `npm run i18n:test`, `npm run i18n:expand`, `npm run i18n:extract`, `npm run i18n:export` | `tests/i18n.validation.test.ts`, `tests/translation-quality.test.ts`, `e2e/web/language-switching.spec.ts`, `e2e/web/mobile-i18n-journey.spec.ts` | Fast for key validation/extraction; heavier only for locale user-journey checks. |

## CI Coverage Today

Current CI lanes map to these commands:

- `npm run ci:quality`
- `npm run ci:i18n`
- `npm run ci:backend-core`
- `npm run ci:backend-integration`
- `npm run ci:backend-e2e`
- `npm run ci:frontend-unit`
- `npm run ci:frontend-integration`
- `npm run ci:web-e2e`
- `npm run ci:mobile-e2e`
- `npm run ci:api`
- `npm run ci:load`
- `npm run ci:zap`
- `npm run ci:load:deep` (optional schedule/manual)
- `npm run ci:zap:deep` (optional schedule/manual)

PR and `push` to `main` cover quality, i18n, backend core/integration/e2e/security, frontend unit/component-integration, web e2e, mobile e2e, API collection tests, load smoke, and ZAP smoke.

## Trigger Notes

- `npm --prefix backend-nestjs run test` stays fast/local (no backend e2e by default).
- Backend API e2e is wired through `npm run ci:backend-e2e` in PR/main CI.
- Mobile Playwright e2e runs on PR/main and optionally on workflow dispatch (`run_mobile_e2e=true`).
- Deeper load/ZAP lanes run on schedule or workflow dispatch (`run_deeper_security_load=true`) so they do not slow normal PR feedback.

## PR vs Heavier Jobs

- Fast local gate: `npm run test:precommit`
- Default pre-push gate: `npm run test:prepush`
- PR/main CI lanes: `ci:quality`, `ci:i18n`, `ci:backend-core`, `ci:backend-integration`, `ci:backend-e2e`, `ci:frontend-unit`, `ci:frontend-integration`, `ci:web-e2e`, `ci:mobile-e2e`, `ci:api`, `ci:load`, `ci:zap`
- Heavier scheduled/manual lanes: `ci:load:deep`, `ci:zap:deep`, plus workflow-dispatch Azure smoke checks
