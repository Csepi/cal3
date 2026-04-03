Executable end-to-end tests live outside this folder.

## Scope

- Backend API E2E specs live in `backend-nestjs/test/*.e2e-spec.ts`.
- Web Playwright specs live in `e2e/web/*.spec.ts` and use `e2e/playwright.config.ts`.
- Mobile E2E entrypoint lives in `e2e/mobile/run-mobile-e2e.mjs`.

## Commands

- `npm --prefix backend-nestjs run test:e2e`
- `npm run test:e2e:web`
- `npm run test:e2e:mobile`
- `npm run test:e2e`

## When To Use

This is the heavy user-flow layer. Run it after unit and integration tests, or when a change crosses browser, device, or API boundaries.
