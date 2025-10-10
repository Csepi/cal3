# Test Task 13: API Tests

## Description
Test ALL backend API endpoints directly using Playwright's request API. Validates request/response contracts, error handling, and data integrity for all 60+ endpoints.

## Prerequisites
- ✅ Completed test_01-12

## Implementation Steps

### `frontend/e2e/api/auth-api.spec.ts`
```typescript
import { test, expect } from '@playwright/test';

test.describe('Auth API', () => {
  test('POST /api/auth/login - successful login', async ({ request }) => {
    const response = await request.post('http://localhost:8081/api/auth/login', {
      data: {
        username: 'testuser',
        password: 'password123',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.token).toBeTruthy();
    expect(data.user).toBeTruthy();
  });

  test('POST /api/auth/login - invalid credentials', async ({ request }) => {
    const response = await request.post('http://localhost:8081/api/auth/login', {
      data: {
        username: 'invalid',
        password: 'wrong',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('POST /api/auth/register - create new user', async ({ request }) => {
    const response = await request.post('http://localhost:8081/api/auth/register', {
      data: {
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'SecurePass123!',
      },
    });

    expect(response.ok()).toBeTruthy();
  });
});
```

### `frontend/e2e/api/events-api.spec.ts`
```typescript
test.describe('Events API', () => {
  let authToken: string;
  let eventId: number;

  test.beforeAll(async ({ request }) => {
    // Login to get token
    const response = await request.post('http://localhost:8081/api/auth/login', {
      data: { username: 'testuser', password: 'password123' },
    });
    const data = await response.json();
    authToken = data.token;
  });

  test('POST /api/events - create event', async ({ request }) => {
    const response = await request.post('http://localhost:8081/api/events', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        title: 'API Test Event',
        description: 'Created via API test',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 3600000).toISOString(),
        allDay: false,
      },
    });

    expect(response.status()).toBe(201);
    const event = await response.json();
    eventId = event.id;
    expect(event.title).toBe('API Test Event');
  });

  test('GET /api/events - fetch all events', async ({ request }) => {
    const response = await request.get('http://localhost:8081/api/events', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.ok()).toBeTruthy();
    const events = await response.json();
    expect(Array.isArray(events)).toBeTruthy();
  });

  test('GET /api/events/:id - fetch single event', async ({ request }) => {
    const response = await request.get(`http://localhost:8081/api/events/${eventId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.ok()).toBeTruthy();
    const event = await response.json();
    expect(event.id).toBe(eventId);
  });

  test('PATCH /api/events/:id - update event', async ({ request }) => {
    const response = await request.patch(`http://localhost:8081/api/events/${eventId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { title: 'Updated Event Title' },
    });

    expect(response.ok()).toBeTruthy();
    const event = await response.json();
    expect(event.title).toBe('Updated Event Title');
  });

  test('DELETE /api/events/:id - delete event', async ({ request }) => {
    const response = await request.delete(`http://localhost:8081/api/events/${eventId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.ok()).toBeTruthy();
  });

  test('POST /api/events/recurring - create recurring event', async ({ request }) => {
    const response = await request.post('http://localhost:8081/api/events/recurring', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        title: 'Weekly Meeting',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 3600000).toISOString(),
        recurrence: {
          type: 'weekly',
          interval: 1,
          daysOfWeek: [1, 3, 5],
          endType: 'count',
          count: 10,
        },
      },
    });

    expect(response.ok()).toBeTruthy();
  });
});
```

### Additional API Test Files to Create:

**`calendars-api.spec.ts`**
- POST /api/calendars
- GET /api/calendars
- GET /api/calendars/:id
- PATCH /api/calendars/:id
- DELETE /api/calendars/:id
- POST /api/calendars/:id/share
- GET /api/calendars/:id/shares
- DELETE /api/calendars/:calendarId/shares/:shareId

**`users-api.spec.ts`**
- GET /api/users
- GET /api/users?search=query
- GET /api/users/me

**`profile-api.spec.ts`**
- GET /api/user-profile
- PATCH /api/user-profile
- PATCH /api/user-profile/password

**`sync-api.spec.ts`**
- POST /api/calendar-sync/connect
- GET /api/calendar-sync/status
- POST /api/calendar-sync/disconnect

**`reservations-api.spec.ts`**
- POST /api/reservations
- GET /api/reservations
- GET /api/reservations/:id
- PATCH /api/reservations/:id
- DELETE /api/reservations/:id

**`resources-api.spec.ts`**
- POST /api/resources
- GET /api/resources
- PATCH /api/resources/:id
- DELETE /api/resources/:id

**`resource-types-api.spec.ts`**
- POST /api/resource-types
- GET /api/resource-types
- PATCH /api/resource-types/:id
- DELETE /api/resource-types/:id

**`organisations-api.spec.ts`**
- POST /api/organisations
- GET /api/organisations
- GET /api/organisations/:id
- PATCH /api/organisations/:id
- DELETE /api/organisations/:id
- POST /api/organisations/:id/members
- DELETE /api/organisations/:id/members/:userId
- PATCH /api/organisations/:id/members/:userId/role

**`admin-api.spec.ts`**
- GET /api/admin/users
- PATCH /api/admin/users/:id/role
- PATCH /api/admin/users/:id/usage-plans
- DELETE /api/admin/users/:id

**`automation-api.spec.ts`**
```typescript
test.describe('Automation API', () => {
  test('POST /api/automation/rules - create rule', async ({ request }) => {
    // Create automation rule
  });

  test('GET /api/automation/rules - list rules', async ({ request }) => {
    // List with pagination
  });

  test('GET /api/automation/rules/:id - get rule details', async ({ request }) => {
    // Fetch single rule
  });

  test('PUT /api/automation/rules/:id - update rule', async ({ request }) => {
    // Update entire rule
  });

  test('DELETE /api/automation/rules/:id - delete rule', async ({ request }) => {
    // Remove rule
  });

  test('PATCH /api/automation/rules/:id/toggle - toggle enabled', async ({ request }) => {
    // Enable/disable rule
  });

  test('POST /api/automation/rules/:id/execute - manual execution', async ({ request }) => {
    // Trigger rule manually
  });

  test('GET /api/automation/metadata - get metadata', async ({ request }) => {
    // Fetch available triggers, conditions, actions
  });
});
```

**`audit-log-api.spec.ts`**
- GET /api/automation/audit-logs
- GET /api/automation/audit-logs/:id
- GET /api/automation/audit-logs/stats

**`public-booking-api.spec.ts`**
- GET /public-booking/:token
- POST /public-booking/:token/reserve

**`user-permissions-api.spec.ts`**
- GET /api/user-permissions

## Files to Create (14 files)
- `auth-api.spec.ts`
- `events-api.spec.ts`
- `calendars-api.spec.ts`
- `users-api.spec.ts`
- `profile-api.spec.ts`
- `sync-api.spec.ts`
- `reservations-api.spec.ts`
- `resources-api.spec.ts`
- `resource-types-api.spec.ts`
- `organisations-api.spec.ts`
- `admin-api.spec.ts`
- `automation-api.spec.ts`
- `audit-log-api.spec.ts`
- `public-booking-api.spec.ts`
- `user-permissions-api.spec.ts`

## Expected Outcome
✅ **All 60+ API endpoints tested**
✅ Request/response validation
✅ Error handling verified
✅ Authentication required endpoints protected
✅ Data integrity confirmed

## Estimated Time
⏱️ **4-6 hours**

## Next Task
[test_14_ui_component_tests.md](./test_14_ui_component_tests.md)
