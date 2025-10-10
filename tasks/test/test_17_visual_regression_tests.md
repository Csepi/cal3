# Test Task 17: Visual Regression Tests

## Description
Capture and compare screenshots to detect unintended visual changes across all pages, themes, and responsive layouts.

## Prerequisites
- ✅ Completed test_01-16

## Implementation Steps

### `frontend/e2e/visual-regression/calendar-screenshots.spec.ts`
```typescript
import { test, expect } from '@playwright/test';
import { createPages } from '../pages';

test.describe('Calendar Visual Regression', () => {
  test('calendar month view matches baseline', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.calendar.goto();
    await pages.calendar.switchToMonthView();

    // Wait for calendar to fully render
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('calendar-month-view.png', {
      fullPage: true,
      maxDiffPixels: 100, // Allow small differences
    });
  });

  test('calendar week view matches baseline', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.calendar.goto();
    await pages.calendar.switchToWeekView();

    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('calendar-week-view.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('event modal matches baseline', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.calendar.goto();
    await pages.calendar.openCreateEventModal();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toHaveScreenshot('event-modal.png');
  });
});
```

### `frontend/e2e/visual-regression/theme-colors.spec.ts`
```typescript
import { test, expect } from '@playwright/test';
import { createPages } from '../pages';

test.describe('Theme Color Visual Regression', () => {
  const themeColors = [
    { name: 'red', value: '#ef4444' },
    { name: 'orange', value: '#f59e0b' },
    { name: 'yellow', value: '#eab308' },
    { name: 'lime', value: '#84cc16' },
    { name: 'green', value: '#10b981' },
    { name: 'emerald', value: '#22c55e' },
    { name: 'teal', value: '#14b8a6' },
    { name: 'cyan', value: '#06b6d4' },
    { name: 'sky', value: '#0ea5e9' },
    { name: 'blue', value: '#3b82f6' },
    { name: 'indigo', value: '#6366f1' },
    { name: 'violet', value: '#7c3aed' },
    { name: 'purple', value: '#8b5cf6' },
    { name: 'pink', value: '#ec4899' },
    { name: 'rose', value: '#f43f5e' },
    { name: 'slate', value: '#64748b' },
  ];

  for (const theme of themeColors) {
    test(`calendar with ${theme.name} theme matches baseline`, async ({ page }) => {
      const pages = createPages(page);
      await pages.login.loginAsUser();
      await pages.profile.goto();

      await pages.profile.changeTheme(theme.value);
      await pages.calendar.goto();

      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot(`calendar-theme-${theme.name}.png`, {
        fullPage: true,
        maxDiffPixels: 200, // Theme colors may have gradients
      });
    });
  }

  test('profile page with all themes', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.profile.goto();

    for (const theme of themeColors) {
      await pages.profile.changeTheme(theme.value);

      await expect(page).toHaveScreenshot(`profile-theme-${theme.name}.png`, {
        fullPage: true,
        maxDiffPixels: 150,
      });
    }
  });
});
```

### `frontend/e2e/visual-regression/responsive-layouts.spec.ts`
```typescript
import { test, expect, devices } from '@playwright/test';
import { createPages } from '../pages';

test.describe('Responsive Layout Visual Regression', () => {
  test('mobile calendar layout', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
    });
    const page = await context.newPage();
    const pages = createPages(page);

    await pages.login.loginAsUser();
    await pages.calendar.goto();

    await expect(page).toHaveScreenshot('calendar-mobile.png', {
      fullPage: true,
    });

    await context.close();
  });

  test('tablet calendar layout', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPad Pro'],
    });
    const page = await context.newPage();
    const pages = createPages(page);

    await pages.login.loginAsUser();
    await pages.calendar.goto();

    await expect(page).toHaveScreenshot('calendar-tablet.png', {
      fullPage: true,
    });

    await context.close();
  });

  test('desktop calendar layout', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.calendar.goto();

    await expect(page).toHaveScreenshot('calendar-desktop.png', {
      fullPage: true,
    });
  });

  test('mobile automation panel', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
    });
    const page = await context.newPage();
    const pages = createPages(page);

    await pages.login.loginAsUser();
    await pages.automation.goto();

    await expect(page).toHaveScreenshot('automation-mobile.png', {
      fullPage: true,
    });

    await context.close();
  });
});
```

### `frontend/e2e/visual-regression/component-screenshots.spec.ts`
```typescript
import { test, expect } from '@playwright/test';
import { createPages } from '../pages';

test.describe('Component Visual Regression', () => {
  test('automation rule card', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.automation.goto();

    const card = page.locator('.rule-card, [data-testid="rule-card"]').first();
    await expect(card).toHaveScreenshot('automation-rule-card.png');
  });

  test('confirmation dialog', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.automation.goto();

    await page.click('.rule-card button:has-text("Delete")').catch(() => {});

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toHaveScreenshot('confirmation-dialog.png');
  });

  test('loading screen', async ({ page }) => {
    await page.goto('/');

    // Capture loading state
    const loading = page.locator('.loading-screen, [data-testid="loading"]');
    if (await loading.isVisible()) {
      await expect(loading).toHaveScreenshot('loading-screen.png');
    }
  });

  test('calendar sidebar', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.calendar.goto();

    const sidebar = page.locator('.calendar-sidebar, [data-testid="sidebar"]');
    await expect(sidebar).toHaveScreenshot('calendar-sidebar.png');
  });
});
```

### `frontend/e2e/visual-regression/error-states.spec.ts`
```typescript
import { test, expect } from '@playwright/test';

test.describe('Error State Visual Regression', () => {
  test('login error message', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[name="username"]', 'wronguser');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');

    await page.waitForSelector('.error-message, [role="alert"]');

    await expect(page).toHaveScreenshot('login-error.png');
  });

  test('form validation errors', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.calendar.goto();
    await pages.calendar.openCreateEventModal();

    // Submit empty form
    await page.click('button:has-text("Save")');

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toHaveScreenshot('form-validation-errors.png');
  });
});
```

## Files to Create (5 files)
- `calendar-screenshots.spec.ts`
- `theme-colors.spec.ts`
- `responsive-layouts.spec.ts`
- `component-screenshots.spec.ts`
- `error-states.spec.ts`

## Expected Outcome
✅ Baseline screenshots for all pages
✅ All 16 theme colors captured
✅ Responsive layouts validated (mobile/tablet/desktop)
✅ Component-level visual testing
✅ Automated detection of unintended UI changes

## Running Visual Tests

First run (create baselines):
```bash
npm run test:e2e visual-regression/
```

Subsequent runs (compare against baselines):
```bash
npm run test:e2e visual-regression/
```

Update baselines when changes are intentional:
```bash
npm run test:e2e visual-regression/ -- --update-snapshots
```

## Estimated Time
⏱️ **2-3 hours**

## Next Task
[test_18_ci_cd_integration.md](./test_18_ci_cd_integration.md)
