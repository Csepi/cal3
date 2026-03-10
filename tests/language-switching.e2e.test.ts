import { test, expect } from '@playwright/test';

test.describe('language switching', () => {
  test('switcher updates html lang attribute', async ({ page }) => {
    await page.goto('/app');

    const switcher = page.getByLabel(/application language|alkalmazás nyelve|anwendungssprache|langue de l’application/i);
    await expect(switcher).toBeVisible();

    await switcher.selectOption('de');
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');

    await switcher.selectOption('fr');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  });
});

