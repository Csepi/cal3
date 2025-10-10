# Test Task 11: Automation Tests

## Description
Comprehensive tests for the automation module including rules, triggers, conditions, actions, audit logs, and retroactive execution.

## Prerequisites
- ✅ Completed test_01-10

## Implementation Steps

### `frontend/e2e/automation/automation-panel.spec.ts`
```typescript
import { test, expect } from '@playwright/test';
import { createPages } from '../pages';

test.describe('Automation Panel', () => {
  test('opens automation panel', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.automation.goto();

    await expect(page.locator('.automation-panel')).toBeVisible();
  });
});
```

### Test Files to Create:

**`automation-list.spec.ts`**
- Display all automation rules
- Filter enabled/disabled rules
- Pagination
- Search rules

**`automation-detail.spec.ts`**
- View rule details
- Show trigger configuration
- Display conditions and actions
- Show execution statistics

**`rule-create.spec.ts`**
```typescript
test('creates complete automation rule', async ({ page }) => {
  const pages = createPages(page);
  await pages.login.loginAsUser();
  await pages.automation.goto();

  await pages.automation.createRule('Auto-Color Events', 'event_created');
  await pages.automation.addCondition('title', 'contains', 'Meeting');
  await pages.automation.addAction('set_color', { color: '#3b82f6' });

  const rules = await pages.automation.getAllRuleNames();
  expect(rules).toContain('Auto-Color Events');
});
```

**`rule-edit.spec.ts`**
- Update rule name
- Modify conditions
- Change actions
- Update trigger

**`rule-delete.spec.ts`**
- Delete rule with confirmation dialog
- Verify rule removed from list

**`rule-toggle.spec.ts`**
- Enable/disable rule
- Verify toggle state persists

**`trigger-selector.spec.ts`**
- Test all trigger types:
  - event_created
  - event_updated
  - event_deleted
  - calendar_shared
  - reservation_created

**`condition-builder.spec.ts`**
- Add multiple conditions
- Test all field types (title, description, calendar)
- Test all operators (equals, contains, starts_with, ends_with)
- Remove conditions

**`condition-row.spec.ts`**
- Add condition row
- Edit condition values
- Delete condition row
- Reorder conditions

**`action-builder.spec.ts`**
- Add multiple actions
- Test all action types:
  - set_color
  - set_calendar
  - send_notification
  - set_title_prefix

**`action-row.spec.ts`**
- Add action row
- Configure action parameters
- Delete action row
- Reorder actions

**`set-event-color.spec.ts`**
- Test color selection in action form
- Verify all 16 colors available

**`audit-log-viewer.spec.ts`**
```typescript
test.describe('Audit Log Viewer', () => {
  test('displays execution history', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.automation.goto();

    await page.click('button:has-text("Audit Log")');

    await expect(page.locator('.audit-log-list')).toBeVisible();
  });

  test('filters audit logs by status', async ({ page }) => {
    // Test filtering: success, failed, all
  });

  test('filters audit logs by rule', async ({ page }) => {
    // Test rule-specific filtering
  });
});
```

**`audit-log-detail.spec.ts`**
- View detailed execution log
- Show input/output data
- Display error messages if failed

**`retroactive-execution.spec.ts`**
```typescript
test.describe('Retroactive Execution', () => {
  test('executes rule on past events', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.automation.goto();

    await page.click('text=My Rule');
    await page.click('button:has-text("Run Retroactively")');

    // Configure date range
    await page.fill('input[name="startDate"]', '2025-01-01');
    await page.fill('input[name="endDate"]', '2025-01-31');

    await page.click('button:has-text("Execute")');

    await expect(page.locator('text=Execution started')).toBeVisible();
  });
});
```

**`automation-card.spec.ts`**
- Display rule card UI
- Show rule status badge
- Display execution count
- Show last execution timestamp

## Files to Create (15 files)
- `automation-panel.spec.ts`
- `automation-list.spec.ts`
- `automation-detail.spec.ts`
- `rule-create.spec.ts`
- `rule-edit.spec.ts`
- `rule-delete.spec.ts`
- `rule-toggle.spec.ts`
- `trigger-selector.spec.ts`
- `condition-builder.spec.ts`
- `condition-row.spec.ts`
- `action-builder.spec.ts`
- `action-row.spec.ts`
- `set-event-color.spec.ts`
- `audit-log-viewer.spec.ts`
- `audit-log-detail.spec.ts`
- `retroactive-execution.spec.ts`
- `automation-card.spec.ts`

## Estimated Time
⏱️ **5-6 hours** (largest module)

## Next Task
[test_12_admin_tests.md](./test_12_admin_tests.md)
