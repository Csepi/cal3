# Test Task 15: Accessibility Tests

## Description
Validate WCAG AA compliance including keyboard navigation, screen reader support, color contrast, and ARIA attributes.

## Prerequisites
- ✅ Completed test_01-14
- Install axe-core: `npm install -D @axe-core/playwright`

## Implementation Steps

### `frontend/e2e/accessibility/keyboard-navigation.spec.ts`
```typescript
import { test, expect } from '@playwright/test';
import { createPages } from '../pages';

test.describe('Keyboard Navigation', () => {
  test('can navigate login form with keyboard', async ({ page }) => {
    await page.goto('/');

    // Tab to username field
    await page.keyboard.press('Tab');
    let focused = await page.evaluate(() => document.activeElement?.getAttribute('name'));
    expect(focused).toBe('username');

    // Tab to password field
    await page.keyboard.press('Tab');
    focused = await page.evaluate(() => document.activeElement?.getAttribute('name'));
    expect(focused).toBe('password');

    // Tab to submit button
    await page.keyboard.press('Tab');
    focused = await page.evaluate(() => document.activeElement?.getAttribute('type'));
    expect(focused).toBe('submit');

    // Enter to submit
    await page.keyboard.press('Enter');
  });

  test('can navigate calendar with keyboard', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.calendar.goto();

    // Tab through calendar controls
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Check if focusable elements are highlighted
    const hasFocus = await page.evaluate(() => {
      const active = document.activeElement;
      return active?.tagName === 'BUTTON' || active?.tagName === 'A';
    });

    expect(hasFocus).toBeTruthy();
  });

  test('escape key closes modals', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.calendar.goto();

    await pages.calendar.openCreateEventModal();
    await page.keyboard.press('Escape');

    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('enter key activates buttons', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.calendar.goto();

    await page.focus('button:has-text("Create Event")');
    await page.keyboard.press('Enter');

    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('arrow keys navigate dropdowns', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.profile.goto();

    await page.focus('select[name="timezone"]');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // Timezone should be changed
  });
});
```

### `frontend/e2e/accessibility/screen-reader.spec.ts`
```typescript
import { test, expect } from '@playwright/test';

test.describe('Screen Reader Support', () => {
  test('all buttons have accessible labels', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.calendar.goto();

    const buttons = await page.locator('button').all();

    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      const title = await button.getAttribute('title');

      // Button must have either text content, aria-label, or title
      expect(ariaLabel || text?.trim() || title).toBeTruthy();
    }
  });

  test('images have alt text', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.calendar.goto();

    const images = await page.locator('img').all();

    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });

  test('form inputs have labels', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.calendar.goto();
    await pages.calendar.openCreateEventModal();

    const inputs = await page.locator('input, textarea, select').all();

    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      // Input must have associated label via id, aria-label, or aria-labelledby
      const hasLabel = id ? await page.locator(`label[for="${id}"]`).count() > 0 : false;

      expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
    }
  });

  test('links have descriptive text', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();

    const links = await page.locator('a').all();

    for (const link of links) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');

      expect(text?.trim() || ariaLabel).toBeTruthy();

      // Avoid generic link text
      const linkText = (text || ariaLabel || '').toLowerCase();
      expect(linkText).not.toBe('click here');
      expect(linkText).not.toBe('read more');
    }
  });

  test('modals have aria-modal and role="dialog"', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.calendar.goto();
    await pages.calendar.openCreateEventModal();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    const ariaModal = await modal.getAttribute('aria-modal');
    expect(ariaModal).toBe('true');
  });

  test('interactive elements have proper ARIA roles', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.automation.goto();

    // Check for proper roles on interactive elements
    const tabs = await page.locator('[role="tab"]').count();
    const tabpanels = await page.locator('[role="tabpanel"]').count();

    if (tabs > 0) {
      expect(tabpanels).toBeGreaterThan(0);
    }
  });
});
```

### `frontend/e2e/accessibility/color-contrast.spec.ts`
```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Color Contrast', () => {
  test('all pages meet WCAG AA contrast requirements', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();

    const routes = ['/calendar', '/profile', '/automation', '/sync'];

    for (const route of routes) {
      await page.goto(route);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations.filter(v =>
        v.id === 'color-contrast'
      )).toHaveLength(0);
    }
  });

  test('theme colors maintain sufficient contrast', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.profile.goto();

    const themeColors = ['#ef4444', '#10b981', '#3b82f6', '#8b5cf6'];

    for (const color of themeColors) {
      await pages.profile.changeTheme(color);
      await pages.calendar.goto();

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .analyze();

      const contrastViolations = accessibilityScanResults.violations.filter(v =>
        v.id === 'color-contrast'
      );

      expect(contrastViolations).toHaveLength(0);
    }
  });
});
```

### `frontend/e2e/accessibility/axe-audit.spec.ts`
```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Automated Accessibility Audit', () => {
  test('homepage has no accessibility violations', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('calendar page has no accessibility violations', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.calendar.goto();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('automation page has no accessibility violations', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.automation.goto();

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('profile page has no accessibility violations', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.profile.goto();

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
```

## Files to Create (4 files)
- `keyboard-navigation.spec.ts`
- `screen-reader.spec.ts`
- `color-contrast.spec.ts`
- `axe-audit.spec.ts`

## Expected Outcome
✅ WCAG AA compliance validated
✅ Full keyboard navigation support
✅ Screen reader compatibility
✅ Color contrast requirements met
✅ Proper ARIA attributes

## Estimated Time
⏱️ **2-3 hours**

## Next Task
[test_16_performance_tests.md](./test_16_performance_tests.md)
