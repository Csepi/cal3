import type { Page, Route } from '@playwright/test';

export interface E2eUser {
  id: number;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  themeColor?: string;
}

export interface MockApiOptions {
  user?: E2eUser;
  loginFailuresBeforeSuccess?: number;
}

const defaultUser: E2eUser = {
  id: 101,
  username: 'e2e_user',
  email: 'e2e_user@example.com',
  role: 'admin',
  firstName: 'E2E',
  lastName: 'User',
  themeColor: '#0ea5e9',
};

const asJson = (body: unknown) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify(body),
});

const pathOf = (route: Route): string => {
  const url = new URL(route.request().url());
  return url.pathname;
};

export async function seedAuthenticatedSession(
  page: Page,
  user: E2eUser = defaultUser,
): Promise<void> {
  await page.addInitScript((seed) => {
    const expiresAt = Date.now() + 60 * 60 * 1000;
    localStorage.setItem('cal3_access_token', 'header.payload.signature');
    localStorage.setItem('cal3_access_token_expires_at', String(expiresAt));
    localStorage.setItem('cal3_refresh_token', 'refresh-token-e2e');
    localStorage.setItem('cal3_session_user', JSON.stringify(seed));
    localStorage.setItem('username', seed.username);
    localStorage.setItem('userRole', seed.role);
    localStorage.setItem('themeColor', seed.themeColor ?? '#0ea5e9');
    localStorage.setItem('cal3_last_activity_at', String(Date.now()));
    document.cookie = `cal3_csrf_token=e2e-csrf-token; Path=/; SameSite=Strict`;
  }, user);
}

export async function installDefaultApiMocks(
  page: Page,
  options: MockApiOptions = {},
): Promise<void> {
  const user = options.user ?? defaultUser;
  let loginFailures = options.loginFailuresBeforeSuccess ?? 0;

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const method = request.method().toUpperCase();
    const path = pathOf(route);

    if (path.endsWith('/api/auth/csrf') && method === 'GET') {
      await route.fulfill(
        asJson({
          csrfToken: 'e2e-csrf-token',
          headerName: 'X-CSRF-Token',
          cookieName: 'cal3_csrf_token',
        }),
      );
      return;
    }

    if (path.endsWith('/api/auth/login') && method === 'POST') {
      if (loginFailures > 0) {
        loginFailures -= 1;
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Login failed' }),
        });
        return;
      }

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'header.payload.signature',
          refresh_token: 'refresh-token-e2e',
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_expires_at: new Date(Date.now() + 86400000).toISOString(),
          issued_at: new Date().toISOString(),
          user,
        }),
      });
      return;
    }

    if (path.endsWith('/api/auth/refresh') && method === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'header.payload.signature.rotated',
          refresh_token: 'refresh-token-e2e-rotated',
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_expires_at: new Date(Date.now() + 86400000).toISOString(),
          issued_at: new Date().toISOString(),
          user,
        }),
      });
      return;
    }

    if (path.endsWith('/api/auth/logout') && method === 'POST') {
      await route.fulfill(asJson({ success: true }));
      return;
    }

    if (path.endsWith('/api/auth/profile') && method === 'GET') {
      await route.fulfill(asJson(user));
      return;
    }

    if (path.endsWith('/api/feature-flags') && method === 'GET') {
      await route.fulfill(
        asJson({
          oauth: true,
          calendarSync: true,
          reservations: true,
          automation: true,
          agents: true,
          tasks: true,
        }),
      );
      return;
    }

    if (path.endsWith('/api/user/profile')) {
      if (method === 'GET') {
        await route.fulfill(
          asJson({
            id: user.id,
            name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
            fullName: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
            timezone: 'UTC',
            timeFormat: '24h',
            language: 'en',
            themeColor: user.themeColor ?? '#0ea5e9',
            hideReservationsTab: false,
          }),
        );
        return;
      }

      await route.fulfill(asJson({ success: true }));
      return;
    }

    if (path.endsWith('/api/user-permissions/accessible-organizations')) {
      await route.fulfill(
        asJson([
          { id: 1, name: 'E2E Org', role: 'ADMIN', color: '#0ea5e9' },
        ]),
      );
      return;
    }

    if (path.includes('/api/resource-types')) {
      await route.fulfill(asJson([]));
      return;
    }

    if (path.endsWith('/api/resources')) {
      await route.fulfill(asJson([]));
      return;
    }

    if (path.endsWith('/api/reservations')) {
      await route.fulfill(asJson([]));
      return;
    }

    if (path.endsWith('/api/events')) {
      await route.fulfill(
        asJson([
          {
            id: 9001,
            title: 'E2E Planning Session',
            startDate: '2026-03-09',
            startTime: '09:00',
            endDate: '2026-03-09',
            endTime: '10:00',
            color: '#0ea5e9',
            calendarId: 12,
            createdById: user.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]),
      );
      return;
    }

    if (path.endsWith('/api/calendars')) {
      await route.fulfill(
        asJson([
          {
            id: 12,
            name: 'Team Calendar',
            color: '#0ea5e9',
            visibility: 'private',
            ownerId: user.id,
            owner: {
              id: user.id,
              username: user.username,
              email: user.email,
            },
            isActive: true,
            isReservationCalendar: false,
            isTasksCalendar: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]),
      );
      return;
    }

    if (path.endsWith('/api/calendar-groups') || path.endsWith('/api/calendars/groups')) {
      await route.fulfill(
        asJson([
          {
            id: 301,
            name: 'Default Group',
            isVisible: true,
            ownerId: user.id,
            calendars: [
              {
                id: 12,
                name: 'Team Calendar',
                color: '#0ea5e9',
                groupId: 301,
              },
            ],
          },
        ]),
      );
      return;
    }

    if (path.endsWith('/api/notifications')) {
      await route.fulfill(asJson([]));
      return;
    }

    if (path.endsWith('/api/notifications/threads')) {
      await route.fulfill(asJson([]));
      return;
    }

    if (path.endsWith('/api/notifications/preferences')) {
      await route.fulfill(asJson([]));
      return;
    }

    if (path.endsWith('/api/notifications/filters')) {
      await route.fulfill(asJson([]));
      return;
    }

    if (path.endsWith('/api/notifications/catalog')) {
      await route.fulfill(asJson({ channels: [], events: [] }));
      return;
    }

    if (path.endsWith('/api/notifications/mutes')) {
      await route.fulfill(asJson([]));
      return;
    }

    if (path.endsWith('/api/notifications/scopes')) {
      await route.fulfill(asJson({ calendar: [], reservation: [], organisation: [] }));
      return;
    }

    if (path.endsWith('/api/tasks')) {
      await route.fulfill(
        asJson({
          data: [],
          page: 1,
          limit: 20,
          total: 0,
        }),
      );
      return;
    }

    if (path.endsWith('/api/health')) {
      await route.fulfill(asJson({ ok: true }));
      return;
    }

    await route.fulfill(asJson({}));
  });
}
