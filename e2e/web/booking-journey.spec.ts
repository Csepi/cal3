import { expect, test } from '@playwright/test';
import {
  installDefaultApiMocks,
  seedAuthenticatedSession,
} from './helpers/mockApi';

test.describe('Critical journey: reservations/booking', () => {
  test('authenticated user can open reservations view without runtime errors', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    await seedAuthenticatedSession(page);
    await installDefaultApiMocks(page, { startAuthenticated: true });

    await page.goto('/app/reservations');

    await expect(page.getByText('Loading account...')).toHaveCount(0);
    await expect(page.getByText('Organization Overview')).toBeVisible();

    await page.getByRole('button', { name: /Resource Types/i }).click();
    await expect(page.getByText(/No resource types yet/i)).toBeVisible();

    expect(pageErrors).toHaveLength(0);
  });
});
