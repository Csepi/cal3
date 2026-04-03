# Test Layout

This folder is the index for the repo's layered test strategy. Start with [`../TESTING_STRATEGY.md`](../TESTING_STRATEGY.md) for the run-order and current gaps.

## Where Things Live

- `unit/`: shared unit-test notes. Actual suites live in `backend-nestjs/src/**/*.spec.ts` and `frontend/src/__tests__/**/*.test.ts(x)`.
- `integration/`: backend integration specs in `backend-nestjs/test/integration/*.integration-spec.ts`.
- `e2e/`: repo-level E2E notes. Actual web and mobile suites live in `/e2e/web` and `/e2e/mobile`, and backend API E2E lives in `backend-nestjs/test/*.e2e-spec.ts`.
- `security/`: backend security specs plus OWASP ZAP helpers and payload dictionaries in `tests/security/`.
- `load/`: Artillery and k6 smoke profiles in `tests/load/`.
- `i18n`: validation and translation-quality specs in `tests/i18n.validation.test.ts`, `tests/translation-quality.test.ts`, with browser locale flow in `e2e/web/language-switching.spec.ts`.
- `fixtures/`: deterministic seed fixtures used by tests.
- `api/`: Postman/Newman collection and environment.

## Quick Commands

- Fastest gate before committing: `npm run test:precommit`
- Pre-push gate: `npm run test:prepush`
- Fast loop: `npm run test:unit`
- DB-backed checks: `npm run test:integration`
- Browser/device flows: `npm run test:e2e:web`, `npm run test:e2e:mobile`, `npm run test:e2e`
- Security: `npm run test:security`
- Load: `npm run test:load`, `npm run test:load:k6`
- i18n: `npm run i18n:validate`, `npm run i18n:test`
