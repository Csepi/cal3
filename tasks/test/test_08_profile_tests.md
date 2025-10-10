# Test Task 08: Profile Tests

## Description
Test user profile management including personal info updates, theme changes, timezone selection, hour format, and password changes.

## Prerequisites
- ✅ Completed test_01-07

## Implementation Steps

### `frontend/e2e/profile/view-profile.spec.ts`
```typescript
import { test, expect } from '@playwright/test';
import { createPages } from '../pages';

test.describe('View Profile', () => {
  test('displays user profile information', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.profile.goto();

    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
  });
});
```

### `frontend/e2e/profile/update-personal-info.spec.ts`
- Test updating first name
- Test updating last name
- Test updating email
- Test validation errors

### `frontend/e2e/profile/theme-selector.spec.ts`
```typescript
test.describe('Theme Selection', () => {
  test('changes theme color and persists', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.profile.goto();

    await pages.profile.changeTheme('#3b82f6'); // Blue
    await page.reload();

    const currentTheme = await pages.profile.getCurrentTheme();
    expect(currentTheme).toBe('#3b82f6');
  });

  test('tests all 16 theme colors', async ({ page }) => {
    const colors = ['#ef4444', '#f59e0b', '#eab308', '#84cc16', '#10b981',
                    '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
                    '#6366f1', '#7c3aed', '#8b5cf6', '#ec4899', '#f43f5e', '#64748b'];

    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.profile.goto();

    for (const color of colors) {
      await pages.profile.changeTheme(color);
      const current = await pages.profile.getCurrentTheme();
      expect(current).toBe(color);
    }
  });
});
```

### `frontend/e2e/profile/timezone-selector.spec.ts`
- Test selecting different timezones
- Test timezone persistence
- Test all 70+ timezones load correctly

### `frontend/e2e/profile/hour-format.spec.ts`
```typescript
test.describe('Hour Format Settings', () => {
  test('switches between 12h and 24h format', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.profile.goto();

    await pages.profile.updateProfile({ hourFormat: '24h' });
    await pages.calendar.goto();

    // Verify time display uses 24h format
    const timeText = await page.locator('.time-display').first().textContent();
    expect(timeText).toMatch(/\d{2}:\d{2}/); // 14:00 format
  });
});
```

### `frontend/e2e/profile/change-password.spec.ts`
- Test password change flow
- Test password validation
- Test login with new password

### `frontend/e2e/profile/usage-plans.spec.ts`
- Test usage plans display as read-only badges
- Verify correct plans shown

## Files to Create (7 files)
- `view-profile.spec.ts`
- `update-personal-info.spec.ts`
- `theme-selector.spec.ts`
- `timezone-selector.spec.ts`
- `hour-format.spec.ts`
- `change-password.spec.ts`
- `usage-plans.spec.ts`

## Estimated Time
⏱️ **2-3 hours**

## Next Task
[test_09_sync_tests.md](./test_09_sync_tests.md)
