# Test Task 12: Admin Panel Tests

## Description
Test admin-only functionality including user management, role assignment, usage plans, statistics, and organisation management.

## Prerequisites
- ✅ Completed test_01-11

## Implementation Steps

### `frontend/e2e/admin/admin-panel.spec.ts`
```typescript
import { test, expect } from '@playwright/test';
import { createPages } from '../pages';

test.describe('Admin Panel Access', () => {
  test('admin can access admin panel', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsAdmin();
    await pages.admin.goto();

    await expect(page.locator('.admin-panel')).toBeVisible();
  });

  test('regular user cannot access admin panel', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();

    await page.goto('/admin');

    // Should be blocked or redirected
    const isAdminVisible = await page.locator('.admin-panel').isVisible().catch(() => false);
    expect(isAdminVisible).toBeFalsy();
  });
});
```

### Test Files to Create:

**`admin-navigation.spec.ts`**
- Navigate between admin tabs (Users, Events, Calendars, Stats, etc.)
- Verify all tabs render

**`admin-user-panel.spec.ts`**
```typescript
test.describe('User Management', () => {
  test('lists all users', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsAdmin();
    await pages.admin.gotoUsers();

    await expect(page.locator('table tbody tr')).not.toHaveCount(0);
  });

  test('searches for specific user', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsAdmin();
    await pages.admin.gotoUsers();

    await pages.admin.searchUser('testuser');

    await expect(page.locator('text=testuser')).toBeVisible();
  });

  test('changes user role', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsAdmin();
    await pages.admin.gotoUsers();

    await pages.admin.changeUserRole('testuser', 'admin');

    const role = await pages.admin.getUserRole('testuser');
    expect(role).toContain('admin');
  });
});
```

**`admin-stats.spec.ts`**
- Display total users count
- Display total events count
- Display active calendars
- Show usage statistics

**`admin-events.spec.ts`**
- View all events across all users
- Delete any event
- Edit any event

**`admin-calendars.spec.ts`**
- View all calendars
- Delete calendars
- Manage calendar shares

**`admin-reservations.spec.ts`**
- View all reservations
- Approve/reject reservations
- Cancel reservations

**`admin-shares.spec.ts`**
- View all calendar shares
- Revoke shares
- Manage share permissions

**`organisation-management.spec.ts`**
- Create organisation
- Edit organisation details
- Delete organisation
- View organisation members

**`organisation-users.spec.ts`**
- Add user to organisation
- Remove user from organisation
- View organisation user list

**`organisation-create.spec.ts`**
- Create new organisation with form
- Validate required fields

**`organisation-edit.spec.ts`**
- Update organisation name
- Update domain
- Update description

**`role-assignment.spec.ts`**
```typescript
test.describe('Role Assignment', () => {
  test('assigns role to organisation member', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsAdmin();

    await page.goto('/admin/organisations');
    await page.click('text=Test Org');
    await page.click('button:has-text("Manage Members")');

    await page.selectOption('select[name="role"]', 'owner');
    await page.click('button:has-text("Update Role")');

    await expect(page.locator('text=Role updated')).toBeVisible();
  });
});
```

**`usage-plan-bulk.spec.ts`**
```typescript
test.describe('Bulk Usage Plan Operations', () => {
  test('sets usage plans for multiple users', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsAdmin();
    await pages.admin.gotoUsers();

    // Select multiple users
    await page.check('input[type="checkbox"][data-user="user1"]');
    await page.check('input[type="checkbox"][data-user="user2"]');

    // Bulk set usage plans
    await page.click('button:has-text("Bulk Actions")');
    await page.click('text=Set Usage Plans');
    await page.check('input[value="Enterprise"]');
    await page.click('button:has-text("Apply")');

    await expect(page.locator('text=Plans updated')).toBeVisible();
  });

  test('adds usage plan to users', async ({ page }) => {
    // Test "Add" operation
  });

  test('removes usage plan from users', async ({ page }) => {
    // Test "Remove" operation
  });
});
```

## Files to Create (13 files)
- `admin-panel.spec.ts`
- `admin-navigation.spec.ts`
- `admin-user-panel.spec.ts`
- `admin-stats.spec.ts`
- `admin-events.spec.ts`
- `admin-calendars.spec.ts`
- `admin-reservations.spec.ts`
- `admin-shares.spec.ts`
- `organisation-management.spec.ts`
- `organisation-users.spec.ts`
- `organisation-create.spec.ts`
- `organisation-edit.spec.ts`
- `role-assignment.spec.ts`
- `usage-plan-bulk.spec.ts`

## Estimated Time
⏱️ **4-5 hours**

## Next Task
[test_13_api_tests.md](./test_13_api_tests.md)
