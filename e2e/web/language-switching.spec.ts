import { expect, test } from '@playwright/test';
import { installDefaultApiMocks, seedAuthenticatedSession } from './helpers/mockApi';

test.describe('language switching', () => {
  test('updates the document language and persists the new preference', async ({ page }) => {
    await seedAuthenticatedSession(page);
    await installDefaultApiMocks(page, { startAuthenticated: true });

    await page.goto('/app');

    const profileMenuButton = page.getByRole('button', { name: /Open profile menu/i });
    await expect(profileMenuButton).toBeVisible();
    await profileMenuButton.click();

    const languageSwitcher = page.locator('[role="menu"] select');
    await expect(languageSwitcher).toHaveValue('en');

    await languageSwitcher.selectOption('de');
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expect(languageSwitcher).toHaveValue('de');
    await expect.poll(async () =>
      page.evaluate(() => localStorage.getItem('primecal.profile.language')),
    ).toBe('de');

    await languageSwitcher.selectOption('fr');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(languageSwitcher).toHaveValue('fr');
    await expect.poll(async () =>
      page.evaluate(() => localStorage.getItem('primecal.profile.language')),
    ).toBe('fr');
  });
});
