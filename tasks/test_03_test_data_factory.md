# Test Task 03: Create Test Data Factory

## Description
Build a comprehensive test data generation system using Faker.js to create realistic, randomized test data for events, users, calendars, automation rules, and other entities.

## Prerequisites
- ✅ Completed [test_01_setup_playwright.md](./test_01_setup_playwright.md)
- ✅ Completed [test_02_create_config.md](./test_02_create_config.md)
- @faker-js/faker installed

## Implementation Steps

### 1. Create Test Data Factory

Create `frontend/e2e/setup/test-data-factory.ts`:

```typescript
import { faker } from '@faker-js/faker';

/**
 * Test Data Factory
 * Generates realistic, randomized test data for E2E tests
 */

// ==========================================
// USER DATA
// ==========================================

export interface TestUser {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  timezone: string;
  themeColor: string;
  hourFormat: '12h' | '24h';
}

export const createTestUser = (overrides?: Partial<TestUser>): TestUser => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    username: faker.internet.userName({ firstName, lastName }).toLowerCase(),
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    password: faker.internet.password({ length: 12, memorable: true }),
    firstName,
    lastName,
    timezone: faker.helpers.arrayElement([
      'America/New_York',
      'America/Los_Angeles',
      'Europe/London',
      'Europe/Paris',
      'Asia/Tokyo',
      'Australia/Sydney',
    ]),
    themeColor: faker.helpers.arrayElement([
      '#ef4444', '#f59e0b', '#eab308', '#84cc16',
      '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
      '#3b82f6', '#6366f1', '#7c3aed', '#8b5cf6',
      '#ec4899', '#f43f5e', '#64748b',
    ]),
    hourFormat: faker.helpers.arrayElement(['12h', '24h']),
    ...overrides,
  };
};

// ==========================================
// EVENT DATA
// ==========================================

export interface TestEvent {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  color: string;
  calendarId?: number;
}

export const createTestEvent = (overrides?: Partial<TestEvent>): TestEvent => {
  const startDate = faker.date.future();
  const endDate = new Date(startDate.getTime() + faker.number.int({ min: 30, max: 180 }) * 60000); // 30min-3hr

  return {
    title: faker.helpers.arrayElement([
      faker.company.catchPhrase(),
      `Meeting: ${faker.person.fullName()}`,
      `${faker.hacker.verb()} ${faker.hacker.noun()}`,
      faker.lorem.words(3),
    ]),
    description: faker.lorem.paragraph(),
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    allDay: faker.datatype.boolean({ probability: 0.2 }), // 20% all-day events
    color: faker.helpers.arrayElement([
      '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899',
    ]),
    ...overrides,
  };
};

// ==========================================
// CALENDAR DATA
// ==========================================

export interface TestCalendar {
  name: string;
  description: string;
  color: string;
  timezone: string;
}

export const createTestCalendar = (overrides?: Partial<TestCalendar>): TestCalendar => {
  return {
    name: faker.helpers.arrayElement([
      `${faker.word.adjective()} Calendar`,
      `${faker.person.jobArea()} Schedule`,
      faker.company.buzzNoun(),
    ]),
    description: faker.company.catchPhrase(),
    color: faker.helpers.arrayElement([
      '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
    ]),
    timezone: 'America/New_York',
    ...overrides,
  };
};

// ==========================================
// AUTOMATION RULE DATA
// ==========================================

export interface TestAutomationRule {
  name: string;
  description: string;
  enabled: boolean;
  trigger: {
    type: string;
  };
  conditions: Array<{
    field: string;
    operator: string;
    value: string;
  }>;
  actions: Array<{
    type: string;
    params: Record<string, any>;
  }>;
}

export const createTestAutomationRule = (overrides?: Partial<TestAutomationRule>): TestAutomationRule => {
  return {
    name: faker.helpers.arrayElement([
      `Auto-${faker.hacker.verb()} ${faker.hacker.noun()}`,
      `Rule: ${faker.word.adjective()} Events`,
      faker.company.buzzPhrase(),
    ]),
    description: faker.lorem.sentence(),
    enabled: faker.datatype.boolean({ probability: 0.8 }), // 80% enabled
    trigger: {
      type: faker.helpers.arrayElement(['event_created', 'event_updated', 'calendar_shared']),
    },
    conditions: [
      {
        field: 'title',
        operator: 'contains',
        value: faker.word.noun(),
      },
    ],
    actions: [
      {
        type: 'set_color',
        params: {
          color: faker.helpers.arrayElement(['#ef4444', '#10b981', '#3b82f6']),
        },
      },
    ],
    ...overrides,
  };
};

// ==========================================
// RESERVATION DATA
// ==========================================

export interface TestReservation {
  title: string;
  resourceId?: number;
  startTime: string;
  endTime: string;
  status: string;
  notes: string;
}

export const createTestReservation = (overrides?: Partial<TestReservation>): TestReservation => {
  const startTime = faker.date.future();
  const endTime = new Date(startTime.getTime() + faker.number.int({ min: 30, max: 240 }) * 60000); // 30min-4hr

  return {
    title: `${faker.company.buzzNoun()} Reservation`,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    status: faker.helpers.arrayElement(['pending', 'confirmed', 'cancelled']),
    notes: faker.lorem.sentence(),
    ...overrides,
  };
};

// ==========================================
// RESOURCE DATA
// ==========================================

export interface TestResource {
  name: string;
  description: string;
  capacity: number;
  resourceTypeId?: number;
}

export const createTestResource = (overrides?: Partial<TestResource>): TestResource => {
  return {
    name: faker.helpers.arrayElement([
      `${faker.word.adjective()} Room`,
      `${faker.company.buzzNoun()} Space`,
      `Conference ${faker.number.int({ min: 1, max: 20 })}`,
    ]),
    description: faker.lorem.sentence(),
    capacity: faker.number.int({ min: 2, max: 50 }),
    ...overrides,
  };
};

// ==========================================
// ORGANISATION DATA
// ==========================================

export interface TestOrganisation {
  name: string;
  description: string;
  domain: string;
}

export const createTestOrganisation = (overrides?: Partial<TestOrganisation>): TestOrganisation => {
  const companyName = faker.company.name();

  return {
    name: companyName,
    description: faker.company.catchPhrase(),
    domain: faker.internet.domainName(),
    ...overrides,
  };
};

// ==========================================
// RECURRENCE PATTERN DATA
// ==========================================

export interface TestRecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  endType: 'never' | 'count' | 'date';
  count?: number;
  endDate?: string;
}

export const createTestRecurrencePattern = (overrides?: Partial<TestRecurrencePattern>): TestRecurrencePattern => {
  const type = faker.helpers.arrayElement(['daily', 'weekly', 'monthly', 'yearly'] as const);
  const endType = faker.helpers.arrayElement(['never', 'count', 'date'] as const);

  const pattern: TestRecurrencePattern = {
    type,
    interval: faker.number.int({ min: 1, max: 4 }),
    endType,
    ...overrides,
  };

  if (type === 'weekly') {
    pattern.daysOfWeek = faker.helpers.arrayElements([0, 1, 2, 3, 4, 5, 6], { min: 1, max: 5 });
  }

  if (type === 'monthly') {
    pattern.dayOfMonth = faker.number.int({ min: 1, max: 28 });
  }

  if (endType === 'count') {
    pattern.count = faker.number.int({ min: 5, max: 50 });
  }

  if (endType === 'date') {
    pattern.endDate = faker.date.future({ years: 1 }).toISOString();
  }

  return pattern;
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Generate multiple test items
 */
export const createMultiple = <T>(
  factory: (overrides?: Partial<T>) => T,
  count: number,
  overrides?: Partial<T>
): T[] => {
  return Array.from({ length: count }, () => factory(overrides));
};

/**
 * Generate unique email for testing
 */
export const createUniqueEmail = (): string => {
  return `test-${faker.string.uuid()}@example.com`;
};

/**
 * Generate unique username for testing
 */
export const createUniqueUsername = (): string => {
  return `user_${faker.string.alphanumeric(8).toLowerCase()}`;
};

/**
 * Generate test JWT token (mock)
 */
export const createMockJwtToken = (userId: number, role: string = 'user'): string => {
  // This is a MOCK token for testing purposes only
  const payload = Buffer.from(JSON.stringify({ userId, role })).toString('base64');
  return `mock.${payload}.signature`;
};
```

