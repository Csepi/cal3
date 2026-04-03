import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  installDefaultApiMocks,
  seedAuthenticatedSession,
} from './helpers/mockApi';

const bookingResources = {
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
      capacity: 6,
      resourceType: {
        id: 501,
        name: 'Meeting Room',
        organisationId: 1,
        minBookingDuration: 30,
        bufferTime: 0,
      },
    },
  ],
};

const fillReservationForm = async (
  page: Page,
  payload: {
    date: string;
    start: string;
    end: string;
    quantity: string;
    customerName: string;
  },
) => {
  await page.getByTestId('reservation-open-create').click();
  await page.getByTestId('reservation-resource-select').selectOption('801');
  await page.getByTestId('reservation-date-input').fill(payload.date);
  await page.getByTestId('reservation-start-time-input').fill(payload.start);
  await page.getByTestId('reservation-end-time-input').fill(payload.end);
  await page.getByTestId('reservation-quantity-input').fill(payload.quantity);
  await page.getByTestId('reservation-customer-name-input').fill(payload.customerName);
  await page
    .getByTestId('reservation-customer-email-input')
    .fill('flow.booker@example.com');
  await page
    .getByTestId('reservation-customer-phone-input')
    .fill('+15550001010');
  await page.getByTestId('reservation-create-submit').click();
};

const getLocalReservationWindow = async (
  page: Page,
  startIso: string,
  endIso: string,
) =>
  page.evaluate(
    ({ startIsoValue, endIsoValue }) => {
      const formatDate = (date: Date) =>
        Object.fromEntries(
          new Intl.DateTimeFormat('en-CA', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })
            .formatToParts(date)
            .map((part) => [part.type, part.value]),
        ) as Record<string, string>;

      const formatTime = (date: Date) =>
        Object.fromEntries(
          new Intl.DateTimeFormat('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
            .formatToParts(date)
            .map((part) => [part.type, part.value]),
        ) as Record<string, string>;

      const start = new Date(startIsoValue);
      const end = new Date(endIsoValue);

      const startDateParts = formatDate(start);
      const startTimeParts = formatTime(start);
      const endTimeParts = formatTime(end);

      return {
        date: `${startDateParts.year}-${startDateParts.month}-${startDateParts.day}`,
        start: `${startTimeParts.hour}:${startTimeParts.minute}`,
        end: `${endTimeParts.hour}:${endTimeParts.minute}`,
      };
    },
    { startIsoValue: startIso, endIsoValue: endIso },
  ) as Promise<{ date: string; start: string; end: string }>;

test.describe('Critical journey: reservations/booking', () => {
  test('authenticated user can create a reservation through the booking dialog', async ({ page }) => {
    const pageErrors: string[] = [];
    const reservationResponses: number[] = [];

    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });
    page.on('response', async (response) => {
      const path = new URL(response.url()).pathname;
      if (path === '/api/reservations' && response.request().method() === 'POST') {
        reservationResponses.push(response.status());
      }
    });

    await seedAuthenticatedSession(page);
    await installDefaultApiMocks(page, {
      startAuthenticated: true,
      ...bookingResources,
      reservations: [],
    });

    await page.goto('/app/reservations');
    await expect(page.getByText('Loading account...')).toHaveCount(0);
    await page.getByRole('button', { name: /Reservations/i }).click();

    await fillReservationForm(page, {
      date: '2032-04-09',
      start: '12:00',
      end: '12:30',
      quantity: '2',
      customerName: 'Flow Booker',
    });

    await expect.poll(() => reservationResponses.includes(201)).toBeTruthy();
    expect(pageErrors).toHaveLength(0);
  });

  test('authenticated user receives overlap rejection for conflicting reservations', async ({
    page,
  }) => {
    const reservationResponses: number[] = [];

    page.on('response', async (response) => {
      const path = new URL(response.url()).pathname;
      if (path === '/api/reservations' && response.request().method() === 'POST') {
        reservationResponses.push(response.status());
      }
    });

    const overlapWindow = await getLocalReservationWindow(
      page,
      '2032-04-09T09:15:00.000Z',
      '2032-04-09T09:25:00.000Z',
    );

    await seedAuthenticatedSession(page);
    await installDefaultApiMocks(page, {
      startAuthenticated: true,
      ...bookingResources,
      reservations: [
        {
          id: 9901,
          resourceId: 801,
          resource: bookingResources.resources[0],
          startTime: '2032-04-09T09:00:00.000Z',
          endTime: '2032-04-09T09:30:00.000Z',
          status: 'confirmed',
          quantity: 1,
          customerName: 'Initial Booker',
          customerEmail: 'initial@example.com',
        },
      ],
    });

    await page.goto('/app/reservations');
    await expect(page.getByText('Loading account...')).toHaveCount(0);
    await page.getByRole('button', { name: /Reservations/i }).click();

    const dialogPromise = page.waitForEvent('dialog');
    await fillReservationForm(page, {
      date: overlapWindow.date,
      start: overlapWindow.start,
      end: overlapWindow.end,
      quantity: '1',
      customerName: 'Overlap Booker',
    });

    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('Reservation overlaps existing slot');
    await dialog.accept();

    await expect.poll(
      () => reservationResponses.some((status) => status === 400),
    ).toBeTruthy();
  });
});
