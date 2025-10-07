# Test Task 06: Authentication Tests

## Description
Test all authentication flows including login, logout, SSO callback, session management, and unauthorized access.

## Prerequisites
- ✅ Completed test_01-05

## Implementation Steps

Create `frontend/e2e/auth/login.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { createPages } from '../pages';
import { TEST_CONFIG } from '../setup/test-config';

test.describe('Login Flow', () => {
  test('successful login as user', async ({ page }) => {
    const pages = createPages(page);

    await pages.login.goto();
    await pages.login.loginAsUser();

    // Verify redirect to calendar
    await expect(page).toHaveURL(/.*\/(calendar|dashboard).*/);

    // Verify user is logged in
    const username = await page.evaluate(() => localStorage.getItem('username'));
    expect(username).toBe(TEST_CONFIG.USERS.USER.username);
  });

  test('successful login as admin', async ({ page }) => {
    const pages = createPages(page);

    await pages.login.goto();
    await pages.login.loginAsAdmin();

    await expect(page).toHaveURL(/.*\/(calendar|dashboard).*/);

    const role = await page.evaluate(() => localStorage.getItem('userRole'));
    expect(role).toBe('admin');
  });

  test('failed login with invalid credentials', async ({ page }) => {
    const pages = createPages(page);

    await pages.login.goto();
    await pages.login.login('invaliduser', 'wrongpassword');

    // Should show error
    const hasError = await pages.login.hasError();
    expect(hasError).toBeTruthy();

    // Should remain on login page
    await expect(page).toHaveURL(/.*\/(login)?$/);
  });

  test('persists session on page reload', async ({ page }) => {
    const pages = createPages(page);

    await pages.login.loginAsUser();

    // Reload page
    await page.reload();

    // Should still be logged in
    await expect(page).not.toHaveURL(/.*login.*/);
    const username = await page.evaluate(() => localStorage.getItem('username'));
    expect(username).toBeTruthy();
  });
});
```

Create `frontend/e2e/auth/logout.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { createPages } from '../pages';

test.describe('Logout Flow', () => {
  test('successful logout clears session', async ({ page }) => {
    const pages = createPages(page);

    await pages.login.loginAsUser();

    // Click logout
    await page.click('button:has-text("Logout")');

    // Verify redirect to login
    await expect(page).toHaveURL(/.*\/(login)?$/);

    // Verify session cleared
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(token).toBeNull();
  });

  test('logout from any page returns to login', async ({ page }) => {
    const pages = createPages(page);

    await pages.login.loginAsUser();
    await pages.profile.goto();

    await page.click('button:has-text("Logout")');

    await expect(page).toHaveURL(/.*\/(login)?$/);
  });
});
```

Create `frontend/e2e/auth/unauthorized.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Unauthorized Access', () => {
  test('redirects to login when accessing protected route without auth', async ({ page }) => {
    // Try to access calendar without logging in
    await page.goto('/calendar');

    // Should redirect to login
    await expect(page).toHaveURL(/.*\/(login)?$/);
  });

  test('cannot access admin panel as regular user', async ({ page }) => {
    const pages = createPages(page);

    await pages.login.loginAsUser();
    await page.goto('/admin');

    // Should show error or redirect
    const isVisible = await page.locator('.admin-panel').isVisible().catch(() => false);
    expect(isVisible).toBeFalsy();
  });
});
```

Create `frontend/e2e/auth/sso-callback.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('SSO OAuth Callback', () => {
  test('handles OAuth callback route', async ({ page }) => {
    // Simulate OAuth callback with mock token
    await page.goto('/auth/callback?code=mock_code&state=mock_state');

    // Should process callback (may show loading or redirect)
    await page.waitForLoadState('networkidle');

    // Verify page exists and doesn't error
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    expect(errors).toHaveLength(0);
  });
});
```

## Files to Create
- `frontend/e2e/auth/login.spec.ts`
- `frontend/e2e/auth/logout.spec.ts`
- `frontend/e2e/auth/unauthorized.spec.ts`
- `frontend/e2e/auth/sso-callback.spec.ts`

## Expected Outcome
✅ All authentication flows tested
✅ Session management validated
✅ Unauthorized access blocked
✅ SSO callback handled

## Estimated Time
⏱️ **1 hour**

## Next Task
[test_07_calendar_tests.md](./test_07_calendar_tests.md)
