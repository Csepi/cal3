# Test Task 10: Reservations Tests

## Description
Test reservation management system including creating, editing, deleting reservations, resource management, and public booking pages.

## Prerequisites
- ✅ Completed test_01-09

## Implementation Steps

### `frontend/e2e/reservations/reservations-panel.spec.ts`
```typescript
import { test, expect } from '@playwright/test';
import { createPages } from '../pages';

test.describe('Reservations Panel', () => {
  test('opens reservations panel', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();

    await page.click('button:has-text("Reservations")');

    await expect(page.locator('.reservations-panel')).toBeVisible();
  });
});
```

### Test Files to Create:

**`reservation-create.spec.ts`**
- Create reservation with resource
- Validate required fields
- Test time slot selection

**`reservation-edit.spec.ts`**
- Update reservation details
- Change resource
- Reschedule reservation

**`reservation-delete.spec.ts`**
- Delete reservation
- Confirm deletion dialog
- Verify removal from list

**`reservation-filter.spec.ts`**
- Filter by status (pending, confirmed, cancelled)
- Filter by resource
- Filter by date range

**`reservation-list.spec.ts`**
- View all reservations
- Pagination
- Sorting

**`public-booking-page.spec.ts`**
```typescript
test.describe('Public Booking Page', () => {
  test('loads public booking page with valid token', async ({ page }) => {
    // Mock public booking token
    await page.goto('/public-booking/mock-token-123');

    await expect(page.locator('.booking-form, [data-testid="booking-form"]')).toBeVisible();
  });

  test('allows public reservation without login', async ({ page }) => {
    await page.goto('/public-booking/mock-token-123');

    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.click('button:has-text("Reserve")');

    await expect(page.locator('text=Reservation confirmed')).toBeVisible();
  });
});
```

**`resource-management.spec.ts`**
- Create new resource
- Edit resource capacity
- Delete resource
- Assign resource to type

**`resource-type-management.spec.ts`**
- Create resource types
- Edit resource types
- Delete resource types

## Files to Create (9 files)
- `reservations-panel.spec.ts`
- `reservation-create.spec.ts`
- `reservation-edit.spec.ts`
- `reservation-delete.spec.ts`
- `reservation-filter.spec.ts`
- `reservation-list.spec.ts`
- `public-booking-page.spec.ts`
- `resource-management.spec.ts`
- `resource-type-management.spec.ts`

## Estimated Time
⏱️ **3-4 hours**

## Next Task
[test_11_automation_tests.md](./test_11_automation_tests.md)
