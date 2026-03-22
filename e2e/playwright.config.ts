import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:4173';
const useLocalServer = process.env.E2E_USE_LOCAL_SERVER === 'true';

export default defineConfig({
  testDir: './web',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.03,
    },
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/playwright', open: 'never' }],
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 7'],
      },
    },
  ],
  webServer: useLocalServer
    ? {
        command:
          'npm --prefix ../frontend run dev -- --host 127.0.0.1 --port 4173 --strictPort',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
});
