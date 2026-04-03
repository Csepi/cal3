import { expect, test } from '@playwright/test';
import {
  installDefaultApiMocks,
  seedAuthenticatedSession,
} from './helpers/mockApi';

test.describe('@mobile mobile locale journeys', () => {
  test('switches language on mobile and keeps localized flows across calendar, tasks, and bookings', async ({
    page,
  }, testInfo) => {
    const requestedPaths: string[] = [];

    test.skip(
      testInfo.project.name !== 'mobile-chrome',
      'Mobile locale journey only runs on mobile-chrome project',
    );
    page.on('request', (request) => {
      requestedPaths.push(new URL(request.url()).pathname);
    });

    await seedAuthenticatedSession(page);
    await installDefaultApiMocks(page, {
      startAuthenticated: true,
      resourceTypes: [
        {
          id: 501,
          name: 'Meeting Room',
          organisationId: 1,
          minBookingDuration: 30,
          bufferTime: 0,
        },
      ],
      resources: [
        {
          id: 801,
          name: 'Room A',
          capacity: 4,
          resourceType: {
            id: 501,
            name: 'Meeting Room',
            organisationId: 1,
            minBookingDuration: 30,
            bufferTime: 0,
          },
        },
      ],
      reservations: [
        {
          id: 9901,
          resourceId: 801,
          resource: {
            id: 801,
            name: 'Room A',
            capacity: 4,
            resourceType: {
              id: 501,
              name: 'Meeting Room',
              organisationId: 1,
              minBookingDuration: 30,
              bufferTime: 0,
            },
          },
          startTime: '2026-03-10T09:00:00.000Z',
          endTime: '2026-03-10T10:00:00.000Z',
          status: 'confirmed',
          quantity: 1,
          customerName: 'Locale Booker',
          customerEmail: 'locale@example.com',
        },
      ],
    });

    await page.goto('/app');

    const openProfile = page.getByRole('button', { name: /Open profile menu/i });
    await expect(openProfile).toBeVisible();
    await openProfile.click();

    const languageSwitcher = page.locator('[role="menu"] select');
    await expect(languageSwitcher).toHaveValue('en');

    await languageSwitcher.selectOption('de');
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expect.poll(async () =>
      page.evaluate(() => localStorage.getItem('primecal.profile.language')),
    ).toBe('de');
    await page.keyboard.press('Escape');

    await page.getByTestId('mobile-nav-tasks').click();
    await expect.poll(() => requestedPaths.includes('/api/tasks')).toBeTruthy();

    await page.goto('/app/reservations');
    await expect.poll(() => requestedPaths.includes('/api/reservations')).toBeTruthy();

    await page.goto('/app');
    await openProfile.click();
    await languageSwitcher.selectOption('fr');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect.poll(async () =>
      page.evaluate(() => localStorage.getItem('primecal.profile.language')),
    ).toBe('fr');
    await page.keyboard.press('Escape');

    await page.goto('/app/calendar');
    await expect.poll(() => requestedPaths.includes('/api/events')).toBeTruthy();
  });
});
