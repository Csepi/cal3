import { expect, test } from '@playwright/test';
import { installDefaultApiMocks } from './helpers/mockApi';

test.describe('Critical journey: login + calendar', () => {
  test('user can sign in and reach dashboard calendar surface', async ({ page }) => {
    await installDefaultApiMocks(page);

    await page.goto('/app');

    await expect(page.getByLabel('Email or Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();

    await page.getByLabel('Email or Username').fill('e2e_user');
    await page.getByLabel('Password').fill('ValidPass123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Calendar' })).toBeVisible();
  });
});
