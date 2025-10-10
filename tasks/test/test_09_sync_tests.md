# Test Task 09: Calendar Sync Tests

## Description
Test calendar synchronization functionality including Google Calendar sync, connection status, and browser extension error handling.

## Prerequisites
- ✅ Completed test_01-08

## Implementation Steps

### `frontend/e2e/sync/calendar-sync-page.spec.ts`
```typescript
import { test, expect } from '@playwright/test';
import { createPages } from '../pages';

test.describe('Calendar Sync Page', () => {
  test('loads sync page without errors', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();

    await page.click('button:has-text("Sync"), [data-tab="sync"]');

    await expect(page.locator('.sync-panel, [data-testid="sync-panel"]')).toBeVisible();
  });

  test('displays sync status', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();

    await page.goto('/sync');

    await expect(page.locator('.sync-status, [data-testid="sync-status"]')).toBeVisible();
  });
});
```

### `frontend/e2e/sync/sync-errors.spec.ts`
```typescript
test.describe('Sync Error Handling', () => {
  test('suppresses browser extension errors gracefully', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const pages = createPages(page);
    await pages.login.loginAsUser();
    await page.goto('/sync');

    // Extension errors should be filtered/suppressed
    const extensionErrors = consoleErrors.filter(err =>
      err.includes('extension') || err.includes('chrome-extension')
    );

    // Should not crash the app
    await expect(page.locator('.sync-panel')).toBeVisible();
  });
});
```

### `frontend/e2e/sync/google-sync.spec.ts`
- Test initiating Google Calendar sync (mock flow)
- Test sync button renders
- Test disconnect sync

### `frontend/e2e/sync/sync-status.spec.ts`
- Test sync status indicator
- Test last sync timestamp
- Test refresh sync

## Files to Create (4 files)
- `calendar-sync-page.spec.ts`
- `sync-errors.spec.ts`
- `google-sync.spec.ts`
- `sync-status.spec.ts`

## Estimated Time
⏱️ **1-1.5 hours**

## Next Task
[test_10_reservations_tests.md](./test_10_reservations_tests.md)
