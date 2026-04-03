import { expect, test } from '@playwright/test';
import {
  installDefaultApiMocks,
  seedAuthenticatedSession,
} from './helpers/mockApi';

test.describe('Critical journey: tasks workspace', () => {
  test('authenticated user can create, update, and delete tasks through the workspace UI', async ({
    page,
  }) => {
    const taskRequestLog: Array<{ method: string; path: string }> = [];
    const pageErrors: string[] = [];

    page.on('request', (request) => {
      const path = new URL(request.url()).pathname;
      if (path.startsWith('/api/tasks')) {
        taskRequestLog.push({
          method: request.method(),
          path,
        });
      }
    });
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    await seedAuthenticatedSession(page);
    await installDefaultApiMocks(page, { startAuthenticated: true });

    await page.goto('/app');

    const tasksTab = page.getByTestId('nav-tasks');
    await expect(tasksTab).toBeVisible();
    await tasksTab.click();

    await expect(page.getByText('Draft API contract')).toBeVisible();
    await expect(page.getByText('Confirm booking policy')).toBeVisible();

    await page.getByTestId('tasks-search-input').fill('Confirm');
    await expect(page.getByText('Confirm booking policy')).toBeVisible();
    await expect(page.getByText('Draft API contract')).toHaveCount(0);
    await page.getByTestId('tasks-clear-filters').click();
    await expect(page.getByText('Draft API contract')).toBeVisible();

    await page.getByTestId('tasks-new-desktop').click();
    await page
      .getByTestId('task-composer-title')
      .fill('Ship release playbook');
    await page.getByTestId('task-composer-save').click();
    await expect(page.getByText('Ship release playbook')).toBeVisible();

    await page.getByText('Ship release playbook').click();
    await page.getByTestId('task-composer-status').selectOption('done');
    await page.getByTestId('task-composer-save').click();
    await expect(page.getByText('Ship release playbook')).toBeVisible();

    await page.getByText('Ship release playbook').click();
    await page.getByTestId('task-composer-delete').click();
    await expect(page.getByText('Ship release playbook')).toHaveCount(0);

    await expect
      .poll(() =>
        taskRequestLog.some(
          (entry) => entry.method === 'POST' && entry.path === '/api/tasks',
        ),
      )
      .toBeTruthy();
    await expect
      .poll(() =>
        taskRequestLog.some(
          (entry) =>
            entry.method === 'PATCH' && /^\/api\/tasks\/\d+$/.test(entry.path),
        ),
      )
      .toBeTruthy();
    await expect
      .poll(() =>
        taskRequestLog.some(
          (entry) =>
            entry.method === 'DELETE' && /^\/api\/tasks\/\d+$/.test(entry.path),
        ),
      )
      .toBeTruthy();

    expect(pageErrors).toHaveLength(0);
  });
});
