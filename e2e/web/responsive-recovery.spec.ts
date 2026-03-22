import { expect, test } from '@playwright/test';
import {
  installDefaultApiMocks,
  seedAuthenticatedSession,
} from './helpers/mockApi';

test.describe('Responsive + recovery', () => {
  test('mobile viewport keeps navigation accessible', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedAuthenticatedSession(page);
    await installDefaultApiMocks(page, { startAuthenticated: true });

    await page.goto('/app');

    await expect(page.getByText('Loading account...')).toHaveCount(0);
    await expect(page.getByText(/Focus timeline|No event right now/i)).toBeVisible();
  });

  test('login recovers after initial auth error', async ({ page }) => {
    await installDefaultApiMocks(page, { loginFailuresBeforeSuccess: 1 });

    await page.goto('/app');

    await page.getByLabel(/Email address \/ Username/i).fill('e2e_user');
    await page.getByLabel('Password').fill('ValidPass123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page.getByRole('button', { name: /Sign in/i })).toBeVisible();

    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page.getByRole('button', { name: /Open profile menu/i })).toBeVisible();
  });
});
