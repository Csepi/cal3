# Test Task 02: Create Playwright Configuration

## Description
Create a comprehensive Playwright configuration file that supports multiple browsers, parallel execution, retries, screenshots, videos, and proper test environments.

## Prerequisites
- ✅ Completed [test_01_setup_playwright.md](./test_01_setup_playwright.md)
- Playwright installed
- Test directory structure created

## Implementation Steps

### 1. Create Playwright Config File
Create `frontend/playwright.config.ts` with the following configuration.

### 2. Configuration Content

```typescript
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Cal3 Calendar Application E2E Tests
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: './e2e',

  // Maximum time one test can run (30 seconds)
  timeout: 30 * 1000,

  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  // Shared settings for all tests
  use: {
    // Base URL for tests
    baseURL: 'http://localhost:8080',

    // Screenshot and video settings
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',

    // Browser context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,

    // Timeout for each action (e.g., click, fill)
    actionTimeout: 10 * 1000,

    // Timeout for navigation
    navigationTimeout: 15 * 1000,
  },

  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Additional Chrome-specific settings
        launchOptions: {
          args: ['--disable-web-security'], // For CORS in tests
        },
      },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
    },

    // Mobile testing
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
      },
    },

    // Tablet testing
    {
      name: 'tablet',
      use: {
        ...devices['iPad Pro'],
      },
    },
  ],

  // Web server configuration
  // Automatically start dev servers before running tests
  webServer: [
    {
      command: 'cd ../backend-nestjs && PORT=8081 JWT_SECRET="calendar-secret-key" npm run start:dev',
      url: 'http://localhost:8081/api/docs',
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'npm run dev -- --port 8080',
      url: 'http://localhost:8080',
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],

  // Global setup and teardown
  // globalSetup: './e2e/setup/global-setup.ts',
  // globalTeardown: './e2e/setup/global-teardown.ts',
});
```

### 3. Create Environment-Specific Config (Optional)

Create `frontend/.env.test`:
```env
# Test environment variables
VITE_API_URL=http://localhost:8081
NODE_ENV=test
```

### 4. Create Test Configuration Constants

Create `frontend/e2e/setup/test-config.ts`:
```typescript
/**
 * Centralized test configuration constants
 */
export const TEST_CONFIG = {
  // URLs
  BASE_URL: 'http://localhost:8080',
  API_URL: 'http://localhost:8081',

  // Timeouts (in milliseconds)
  TIMEOUT: {
    SHORT: 5000,      // Quick actions
    MEDIUM: 10000,    // API calls
    LONG: 30000,      // Complex operations
  },

  // Test users
  USERS: {
    ADMIN: {
      username: 'admin',
      password: 'admin123',
      role: 'admin',
    },
    USER: {
      username: 'testuser',
      password: 'password123',
      role: 'user',
    },
  },

  // Test data
  TEST_DATA: {
    EVENT_TITLE_PREFIX: 'E2E Test Event',
    CALENDAR_NAME_PREFIX: 'E2E Test Calendar',
    AUTOMATION_RULE_PREFIX: 'E2E Test Rule',
  },

  // Feature flags
  FEATURES: {
    SKIP_SLOW_TESTS: process.env.SKIP_SLOW === 'true',
    MOBILE_TESTS: process.env.MOBILE_TESTS === 'true',
  },
};
```

### 5. Update TypeScript Configuration

Add to `frontend/tsconfig.json` (or create `tsconfig.e2e.json`):
```json
{
  "extends": "./tsconfig.app.json",
  "include": ["e2e/**/*.ts"],
  "compilerOptions": {
    "types": ["node", "@playwright/test"]
  }
}
```

## Files to Create/Modify

### Create:
- `frontend/playwright.config.ts` ✨ Main configuration
- `frontend/.env.test` (optional)
- `frontend/e2e/setup/test-config.ts` ✨ Test constants

### Modify:
- `frontend/tsconfig.json` (add Playwright types)

## Expected Outcome

✅ Playwright configured for:
- Multi-browser testing (Chrome, Firefox, Safari)
- Mobile and tablet viewports
- Automatic server startup (frontend:8080, backend:8081)
- Screenshot/video capture on failures
- Retry failed tests automatically
- Parallel test execution
- HTML and JSON reports

✅ Can run configuration check:
```bash
npx playwright test --list
```

## Testing the Implementation

### 1. Validate Configuration
```bash
cd frontend
npx playwright test --list
# Should output: "No tests found" (expected at this stage)
```

### 2. Test Server Auto-Start
```bash
npm run test:e2e
# Should start both backend (8081) and frontend (8080) servers
# Then report no tests found
```

### 3. Check Browser Installation
```bash
npx playwright show-report
# Should show empty report (no tests yet)
```

### 4. Test Configuration
Create a temporary test file `frontend/e2e/config-test.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test('configuration works', async ({ page }) => {
  await page.goto('/');
  expect(page.url()).toContain('localhost:8080');
});
```

Run:
```bash
npm run test:e2e
```

Delete the temp file after verification.

## Common Issues & Solutions

### Issue: Servers don't start
**Solution:** Ensure ports 8080 and 8081 are free:
```bash
netstat -ano | findstr :8080
netstat -ano | findstr :8081
```

### Issue: TypeScript errors in config
**Solution:** Install type definitions:
```bash
npm install -D @types/node
```

### Issue: Browsers not installed
**Solution:** Run installation again:
```bash
npx playwright install --with-deps
```

## Estimated Time
⏱️ **20-30 minutes**

## Next Task
[test_03_test_data_factory.md](./test_03_test_data_factory.md) - Create test data generation utilities
