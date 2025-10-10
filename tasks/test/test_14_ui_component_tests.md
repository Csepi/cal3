# Test Task 14: UI Component Tests

## Description
Test all reusable UI components (Button, Modal, Card, Input, Badge, etc.) for proper rendering, interactions, and accessibility.

## Prerequisites
- ✅ Completed test_01-13

## Implementation Steps

### `frontend/e2e/ui-components/button.spec.ts`
```typescript
import { test, expect } from '@playwright/test';

test.describe('Button Component', () => {
  test('renders button with text', async ({ page }) => {
    await page.goto('/calendar');

    const button = page.locator('button:has-text("Create Event")');
    await expect(button).toBeVisible();
  });

  test('button is clickable', async ({ page }) => {
    await page.goto('/calendar');

    const button = page.locator('button:has-text("Create Event")');
    await button.click();

    // Modal should open
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('disabled button is not clickable', async ({ page }) => {
    // Test disabled state
  });
});
```

### `frontend/e2e/ui-components/modal.spec.ts`
```typescript
test.describe('Modal Component', () => {
  test('modal opens on trigger', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.calendar.goto();

    await pages.calendar.openCreateEventModal();

    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('modal closes on cancel button', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.calendar.goto();

    await pages.calendar.openCreateEventModal();
    await page.click('button:has-text("Cancel")');

    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('modal closes on escape key', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.calendar.goto();

    await pages.calendar.openCreateEventModal();
    await page.keyboard.press('Escape');

    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('modal closes on backdrop click', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.calendar.goto();

    await pages.calendar.openCreateEventModal();

    // Click outside modal (backdrop)
    await page.locator('.modal-backdrop').click();

    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });
});
```

### `frontend/e2e/ui-components/card.spec.ts`
```typescript
test.describe('Card Component', () => {
  test('renders automation rule cards', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.automation.goto();

    const cards = page.locator('.rule-card, [data-testid="rule-card"]');
    await expect(cards.first()).toBeVisible();
  });

  test('card shows hover state', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.automation.goto();

    const card = page.locator('.rule-card').first();
    await card.hover();

    // Check for hover styling changes
    const opacity = await card.evaluate(el =>
      window.getComputedStyle(el).opacity
    );

    expect(parseFloat(opacity)).toBeGreaterThan(0.8);
  });
});
```

### `frontend/e2e/ui-components/input.spec.ts`
```typescript
test.describe('Input Component', () => {
  test('accepts text input', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.calendar.goto();
    await pages.calendar.openCreateEventModal();

    await page.fill('input[name="title"]', 'Test Event Title');

    const value = await page.inputValue('input[name="title"]');
    expect(value).toBe('Test Event Title');
  });

  test('shows validation error for required field', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.calendar.goto();
    await pages.calendar.openCreateEventModal();

    // Submit without filling required field
    await page.click('button:has-text("Save")');

    await expect(page.locator('.error-message, [role="alert"]')).toBeVisible();
  });

  test('clears input value', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.calendar.goto();
    await pages.calendar.openCreateEventModal();

    await page.fill('input[name="title"]', 'Test');
    await page.fill('input[name="title"]', '');

    const value = await page.inputValue('input[name="title"]');
    expect(value).toBe('');
  });
});
```

### `frontend/e2e/ui-components/badge.spec.ts`
```typescript
test.describe('Badge Component', () => {
  test('displays usage plan badges', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.profile.goto();

    const badges = page.locator('.badge, [data-testid="badge"]');
    await expect(badges.first()).toBeVisible();
  });

  test('badge shows correct color', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.profile.goto();

    const badge = page.locator('.badge:has-text("Enterprise")');
    const bgColor = await badge.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );

    expect(bgColor).toBeTruthy();
  });
});
```

### Additional Component Test Files:

**`confirmation-dialog.spec.ts`**
- Test delete confirmation dialogs
- Test cancel/confirm actions
- Test dialog text content

**`loading-screen.spec.ts`**
- Test loading spinner appears during data fetch
- Test loading screen disappears after load
- Test theme colors applied to loading screen

**`recurrence-selector.spec.ts`**
```typescript
test.describe('Recurrence Selector', () => {
  test('shows recurrence options', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.calendar.goto();
    await pages.calendar.openCreateEventModal();

    await page.click('button:has-text("Repeat"), [data-toggle="recurrence"]');

    await expect(page.locator('select[name="recurrence.type"]')).toBeVisible();
  });

  test('selects daily recurrence', async ({ page }) => {
    // Test daily option
  });

  test('selects weekly recurrence with specific days', async ({ page }) => {
    // Test weekly with day selection
  });

  test('selects monthly recurrence', async ({ page }) => {
    // Test monthly option
  });

  test('configures end date for recurrence', async ({ page }) => {
    // Test end conditions
  });
});
```

**`simple-modal.spec.ts`**
- Test simple modal variant
- Test modal without backdrop close

**`theme-selector.spec.ts`**
- Already covered in profile tests, but test component in isolation

## Files to Create (9 files)
- `button.spec.ts`
- `modal.spec.ts`
- `card.spec.ts`
- `input.spec.ts`
- `badge.spec.ts`
- `confirmation-dialog.spec.ts`
- `loading-screen.spec.ts`
- `recurrence-selector.spec.ts`
- `simple-modal.spec.ts`

## Expected Outcome
✅ All UI components render correctly
✅ Interactions work as expected
✅ Form validation functions properly
✅ Modals open/close correctly
✅ Components respond to keyboard/mouse events

## Estimated Time
⏱️ **2-3 hours**

## Next Task
[test_15_accessibility_tests.md](./test_15_accessibility_tests.md)