### 2. Create Authentication Helper

Create `frontend/e2e/setup/auth-helper.ts`:

```typescript
import { Page } from '@playwright/test';
import { TEST_CONFIG } from './test-config';

/**
 * Authentication Helper
 * Reusable functions for login/logout in tests
 */

export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Login as admin user
   */
  async loginAsAdmin() {
    await this.login(
      TEST_CONFIG.USERS.ADMIN.username,
      TEST_CONFIG.USERS.ADMIN.password
    );
  }

  /**
   * Login as regular user
   */
  async loginAsUser() {
    await this.login(
      TEST_CONFIG.USERS.USER.username,
      TEST_CONFIG.USERS.USER.password
    );
  }

  /**
   * Login with custom credentials
   */
  async login(username: string, password: string) {
    await this.page.goto('/');

    // Fill login form
    await this.page.fill('input[name="username"], input[placeholder*="Username" i]', username);
    await this.page.fill('input[name="password"], input[type="password"]', password);

    // Submit
    await this.page.click('button[type="submit"], button:has-text("Login")');

    // Wait for successful login (redirect to calendar)
    await this.page.waitForURL(/.*\/(calendar|dashboard)?/);
  }

  /**
   * Logout current user
   */
  async logout() {
    // Click logout button (adjust selector based on your UI)
    await this.page.click('button:has-text("Logout"), [data-testid="logout-button"]');

    // Wait for redirect to login page
    await this.page.waitForURL(/.*\/(login)?/);
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    const token = await this.page.evaluate(() => localStorage.getItem('authToken'));
    return !!token;
  }

  /**
   * Get current user from localStorage
   */
  async getCurrentUser(): Promise<{ username: string; role: string } | null> {
    const username = await this.page.evaluate(() => localStorage.getItem('username'));
    const role = await this.page.evaluate(() => localStorage.getItem('userRole'));

    if (!username) return null;

    return { username, role: role || 'user' };
  }
}
```

