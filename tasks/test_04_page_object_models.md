# Test Task 04: Create Page Object Models

## Description
Implement Page Object Model (POM) pattern to create reusable, maintainable abstractions for UI interactions across all major pages in the application.

## Prerequisites
- ✅ Completed [test_01_setup_playwright.md](./test_01_setup_playwright.md)
- ✅ Completed [test_02_create_config.md](./test_02_create_config.md)
- ✅ Completed [test_03_test_data_factory.md](./test_03_test_data_factory.md)

## Why Page Object Models?

Instead of writing:
```typescript
await page.click('button:has-text("Create Event")');
await page.fill('#event-title', 'My Event');
// ... repeated across 50 tests
```

Write:
```typescript
await calendarPage.createEvent({ title: 'My Event' });
// Reusable, readable, maintainable
```

## Implementation Steps

### 1. Create Base Page Class

Create `frontend/e2e/pages/BasePage.ts`:

```typescript
import { Page, Locator } from '@playwright/test';

/**
 * Base Page Object
 * Common functionality shared across all pages
 */
export class BasePage {
  constructor(protected page: Page) {}

  /**
   * Navigate to a specific path
   */
  async goto(path: string = '/') {
    await this.page.goto(path);
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    return await this.page.isVisible(selector);
  }

  /**
   * Get text content
   */
  async getText(selector: string): Promise<string> {
    return await this.page.textContent(selector) || '';
  }

  /**
   * Click with wait
   */
  async clickAndWait(selector: string) {
    await this.page.click(selector);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Fill form field
   */
  async fillField(selector: string, value: string) {
    await this.page.fill(selector, value);
  }

  /**
   * Select dropdown option
   */
  async selectOption(selector: string, value: string) {
    await this.page.selectOption(selector, value);
  }

  /**
   * Wait for toast/notification message
   */
  async waitForNotification(text?: string) {
    if (text) {
      await this.page.waitForSelector(`text=${text}`);
    } else {
      await this.page.waitForSelector('[role="alert"], .toast, .notification');
    }
  }

  /**
   * Get all console errors
   */
  async getConsoleErrors(): Promise<string[]> {
    const errors: string[] = [];
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    return errors;
  }
}
```

### 2. Login Page Object

Create `frontend/e2e/pages/LoginPage.ts`:

```typescript
import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { TEST_CONFIG } from '../setup/test-config';

export class LoginPage extends BasePage {
  // Locators
  private usernameInput = () => this.page.locator('input[name="username"], input[placeholder*="Username" i]');
  private passwordInput = () => this.page.locator('input[type="password"]');
  private loginButton = () => this.page.locator('button[type="submit"], button:has-text("Login")');
  private errorMessage = () => this.page.locator('.error-message, [role="alert"]');

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await super.goto('/');
  }

  /**
   * Perform login
   */
  async login(username: string, password: string) {
    await this.usernameInput().fill(username);
    await this.passwordInput().fill(password);
    await this.loginButton().click();
    await this.page.waitForURL(/.*\/(calendar|dashboard).*/);
  }

  /**
   * Login as admin
   */
  async loginAsAdmin() {
    await this.login(
      TEST_CONFIG.USERS.ADMIN.username,
      TEST_CONFIG.USERS.ADMIN.password
    );
  }

  /**
   * Login as user
   */
  async loginAsUser() {
    await this.login(
      TEST_CONFIG.USERS.USER.username,
      TEST_CONFIG.USERS.USER.password
    );
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string> {
    return await this.errorMessage().textContent() || '';
  }

  /**
   * Check if login failed
   */
  async hasError(): Promise<boolean> {
    return await this.errorMessage().isVisible();
  }
}
```

### 3. Calendar Page Object

Create `frontend/e2e/pages/CalendarPage.ts`:

