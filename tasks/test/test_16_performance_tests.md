# Test Task 16: Performance Tests

## Description
Validate application performance including page load times, rendering speed, memory usage, and handling large datasets.

## Prerequisites
- ✅ Completed test_01-15

## Implementation Steps

### `frontend/e2e/performance/page-load-times.spec.ts`
```typescript
import { test, expect } from '@playwright/test';
import { createPages } from '../pages';

test.describe('Page Load Times', () => {
  test('homepage loads in under 3 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    console.log(`Homepage load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });

  test('calendar page loads in under 3 seconds', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();

    const startTime = Date.now();

    await pages.calendar.goto();
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    console.log(`Calendar load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });

  test('automation page loads in under 3 seconds', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();

    const startTime = Date.now();

    await pages.automation.goto();
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    console.log(`Automation load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });

  test('measures Core Web Vitals', async ({ page }) => {
    await page.goto('/');

    const metrics = await page.evaluate(() => {
      return new Promise<any>((resolve) => {
        if ('PerformanceObserver' in window) {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const vitals: any = {};

            entries.forEach((entry: any) => {
              if (entry.entryType === 'navigation') {
                vitals.domContentLoaded = entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart;
                vitals.loadComplete = entry.loadEventEnd - entry.loadEventStart;
              }
              if (entry.entryType === 'paint') {
                if (entry.name === 'first-contentful-paint') {
                  vitals.fcp = entry.startTime;
                }
              }
            });

            resolve(vitals);
          });

          observer.observe({ entryTypes: ['navigation', 'paint'] });

          setTimeout(() => resolve({}), 5000);
        } else {
          resolve({});
        }
      });
    });

    console.log('Core Web Vitals:', metrics);

    if (metrics.fcp) {
      expect(metrics.fcp).toBeLessThan(1800); // FCP < 1.8s is good
    }
  });
});
```

### `frontend/e2e/performance/event-rendering.spec.ts`
```typescript
import { test, expect } from '@playwright/test';
import { createPages } from '../pages';
import { createTestEvent, createMultiple } from '../setup/test-data-factory';

test.describe('Event Rendering Performance', () => {
  test('renders 100 events efficiently', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.calendar.goto();

    // Create 100 events via API
    const events = createMultiple(createTestEvent, 100);

    // Measure rendering time
    const startTime = Date.now();

    for (const event of events) {
      await pages.calendar.createEvent(event);
    }

    const renderTime = Date.now() - startTime;

    console.log(`Rendered 100 events in ${renderTime}ms`);
    expect(renderTime).toBeLessThan(30000); // Under 30 seconds
  });

  test('calendar view switches quickly with many events', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.calendar.goto();

    // Switch to week view
    const startTime = Date.now();
    await pages.calendar.switchToWeekView();
    const switchTime = Date.now() - startTime;

    console.log(`View switch time: ${switchTime}ms`);
    expect(switchTime).toBeLessThan(1000); // Under 1 second
  });

  test('scrolling calendar is smooth', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.calendar.goto();
    await pages.calendar.switchToWeekView();

    const startTime = Date.now();

    // Scroll through week view
    await page.evaluate(() => {
      const scrollContainer = document.querySelector('.week-view, .calendar-scroll');
      if (scrollContainer) {
        scrollContainer.scrollTop = 500;
      }
    });

    const scrollTime = Date.now() - startTime;

    console.log(`Scroll time: ${scrollTime}ms`);
    expect(scrollTime).toBeLessThan(500); // Instant response
  });
});
```

### `frontend/e2e/performance/memory-leaks.spec.ts`
```typescript
import { test, expect } from '@playwright/test';
import { createPages } from '../pages';

