# Test Task 05: Create Smoke Tests

## Description
Implement critical smoke tests that catch JavaScript errors, console errors, and ensure the application loads correctly across all major pages. **These tests catch browser-only syntax errors.**

## Prerequisites
- ✅ Completed test_01-04

## Implementation Steps

Create `frontend/e2e/smoke/app-loads.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { createPages } from '../pages';

test.describe('Smoke Tests - Application Loading', () => {
  test('homepage loads without JavaScript errors', async ({ page }) => {
    const jsErrors: Error[] = [];
    page.on('pageerror', (err) => jsErrors.push(err));

    await page.goto('/');

    expect(jsErrors).toHaveLength(0);
  });

  test('all main routes load without errors', async ({ page }) => {
    const routes = ['/', '/calendar', '/profile', '/sync', '/reservations', '/automation', '/admin'];
    const pages = createPages(page);

    await pages.login.loginAsUser();

    for (const route of routes) {
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));

      await page.goto(route);
      expect(errors, `Route ${route} had errors`).toHaveLength(0);
    }
  });

  test('no console errors on main pages', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.calendar.goto();
    await pages.profile.goto();
    await pages.automation.goto();

    // Filter out known harmless errors (browser extensions, etc.)
    const realErrors = consoleErrors.filter(err =>
      !err.includes('extension') &&
      !err.includes('chrome-extension')
    );

    expect(realErrors).toHaveLength(0);
  });

  test('API is reachable', async ({ page }) => {
    const response = await page.request.get('http://localhost:8081/api/docs');
    expect(response.ok()).toBeTruthy();
  });

  test('all major components render', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();

    // Check calendar renders
    await pages.calendar.goto();
    await expect(page.locator('.calendar, [data-testid="calendar"]')).toBeVisible();

    // Check profile renders
    await pages.profile.goto();
    await expect(page.locator('form, .profile-form')).toBeVisible();

    // Check automation panel renders
    await pages.automation.goto();
    await expect(page.locator('.automation-panel, [data-testid="automation-panel"]')).toBeVisible();
  });
});
```

Create `frontend/e2e/smoke/console-errors.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Console Error Detection', () => {
  test('tracks all console errors across user flow', async ({ page }) => {
    const consoleErrors: { type: string; text: string; url: string }[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push({
          type: msg.type(),
          text: msg.text(),
          url: page.url(),
        });
      }
    });

    // Complete user flow
    await page.goto('/');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL(/.*calendar.*/);
    await page.click('button:has-text("Profile")');
    await page.click('button:has-text("Automation")');

    // Report all errors
    if (consoleErrors.length > 0) {
      console.log('Console Errors Found:', JSON.stringify(consoleErrors, null, 2));
    }

    expect(consoleErrors).toHaveLength(0);
  });
});
```

Create `frontend/e2e/smoke/network-errors.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Network Error Detection', () => {
  test('all API calls succeed or fail gracefully', async ({ page }) => {
    const failedRequests: { url: string; status: number }[] = [];

    page.on('response', (response) => {
      if (response.url().includes('/api/') && response.status() >= 500) {
        failedRequests.push({
          url: response.url(),
          status: response.status(),
        });
      }
    });

    await page.goto('/');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL(/.*calendar.*/);

    if (failedRequests.length > 0) {
      console.log('Failed API Requests:', JSON.stringify(failedRequests, null, 2));
    }

    expect(failedRequests).toHaveLength(0);
  });
});
```

## Files to Create
- `frontend/e2e/smoke/app-loads.spec.ts`
- `frontend/e2e/smoke/console-errors.spec.ts`
- `frontend/e2e/smoke/network-errors.spec.ts`

## Expected Outcome
✅ **Catches all browser syntax errors before deployment**
✅ Validates all routes load successfully
✅ Detects console errors
✅ Monitors network failures

## Run Tests
```bash
npm run test:e2e:smoke
```

## Estimated Time
⏱️ **45-60 minutes**

## Next Task
[test_06_auth_tests.md](./test_06_auth_tests.md) - Authentication and authorization tests
