# Test Task 07: Calendar Tests

## Description
Comprehensive tests for all calendar functionality including views, event CRUD, recurring events, drag-to-create, and calendar management.

## Prerequisites
- ✅ Completed test_01-06

## Implementation Steps

Create tests for ALL calendar operations:

### `frontend/e2e/calendar/view-switching.spec.ts`
```typescript
import { test, expect } from '@playwright/test';
import { createPages } from '../pages';

test.describe('Calendar View Switching', () => {
  test.beforeEach(async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.calendar.goto();
  });

  test('switches to month view', async ({ page }) => {
    const pages = createPages(page);
    await pages.calendar.switchToMonthView();

    await expect(page.locator('.month-view, [data-view="month"]')).toBeVisible();
  });

  test('switches to week view', async ({ page }) => {
    const pages = createPages(page);
    await pages.calendar.switchToWeekView();

    await expect(page.locator('.week-view, [data-view="week"]')).toBeVisible();
  });
});
```

### `frontend/e2e/calendar/event-create.spec.ts`
```typescript
import { test, expect } from '@playwright/test';
import { createPages } from '../pages';
import { createTestEvent } from '../setup/test-data-factory';

test.describe('Event Creation', () => {
  test.beforeEach(async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.calendar.goto();
  });

  test('creates a basic event', async ({ page }) => {
    const pages = createPages(page);
    const event = createTestEvent({ title: 'Test Event' });

    await pages.calendar.createEvent(event);

    const events = await pages.calendar.getVisibleEvents();
    expect(events).toContain('Test Event');
  });

  test('creates an all-day event', async ({ page }) => {
    const pages = createPages(page);

    await pages.calendar.createEvent({
      title: 'All Day Event',
      allDay: true,
    });

    const events = await pages.calendar.getVisibleEvents();
    expect(events).toContain('All Day Event');
  });
});
```

### `frontend/e2e/calendar/event-edit.spec.ts`
- Test updating event title, description, time
- Test moving events via drag-and-drop
- Test changing event color

### `frontend/e2e/calendar/event-delete.spec.ts`
- Test deleting single event
- Test delete confirmation dialog

### `frontend/e2e/calendar/event-recurring.spec.ts`
- Test creating daily recurring events
- Test weekly recurring events with specific days
- Test monthly recurring events
- Test editing single instance vs all instances

### `frontend/e2e/calendar/week-view-drag.spec.ts`
- Test drag-to-create events in week view
- Test time range selection

### `frontend/e2e/calendar/calendar-manager.spec.ts`
- Test creating new calendars
- Test toggling calendar visibility
- Test deleting calendars
- Test calendar color changes

## Files to Create (10 test files)
- `event-create.spec.ts`
- `event-edit.spec.ts`
- `event-delete.spec.ts`
- `event-recurring.spec.ts`
- `event-color.spec.ts`
- `all-day-events.spec.ts`
- `view-switching.spec.ts`
- `week-view-drag.spec.ts`
- `month-view.spec.ts`
- `calendar-manager.spec.ts`

## Expected Outcome
✅ All calendar CRUD operations tested
✅ All views validated
✅ Drag-and-drop functionality tested
✅ Recurring events fully tested

## Estimated Time
⏱️ **3-4 hours**

## Next Task
[test_08_profile_tests.md](./test_08_profile_tests.md)