## Files to Create

- ✨ `frontend/e2e/setup/test-data-factory.ts` (main factory)
- ✨ `frontend/e2e/setup/auth-helper.ts` (authentication utilities)

## Expected Outcome

✅ Test data factory that can generate:
- Realistic user profiles
- Calendar events with proper dates
- Automation rules with conditions/actions
- Reservations, resources, organisations
- Recurrence patterns

✅ Reusable authentication helper for login/logout

✅ Can import and use in tests:
```typescript
import { createTestEvent, createTestUser } from './setup/test-data-factory';

const event = createTestEvent({ title: 'Custom Title' });
const user = createTestUser({ email: 'test@example.com' });
```

## Testing the Implementation

Create a test file `frontend/e2e/test-data.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { createTestEvent, createTestUser, createTestCalendar } from './setup/test-data-factory';

test.describe('Test Data Factory', () => {
  test('generates valid user data', () => {
    const user = createTestUser();
    expect(user.username).toBeTruthy();
    expect(user.email).toContain('@');
    expect(user.password.length).toBeGreaterThan(8);
  });

  test('generates valid event data', () => {
    const event = createTestEvent();
    expect(event.title).toBeTruthy();
    expect(new Date(event.startDate)).toBeInstanceOf(Date);
    expect(new Date(event.endDate) > new Date(event.startDate)).toBe(true);
  });

  test('accepts overrides', () => {
    const event = createTestEvent({ title: 'My Custom Event' });
    expect(event.title).toBe('My Custom Event');
  });
});
```

Run:
```bash
npm run test:e2e test-data.spec.ts
```

## Estimated Time
⏱️ **30-45 minutes**

## Next Task
[test_04_page_object_models.md](./test_04_page_object_models.md) - Create Page Object Models for reusable UI interactions