test.describe('Memory Leak Detection', () => {
  test('no memory leaks on repeated navigation', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();

    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    // Navigate between pages 10 times
    for (let i = 0; i < 10; i++) {
      await pages.calendar.goto();
      await pages.profile.goto();
      await pages.automation.goto();
    }

    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    if (initialMemory > 0 && finalMemory > 0) {
      const memoryIncrease = finalMemory - initialMemory;
      const increasePercent = (memoryIncrease / initialMemory) * 100;

      console.log(`Memory increase: ${memoryIncrease} bytes (${increasePercent.toFixed(2)}%)`);

      // Memory shouldn't increase by more than 50%
      expect(increasePercent).toBeLessThan(50);
    }
  });

  test('no memory leaks on modal open/close', async ({ page }) => {
    const pages = createPages(page);
    await pages.login.loginAsUser();
    await pages.calendar.goto();

    const initialMemory = await page.evaluate(() =>
      (performance as any).memory?.usedJSHeapSize || 0
    );

    // Open and close modal 20 times
    for (let i = 0; i < 20; i++) {
      await pages.calendar.openCreateEventModal();
      await page.click('button:has-text("Cancel")');
    }

    const finalMemory = await page.evaluate(() =>
      (performance as any).memory?.usedJSHeapSize || 0
    );

    if (initialMemory > 0 && finalMemory > 0) {
      const memoryIncrease = finalMemory - initialMemory;
      const increasePercent = (memoryIncrease / initialMemory) * 100;

      console.log(`Memory increase after 20 modal cycles: ${increasePercent.toFixed(2)}%`);
      expect(increasePercent).toBeLessThan(30);
    }
  });
});
```

### `frontend/e2e/performance/api-response-times.spec.ts`
```typescript
import { test, expect } from '@playwright/test';

test.describe('API Response Times', () => {
  test('GET /api/events responds quickly', async ({ request }) => {
    // Login first
    const loginResponse = await request.post('http://localhost:8081/api/auth/login', {
      data: { username: 'testuser', password: 'password123' },
    });
    const { token } = await loginResponse.json();

    const startTime = Date.now();

    const response = await request.get('http://localhost:8081/api/events', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const responseTime = Date.now() - startTime;

    console.log(`API response time: ${responseTime}ms`);
    expect(response.ok()).toBeTruthy();
    expect(responseTime).toBeLessThan(1000); // Under 1 second
  });

  test('POST /api/events responds quickly', async ({ request }) => {
    const loginResponse = await request.post('http://localhost:8081/api/auth/login', {
      data: { username: 'testuser', password: 'password123' },
    });
    const { token } = await loginResponse.json();

    const startTime = Date.now();

    const response = await request.post('http://localhost:8081/api/events', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title: 'Performance Test Event',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 3600000).toISOString(),
      },
    });

    const responseTime = Date.now() - startTime;

    console.log(`POST API response time: ${responseTime}ms`);
    expect(response.ok()).toBeTruthy();
    expect(responseTime).toBeLessThan(1500); // Under 1.5 seconds
  });

  test('complex automation rule query responds quickly', async ({ request }) => {
    const loginResponse = await request.post('http://localhost:8081/api/auth/login', {
      data: { username: 'testuser', password: 'password123' },
    });
    const { token } = await loginResponse.json();

    const startTime = Date.now();

    const response = await request.get('http://localhost:8081/api/automation/rules?page=1&limit=20', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const responseTime = Date.now() - startTime;

    console.log(`Automation rules API response time: ${responseTime}ms`);
    expect(response.ok()).toBeTruthy();
    expect(responseTime).toBeLessThan(1000);
  });
});
```

### `frontend/e2e/performance/bundle-size.spec.ts`
```typescript
import { test, expect } from '@playwright/test';

test.describe('Bundle Size', () => {
  test('JavaScript bundle size is reasonable', async ({ page }) => {
    const resources: { url: string; size: number }[] = [];

    page.on('response', async (response) => {
      if (response.url().endsWith('.js')) {
        const buffer = await response.body().catch(() => null);
        if (buffer) {
          resources.push({
            url: response.url(),
            size: buffer.length,
          });
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const totalSize = resources.reduce((sum, r) => sum + r.size, 0);
    const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);

    console.log(`Total JS bundle size: ${totalSizeMB} MB`);
    console.log('Individual bundles:', resources);

    // Total JS should be under 5MB
    expect(totalSize).toBeLessThan(5 * 1024 * 1024);
  });
});
```

## Files to Create (5 files)
- `page-load-times.spec.ts`
- `event-rendering.spec.ts`
- `memory-leaks.spec.ts`
- `api-response-times.spec.ts`
- `bundle-size.spec.ts`

## Expected Outcome
✅ Page load times under 3 seconds
✅ API responses under 1 second
✅ Smooth rendering with 100+ events
✅ No memory leaks detected
✅ Bundle size optimized

## Estimated Time
⏱️ **2-3 hours**

## Next Task
[test_17_visual_regression_tests.md](./test_17_visual_regression_tests.md)
