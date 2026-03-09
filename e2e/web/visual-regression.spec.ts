import { expect, test } from '@playwright/test';
import {
  installDefaultApiMocks,
  seedAuthenticatedSession,
} from './helpers/mockApi';

test.describe('Visual regression', () => {
  test('login screen visual baseline', async ({ page }) => {
    await installDefaultApiMocks(page, { loginFailuresBeforeSuccess: 999 });

    await page.goto('/app');
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }',
    });

    await expect(page).toHaveScreenshot('login-screen.png', {
      fullPage: true,
    });
  });

  test('calendar dashboard visual baseline', async ({ page }) => {
    await seedAuthenticatedSession(page);
    await installDefaultApiMocks(page);

    await page.goto('/app');
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }',
    });

    await expect(page).toHaveScreenshot('dashboard-calendar.png', {
      fullPage: true,
    });
  });
});
