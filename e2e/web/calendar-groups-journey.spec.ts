import { expect, test } from '@playwright/test';
import { installDefaultApiMocks, seedAuthenticatedSession } from './helpers/mockApi';

test.describe('Critical journey: calendar group management', () => {
  test('user can create, update, and delete a calendar group from the calendar screen', async ({
    page,
  }) => {
    const requestLog: Array<{ method: string; path: string; body?: unknown }> = [];
    const pageErrors: string[] = [];
    let createdGroupId: number | null = null;

    page.on('dialog', async (dialog) => {
      if (dialog.type() === 'prompt') {
        await dialog.accept('Ops Team');
        return;
      }
      await dialog.accept();
    });
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });
    page.on('request', async (request) => {
      const path = new URL(request.url()).pathname;
      if (!path.startsWith('/api/calendar-groups') && path !== '/api/calendars') {
        return;
      }

      let body: unknown;
      const rawBody = request.postData();
      if (rawBody) {
        try {
          body = JSON.parse(rawBody);
        } catch {
          body = rawBody;
        }
      }

      requestLog.push({
        method: request.method(),
        path,
        body,
      });
    });
    page.on('response', async (response) => {
      const path = new URL(response.url()).pathname;
      if (
        path === '/api/calendar-groups' &&
        response.request().method() === 'POST' &&
        response.status() === 200
      ) {
        const payload = (await response.json()) as { id?: number };
        createdGroupId = typeof payload.id === 'number' ? payload.id : null;
      }
    });

    await seedAuthenticatedSession(page);
    await installDefaultApiMocks(page, {
      startAuthenticated: true,
    });

    await page.goto('/app/calendar');
    await expect(page.getByRole('button', { name: /New Calendar/i })).toBeVisible();

    await page.getByRole('button', { name: /New Calendar/i }).click();
    await expect(page.getByRole('heading', { name: /Create New Calendar/i })).toBeVisible();

    await page.getByRole('button', { name: /^\+ New Group$/i }).click();

    await expect.poll(() => createdGroupId).not.toBeNull();
    const groupId = createdGroupId as number;
    await expect(page.getByRole('combobox')).toHaveValue(String(groupId));

    await page.getByLabel(/Calendar Name/i).fill('Ops Team Calendar');
    await page.getByRole('button', { name: /Create Calendar/i }).click();

    await expect(page.getByRole('button', { name: /^Ops Team Calendar$/i })).toBeVisible();

    await page.evaluate(async ({ groupId, name }) => {
      await fetch(`/api/calendar-groups/${groupId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          isVisible: false,
        }),
      });
    }, { groupId, name: 'Ops Platform' });

    await page.evaluate(async (nextGroupId) => {
      await fetch(`/api/calendar-groups/${nextGroupId}`, {
        method: 'DELETE',
      });
    }, groupId);

    await page.reload();
    await expect(page.getByRole('button', { name: /^Ops Team Calendar$/i })).toBeVisible();

    expect(requestLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          method: 'POST',
          path: '/api/calendar-groups',
          body: expect.objectContaining({
            name: 'Ops Team',
            isVisible: true,
          }),
        }),
        expect.objectContaining({
          method: 'PATCH',
          path: expect.stringMatching(/^\/api\/calendar-groups\/\d+$/),
          body: expect.objectContaining({
            name: 'Ops Platform',
            isVisible: false,
          }),
        }),
        expect.objectContaining({
          method: 'POST',
          path: '/api/calendars',
          body: expect.objectContaining({
            name: 'Ops Team Calendar',
            groupId,
          }),
        }),
        expect.objectContaining({
          method: 'DELETE',
          path: expect.stringMatching(/^\/api\/calendar-groups\/\d+$/),
        }),
      ]),
    );

    expect(pageErrors).toHaveLength(0);
  });
});
