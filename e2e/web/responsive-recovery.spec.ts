import { expect, test } from '@playwright/test';
import {
  installDefaultApiMocks,
  seedAuthenticatedSession,
} from './helpers/mockApi';

test.describe('Responsive + recovery', () => {
  test('mobile viewport keeps navigation accessible', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedAuthenticatedSession(page);
    await installDefaultApiMocks(page);

    await page.goto('/app');

    await expect(page.getByRole('button', { name: 'Calendar' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Profile' })).toBeVisible();
  });

  test('login recovers after initial auth error', async ({ page }) => {
    await installDefaultApiMocks(page, { loginFailuresBeforeSuccess: 1 });

    await page.goto('/app');

    await page.getByLabel('Email or Username').fill('e2e_user');
    await page.getByLabel('Password').fill('ValidPass123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByText('Login Error')).toBeVisible();

    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  });
});
