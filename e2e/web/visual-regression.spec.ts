import { expect, test } from '@playwright/test';
import {
  installDefaultApiMocks,
  seedAuthenticatedSession,
} from './helpers/mockApi';

const skipVisualInCi = Boolean(process.env.CI);

test.describe('Visual regression', () => {
  test('login screen visual baseline', async ({ page }, testInfo) => {
    test.skip(
      skipVisualInCi,
      'Visual baseline checks are intentionally local-only for CI stability.',
    );
    test.skip(
      testInfo.project.name === 'mobile-chrome',
      'Mobile visual baselines are intentionally excluded from CI for stability.',
    );

    await installDefaultApiMocks(page, { loginFailuresBeforeSuccess: 999 });

    await page.goto('/app');
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }',
    });

    await expect(page).toHaveScreenshot('login-screen.png');
  });

  test('calendar dashboard visual baseline', async ({ page }, testInfo) => {
    test.skip(
      skipVisualInCi,
      'Visual baseline checks are intentionally local-only for CI stability.',
    );
    test.skip(
      testInfo.project.name === 'mobile-chrome',
      'Mobile visual baselines are intentionally excluded from CI for stability.',
    );

    await seedAuthenticatedSession(page);
    await installDefaultApiMocks(page, { startAuthenticated: true });

    await page.goto('/app');
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }',
    });

    await expect(page).toHaveScreenshot('dashboard-calendar.png');
  });
});