```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { TestEvent } from '../setup/test-data-factory';

export class CalendarPage extends BasePage {
  // Navigation buttons
  private monthViewButton = () => this.page.locator('button:has-text("Month")');
  private weekViewButton = () => this.page.locator('button:has-text("Week")');
  private createEventButton = () => this.page.locator('button:has-text("Create Event"), button:has-text("New Event")');

  // Event modal
  private eventModal = () => this.page.locator('[role="dialog"], .modal');
  private eventTitleInput = () => this.eventModal().locator('input[name="title"], input[placeholder*="Title" i]');
  private eventDescriptionInput = () => this.eventModal().locator('textarea[name="description"]');
  private eventStartInput = () => this.eventModal().locator('input[name="startDate"]');
  private eventEndInput = () => this.eventModal().locator('input[name="endDate"]');
  private saveEventButton = () => this.eventModal().locator('button:has-text("Save"), button:has-text("Create")');
  private cancelButton = () => this.eventModal().locator('button:has-text("Cancel")');

  // Calendar views
  private monthGrid = () => this.page.locator('.month-view, [data-view="month"]');
  private weekGrid = () => this.page.locator('.week-view, [data-view="week"]');

  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await super.goto('/calendar');
  }

  /**
   * Switch to month view
   */
  async switchToMonthView() {
    await this.monthViewButton().click();
    await this.monthGrid().waitFor({ state: 'visible' });
  }

  /**
   * Switch to week view
   */
  async switchToWeekView() {
    await this.weekViewButton().click();
    await this.weekGrid().waitFor({ state: 'visible' });
  }

  /**
   * Open create event modal
   */
  async openCreateEventModal() {
    await this.createEventButton().click();
    await this.eventModal().waitFor({ state: 'visible' });
  }

  /**
   * Create a new event
   */
  async createEvent(event: Partial<TestEvent>) {
    await this.openCreateEventModal();

    if (event.title) {
      await this.eventTitleInput().fill(event.title);
    }

    if (event.description) {
      await this.eventDescriptionInput().fill(event.description);
    }

    if (event.startDate) {
      await this.eventStartInput().fill(event.startDate);
    }

    if (event.endDate) {
      await this.eventEndInput().fill(event.endDate);
    }

    await this.saveEventButton().click();
    await this.eventModal().waitFor({ state: 'hidden' });
  }

  /**
   * Click on an event in the calendar
   */
  async clickEvent(eventTitle: string) {
    await this.page.locator(`.event:has-text("${eventTitle}"), [data-event-title="${eventTitle}"]`).first().click();
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventTitle: string) {
    await this.clickEvent(eventTitle);
    await this.page.locator('button:has-text("Delete")').click();
    await this.page.locator('button:has-text("Confirm"), button:has-text("Yes")').click();
  }

  /**
   * Get all visible events
   */
  async getVisibleEvents(): Promise<string[]> {
    const events = await this.page.locator('.event-title, .event-name').allTextContents();
    return events;
  }

  /**
   * Drag to create event in week view (time range selection)
   */
  async dragCreateEvent(day: number, startHour: number, endHour: number) {
    const dayColumn = this.page.locator(`.week-day-column[data-day="${day}"]`);
    const startCell = dayColumn.locator(`[data-hour="${startHour}"]`);
    const endCell = dayColumn.locator(`[data-hour="${endHour}"]`);

    const startBox = await startCell.boundingBox();
    const endBox = await endCell.boundingBox();

    if (startBox && endBox) {
      await this.page.mouse.move(startBox.x + startBox.width / 2, startBox.y + startBox.height / 2);
      await this.page.mouse.down();
      await this.page.mouse.move(endBox.x + endBox.width / 2, endBox.y + endBox.height / 2);
      await this.page.mouse.up();
    }
  }
}
```

### 4. Automation Page Object

Create `frontend/e2e/pages/AutomationPage.ts`:

```typescript
import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class AutomationPage extends BasePage {
  // Panel controls
  private automationTab = () => this.page.locator('button:has-text("Automation"), [data-tab="automation"]');
  private createRuleButton = () => this.page.locator('button:has-text("Create Rule"), button:has-text("New Rule")');

  // Rule list
  private rulesList = () => this.page.locator('.automation-rules-list, [data-testid="rules-list"]');
  private ruleCard = (ruleName: string) => this.page.locator(`.rule-card:has-text("${ruleName}")`);

  // Rule form
  private ruleNameInput = () => this.page.locator('input[name="name"], input[placeholder*="Rule name" i]');
  private ruleDescriptionInput = () => this.page.locator('textarea[name="description"]');
  private triggerSelect = () => this.page.locator('select[name="trigger"], [data-field="trigger"]');
  private addConditionButton = () => this.page.locator('button:has-text("Add Condition")');
  private addActionButton = () => this.page.locator('button:has-text("Add Action")');
  private saveRuleButton = () => this.page.locator('button:has-text("Save Rule"), button:has-text("Create")');

  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await super.goto('/');
    await this.automationTab().click();
  }

  /**
   * Open create rule modal/form
   */
  async openCreateRule() {
    await this.createRuleButton().click();
  }

  /**
   * Create a new automation rule
   */
  async createRule(name: string, trigger: string) {
    await this.openCreateRule();
    await this.ruleNameInput().fill(name);
    await this.triggerSelect().selectOption(trigger);
    await this.saveRuleButton().click();
  }

  /**
   * Add condition to rule
   */
  async addCondition(field: string, operator: string, value: string) {
    await this.addConditionButton().click();
    await this.page.locator('select[name="condition.field"]').last().selectOption(field);
    await this.page.locator('select[name="condition.operator"]').last().selectOption(operator);
    await this.page.locator('input[name="condition.value"]').last().fill(value);
  }

  /**
   * Add action to rule
   */
  async addAction(type: string, params: Record<string, string>) {
    await this.addActionButton().click();
    await this.page.locator('select[name="action.type"]').last().selectOption(type);

    for (const [key, value] of Object.entries(params)) {
      await this.page.locator(`input[name="action.${key}"]`).last().fill(value);
    }
  }

  /**
   * Toggle rule enabled/disabled
   */
  async toggleRule(ruleName: string) {
    await this.ruleCard(ruleName).locator('button:has-text("Enable"), button:has-text("Disable")').click();
  }

  /**
   * Delete rule
   */
  async deleteRule(ruleName: string) {
    await this.ruleCard(ruleName).locator('button:has-text("Delete")').click();
    await this.page.locator('button:has-text("Confirm")').click();
  }

  /**
   * Get all rule names
   */
  async getAllRuleNames(): Promise<string[]> {
    return await this.page.locator('.rule-card .rule-name, .rule-title').allTextContents();
  }
}
```

### 5. Profile Page Object

Create `frontend/e2e/pages/ProfilePage.ts`:

```typescript
import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProfilePage extends BasePage {
  private profileTab = () => this.page.locator('button:has-text("Profile"), [data-tab="profile"]');
  private firstNameInput = () => this.page.locator('input[name="firstName"]');
  private lastNameInput = () => this.page.locator('input[name="lastName"]');
  private timezoneSelect = () => this.page.locator('select[name="timezone"]');
  private themeColorSelect = () => this.page.locator('select[name="themeColor"], [data-field="theme-color"]');
  private hourFormatSelect = () => this.page.locator('select[name="hourFormat"]');
  private saveButton = () => this.page.locator('button:has-text("Save"), button:has-text("Update")');

  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await super.goto('/');
    await this.profileTab().click();
  }

  /**
   * Update profile information
   */
  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
    timezone?: string;
    themeColor?: string;
    hourFormat?: string;
  }) {
    if (data.firstName) await this.firstNameInput().fill(data.firstName);
    if (data.lastName) await this.lastNameInput().fill(data.lastName);
    if (data.timezone) await this.timezoneSelect().selectOption(data.timezone);
    if (data.themeColor) await this.themeColorSelect().selectOption(data.themeColor);
    if (data.hourFormat) await this.hourFormatSelect().selectOption(data.hourFormat);

    await this.saveButton().click();
    await this.waitForNotification();
  }

  /**
   * Change theme color
   */
  async changeTheme(color: string) {
    await this.themeColorSelect().selectOption(color);
    await this.saveButton().click();
  }

  /**
   * Get current theme color
   */
  async getCurrentTheme(): Promise<string> {
    return await this.themeColorSelect().inputValue();
  }
}
```

