# End-to-End Tests

- `web/`: Playwright tests for critical user journeys (login, calendar, tasks, reservations), responsive behavior, and visual regression.
- `mobile/`: Appium-based Android smoke/e2e harness, including an optional selector-driven i18n journey.

Run web tests with:

`npm run test:e2e:web`

Run Playwright mobile-emulation journeys with:

`npm run test:e2e:mobile`

Run native Appium mobile tests with:

`npm run test:e2e:mobile:native`
