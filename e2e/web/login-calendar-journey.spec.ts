import { expect, test } from '@playwright/test';
import { installDefaultApiMocks } from './helpers/mockApi';

test.describe('Critical journey: login + calendar', () => {
  test('user can sign in and complete calendar event create/update/delete flow', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    const eventRequestLog: Array<{ method: string; path: string }> = [];
    let createdEventId: number | null = null;
    const requestedPaths: string[] = [];

    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });
    page.on('request', (request) => {
      const path = new URL(request.url()).pathname;
      requestedPaths.push(path);
      if (path.startsWith('/api/events')) {
        eventRequestLog.push({ method: request.method(), path });
      }
    });
    page.on('response', async (response) => {
      const path = new URL(response.url()).pathname;
      if (
        path === '/api/events' &&
        response.request().method() === 'POST' &&
        response.status() === 201
      ) {
        const body = (await response.json()) as { id?: number };
        if (typeof body.id === 'number') {
          createdEventId = body.id;
        }
      }
    });
    page.on('dialog', (dialog) => dialog.accept());

    await installDefaultApiMocks(page);

    await page.goto('/app');

    await expect(page.getByLabel(/Email address \/ Username/i)).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();

    await page.getByLabel(/Email address \/ Username/i).fill('e2e_user');
    await page.getByLabel('Password').fill('ValidPass123');
    await page.getByRole('button', { name: /Sign in/i }).click();

    await expect(page.getByRole('button', { name: /Open profile menu/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Calendar', exact: true })).toBeVisible();
    await expect.poll(() => requestedPaths.some((path) => path === '/api/calendars')).toBeTruthy();
    await expect.poll(() => requestedPaths.some((path) => path === '/api/events')).toBeTruthy();

    await page.getByRole('button', { name: /New Event/i }).click();
    await page.getByTestId('event-modal-title').fill('Sprint planning deep dive');
    await page.getByTestId('event-modal-start-date').fill('2032-04-11');
    await page.getByTestId('event-modal-end-date').fill('2032-04-11');
    await page.getByTestId('event-modal-start-time').fill('14:00');
    await page.getByTestId('event-modal-end-time').fill('15:00');
    await page.getByTestId('event-modal-save').click();

    await expect.poll(() => createdEventId).not.toBeNull();
    await page.evaluate(async (eventId) => {
      await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: 'Sprint planning final' }),
      });
      await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });
    }, createdEventId);

    await expect
      .poll(() =>
        eventRequestLog.some(
          (entry) => entry.method === 'POST' && entry.path === '/api/events',
        ),
      )
      .toBeTruthy();
    await expect
      .poll(() =>
        eventRequestLog.some(
          (entry) =>
            entry.method === 'PATCH' &&
            /^\/api\/events\/\d+$/.test(entry.path),
        ),
      )
      .toBeTruthy();
    await expect
      .poll(() =>
        eventRequestLog.some(
          (entry) =>
            entry.method === 'DELETE' &&
            /^\/api\/events\/\d+$/.test(entry.path),
        ),
      )
      .toBeTruthy();

    expect(pageErrors).toHaveLength(0);
  });
});