### 6. Admin Page Object

Create `frontend/e2e/pages/AdminPage.ts`:

```typescript
import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class AdminPage extends BasePage {
  private adminTab = () => this.page.locator('button:has-text("Admin"), [data-tab="admin"]');
  private usersTab = () => this.page.locator('button:has-text("Users")');
  private userRow = (username: string) => this.page.locator(`tr:has-text("${username}")`);

  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await super.goto('/');
    await this.adminTab().click();
  }

  /**
   * Navigate to users management
   */
  async gotoUsers() {
    await this.goto();
    await this.usersTab().click();
  }

  /**
   * Search for user
   */
  async searchUser(query: string) {
    await this.page.locator('input[name="search"], input[placeholder*="Search" i]').fill(query);
  }

  /**
   * Get user role
   */
  async getUserRole(username: string): Promise<string> {
    return await this.userRow(username).locator('.user-role, [data-field="role"]').textContent() || '';
  }

  /**
   * Change user role
   */
  async changeUserRole(username: string, newRole: string) {
    await this.userRow(username).locator('button:has-text("Edit")').click();
    await this.page.locator('select[name="role"]').selectOption(newRole);
    await this.page.locator('button:has-text("Save")').click();
  }
}
```

### 7. Create Page Factory

Create `frontend/e2e/pages/index.ts`:

```typescript
import { Page } from '@playwright/test';
import { LoginPage } from './LoginPage';
import { CalendarPage } from './CalendarPage';
import { AutomationPage } from './AutomationPage';
import { ProfilePage } from './ProfilePage';
import { AdminPage } from './AdminPage';

/**
 * Page Object Factory
 * Centralizes creation of all page objects
 */
export class Pages {
  login: LoginPage;
  calendar: CalendarPage;
  automation: AutomationPage;
  profile: ProfilePage;
  admin: AdminPage;

  constructor(page: Page) {
    this.login = new LoginPage(page);
    this.calendar = new CalendarPage(page);
    this.automation = new AutomationPage(page);
    this.profile = new ProfilePage(page);
    this.admin = new AdminPage(page);
  }
}

/**
 * Helper to create all page objects
 */
export const createPages = (page: Page): Pages => {
  return new Pages(page);
};
```

## Files to Create

- ✨ `frontend/e2e/pages/BasePage.ts`
- ✨ `frontend/e2e/pages/LoginPage.ts`
- ✨ `frontend/e2e/pages/CalendarPage.ts`
- ✨ `frontend/e2e/pages/AutomationPage.ts`
- ✨ `frontend/e2e/pages/ProfilePage.ts`
- ✨ `frontend/e2e/pages/AdminPage.ts`
- ✨ `frontend/e2e/pages/index.ts` (factory)

## Expected Outcome

✅ Reusable page objects for all major pages
✅ Consistent API for UI interactions
✅ Easy to maintain selector changes in one place
✅ Readable tests using page objects

## Usage Example

```typescript
import { test, expect } from '@playwright/test';
import { createPages } from './pages';

test('create event using page object', async ({ page }) => {
  const pages = createPages(page);

  await pages.login.loginAsUser();
  await pages.calendar.goto();
  await pages.calendar.createEvent({
    title: 'Team Meeting',
    description: 'Weekly sync',
  });

  const events = await pages.calendar.getVisibleEvents();
  expect(events).toContain('Team Meeting');
});
```

## Estimated Time
⏱️ **1-2 hours**

## Next Task
[test_05_smoke_tests.md](./test_05_smoke_tests.md) - Create critical smoke tests
