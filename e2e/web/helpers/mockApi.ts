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

interface E2eCalendar {
  id: number;
  name: string;
  color: string;
  visibility?: string;
  ownerId: number;
  owner?: {
    id: number;
    username: string;
    email: string;
  };
  groupId?: number | null;
}

interface E2eCalendarGroup {
  id: number;
  name: string;
  isVisible: boolean;
  ownerId: number;
  calendarIds: number[];
}

interface E2eEvent {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  color?: string;
  calendarId: number;
  createdById: number;
  recurrenceType?: string;
  recurrenceRule?: string | null;
}

interface E2eTaskLabel {
  id: number;
  name: string;
  color: string;
}

interface E2eTask {
  id: number;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'high' | 'medium' | 'low';
  color?: string;
  dueDate?: string | null;
  dueEnd?: string | null;
  dueTimezone?: string | null;
  labels?: E2eTaskLabel[];
}

interface E2eResourceType {
  id: number;
  name: string;
  organisationId: number;
  minBookingDuration?: number;
  bufferTime?: number;
}

interface E2eResource {
  id: number;
  name: string;
  capacity: number;
  resourceType: E2eResourceType;
}

interface E2eReservation {
  id: number;
  resourceId: number;
  resource?: E2eResource;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  quantity?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
}

export interface MockApiOptions {
  user?: E2eUser;
  loginFailuresBeforeSuccess?: number;
  startAuthenticated?: boolean;
  calendars?: E2eCalendar[];
  calendarGroups?: E2eCalendarGroup[];
  events?: E2eEvent[];
  tasks?: E2eTask[];
  taskLabels?: E2eTaskLabel[];
  resourceTypes?: E2eResourceType[];
  resources?: E2eResource[];
  reservations?: E2eReservation[];
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

const failUnhandledApiCall = (route: Route): never => {
  const request = route.request();
  const url = new URL(request.url());
  throw new Error(
    `Unhandled mock API call: ${request.method().toUpperCase()} ${url.pathname}${url.search}. ` +
      'Add an explicit mock in e2e/web/helpers/mockApi.ts.',
  );
};

const parseRequestBody = (route: Route): Record<string, unknown> => {
  const payload = route.request().postData();
  if (!payload) {
    return {};
  }
  try {
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return {};
  }
};

const defaultCalendars = (user: E2eUser): E2eCalendar[] => [
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
    groupId: 301,
  },
];

const defaultCalendarGroups = (
  user: E2eUser,
  calendars: E2eCalendar[],
): E2eCalendarGroup[] => {
  const groups = new Map<number, E2eCalendarGroup>();

  calendars.forEach((calendar) => {
    if (typeof calendar.groupId !== 'number') {
      return;
    }

    const groupId = calendar.groupId;
    const existing = groups.get(groupId);
    if (existing) {
      existing.calendarIds.push(calendar.id);
      return;
    }

    groups.set(groupId, {
      id: groupId,
      name: groupId === 301 ? 'Default Group' : `Group ${groupId}`,
      isVisible: true,
      ownerId: user.id,
      calendarIds: [calendar.id],
    });
  });

  return Array.from(groups.values());
};

const defaultEvents = (user: E2eUser): E2eEvent[] => [
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
    recurrenceType: 'none',
    recurrenceRule: null,
  },
];

const defaultTaskLabels = (): E2eTaskLabel[] => [
  { id: 41, name: 'Urgent', color: '#ef4444' },
  { id: 42, name: 'Planning', color: '#0ea5e9' },
];

const defaultTasks = (labels: E2eTaskLabel[]): E2eTask[] => [
  {
    id: 7001,
    title: 'Draft API contract',
    status: 'todo',
    priority: 'medium',
    color: '#0ea5e9',
    dueDate: '2026-03-10T10:00:00.000Z',
    dueTimezone: 'UTC',
    labels: [labels[1]],
  },
  {
    id: 7002,
    title: 'Confirm booking policy',
    status: 'in_progress',
    priority: 'high',
    color: '#f97316',
    dueDate: '2026-03-11T11:00:00.000Z',
    dueTimezone: 'UTC',
    labels: [labels[0]],
  },
];

const defaultResourceTypes = (): E2eResourceType[] => [
  {
    id: 501,
    name: 'Meeting Room',
    organisationId: 1,
    minBookingDuration: 30,
    bufferTime: 0,
  },
];

const defaultResources = (types: E2eResourceType[]): E2eResource[] => [
  {
    id: 801,
    name: 'Room A',
    capacity: 4,
    resourceType: types[0],
  },
];

const defaultReservations = (resources: E2eResource[]): E2eReservation[] => [
  {
    id: 9901,
    resourceId: resources[0].id,
    resource: resources[0],
    startTime: '2026-03-10T09:00:00.000Z',
    endTime: '2026-03-10T10:00:00.000Z',
    status: 'confirmed',
    quantity: 1,
    customerName: 'E2E Booker',
    customerEmail: 'booker@example.com',
  },
];

const nextId = (values: Array<{ id: number }>, fallbackStart: number): number =>
  values.length > 0 ? Math.max(...values.map((entry) => entry.id)) + 1 : fallbackStart;

const cloneCalendarGroups = (groups: E2eCalendarGroup[]): E2eCalendarGroup[] =>
  groups.map((group) => ({
    ...group,
    calendarIds: [...group.calendarIds],
  }));

const buildCalendarGroupResponse = (
  group: E2eCalendarGroup,
  calendars: E2eCalendar[],
) => ({
  id: group.id,
  name: group.name,
  isVisible: group.isVisible,
  ownerId: group.ownerId,
  calendars: calendars
    .filter((calendar) => group.calendarIds.includes(calendar.id))
    .map((calendar) => ({
      id: calendar.id,
      name: calendar.name,
      color: calendar.color,
      groupId: group.id,
    })),
});

const buildCalendarResponse = (calendar: E2eCalendar) => ({
  id: calendar.id,
  name: calendar.name,
  color: calendar.color,
  visibility: calendar.visibility,
  ownerId: calendar.ownerId,
  owner: calendar.owner,
  groupId: calendar.groupId ?? null,
});

const buildCalendarGroupsResponse = (
  groups: E2eCalendarGroup[],
  calendars: E2eCalendar[],
) => groups.map((group) => buildCalendarGroupResponse(group, calendars));

const toTaskListResponse = (tasks: E2eTask[]) => ({
  data: tasks,
  page: 1,
  limit: 20,
  total: tasks.length,
});

const filterTasks = (tasks: E2eTask[], route: Route): E2eTask[] => {
  const url = new URL(route.request().url());
  const status = url.searchParams.get('status');
  const search = url.searchParams.get('search')?.toLowerCase() ?? '';
  const labelIds = url.searchParams.getAll('labelIds').map((value) => Number(value));

  return tasks.filter((task) => {
    if (status && task.status !== status) {
      return false;
    }
    if (search && !task.title.toLowerCase().includes(search)) {
      return false;
    }
    if (labelIds.length > 0) {
      const taskLabelIds = (task.labels ?? []).map((label) => label.id);
      const hasAny = labelIds.some((id) => taskLabelIds.includes(id));
      if (!hasAny) {
        return false;
      }
    }
    return true;
  });
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
  let isAuthenticated = options.startAuthenticated ?? false;

  let calendars = options.calendars ?? defaultCalendars(user);
  let calendarGroups =
    options.calendarGroups ?? defaultCalendarGroups(user, calendars);
  let events = options.events ?? defaultEvents(user);
  let taskLabels = options.taskLabels ?? defaultTaskLabels();
  let tasks = options.tasks ?? defaultTasks(taskLabels);
  let resourceTypes = options.resourceTypes ?? [];
  let resources = options.resources ?? [];
  let reservations = options.reservations ?? [];

  if (resourceTypes.length === 0 && resources.length === 0 && reservations.length === 0) {
    // Keep historical default behavior for existing tests: empty reservations setup.
    resourceTypes = [];
    resources = [];
    reservations = [];
  } else {
    if (resourceTypes.length === 0) {
      resourceTypes = defaultResourceTypes();
    }
    if (resources.length === 0) {
      resources = defaultResources(resourceTypes);
    }
    if (reservations.length === 0) {
      reservations = defaultReservations(resources);
    }
  }

  const syncCalendarGroupMembership = (calendarId: number, groupId: number | null) => {
    const calendar = calendars.find((entry) => entry.id === calendarId);
    if (calendar) {
      calendar.groupId = groupId;
    }

    calendarGroups = calendarGroups.map((group) => ({
      ...group,
      calendarIds:
        group.id === groupId
          ? Array.from(new Set([...group.calendarIds, calendarId]))
          : group.calendarIds.filter((id) => id !== calendarId),
    }));
  };

  const removeCalendarGroup = (groupId: number) => {
    const removed = calendarGroups.find((group) => group.id === groupId);
    if (removed) {
      removed.calendarIds.forEach((calendarId) => {
        const calendar = calendars.find((entry) => entry.id === calendarId);
        if (calendar) {
          calendar.groupId = null;
        }
      });
    }
    calendarGroups = calendarGroups.filter((group) => group.id !== groupId);
  };

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

      isAuthenticated = true;

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
      if (!isAuthenticated) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Not authenticated' }),
        });
        return;
      }

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
      isAuthenticated = false;
      await route.fulfill(asJson({ success: true }));
      return;
    }

    if (path.endsWith('/api/auth/profile') && method === 'GET') {
      if (!isAuthenticated) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Not authenticated' }),
        });
        return;
      }

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

    if (path.endsWith('/api/users/me/language') && method === 'PATCH') {
      if (!isAuthenticated) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Not authenticated' }),
        });
        return;
      }

      const body = parseRequestBody(route);
      const preferredLanguage =
        typeof body.preferredLanguage === 'string' && body.preferredLanguage
          ? body.preferredLanguage
          : 'en';

      await route.fulfill(
        asJson({
          ...user,
          language: preferredLanguage,
          preferredLanguage,
        }),
      );
      return;
    }

    if (path.endsWith('/api/user-permissions/accessible-organizations')) {
      await route.fulfill(
        asJson([{ id: 1, name: 'E2E Org', role: 'ADMIN', color: '#0ea5e9' }]),
      );
      return;
    }

    if (path.endsWith('/api/user-permissions') && method === 'GET') {
      await route.fulfill(
        asJson({
          canAccessReservations: true,
          accessibleOrganizationIds: [1],
          adminOrganizationIds: [1],
          editableReservationCalendarIds: [12],
          viewableReservationCalendarIds: [12],
          isSuperAdmin: false,
        }),
      );
      return;
    }

    if (path.endsWith('/api/organisations') && method === 'GET') {
      await route.fulfill(
        asJson([
          {
            id: 1,
            name: 'E2E Org',
            description: 'Test organisation',
            color: '#0ea5e9',
          },
        ]),
      );
      return;
    }

    if (path.match(/^\/api\/organisations\/\d+\/users(\/list)?$/) && method === 'GET') {
      await route.fulfill(asJson([{ userId: user.id, role: 'admin' }]));
      return;
    }

    if (path.startsWith('/api/resource-types')) {
      if (method === 'GET') {
        await route.fulfill(asJson(resourceTypes));
        return;
      }
    }

    if (path.startsWith('/api/resources')) {
      if (method === 'GET') {
        await route.fulfill(asJson(resources));
        return;
      }
    }

    if (path === '/api/reservations') {
      if (method === 'GET') {
        await route.fulfill(asJson(reservations));
        return;
      }
      if (method === 'POST') {
        const body = parseRequestBody(route);
        const startTime = new Date(
          String(body.startTime ?? new Date().toISOString()),
        );
        const endTime = new Date(
          String(body.endTime ?? new Date(Date.now() + 3600000).toISOString()),
        );
        const resourceId = Number(body.resourceId);

        const hasOverlap = reservations.some((entry) => {
          if (entry.resourceId !== resourceId || entry.status === 'cancelled') {
            return false;
          }
          const existingStart = new Date(entry.startTime);
          const existingEnd = new Date(entry.endTime);
          return startTime < existingEnd && endTime > existingStart;
        });

        if (hasOverlap) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              message: 'Reservation overlaps existing slot',
            }),
          });
          return;
        }

        const resource = resources.find((entry) => entry.id === resourceId);
        const created: E2eReservation = {
          id: nextId(reservations, 9900),
          resourceId,
          resource,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          status: 'confirmed',
          quantity: Number(body.quantity ?? 1),
          customerName:
            typeof body.customerName === 'string'
              ? body.customerName
              : typeof body.customerInfo === 'object' &&
                  body.customerInfo &&
                  typeof (body.customerInfo as Record<string, unknown>).name === 'string'
                ? ((body.customerInfo as Record<string, unknown>).name as string)
                : 'Unknown customer',
          customerEmail:
            typeof body.customerEmail === 'string'
              ? body.customerEmail
              : typeof body.customerInfo === 'object' &&
                  body.customerInfo &&
                  typeof (body.customerInfo as Record<string, unknown>).email === 'string'
                ? ((body.customerInfo as Record<string, unknown>).email as string)
                : undefined,
          customerPhone:
            typeof body.customerPhone === 'string'
              ? body.customerPhone
              : typeof body.customerInfo === 'object' &&
                  body.customerInfo &&
                  typeof (body.customerInfo as Record<string, unknown>).phone === 'string'
                ? ((body.customerInfo as Record<string, unknown>).phone as string)
                : undefined,
          notes: typeof body.notes === 'string' ? body.notes : undefined,
        };
        reservations = [created, ...reservations];
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(created),
        });
        return;
      }
    }

    const reservationByIdMatch = /^\/api\/reservations\/(\d+)$/.exec(path);
    if (reservationByIdMatch) {
      const reservationId = Number(reservationByIdMatch[1]);
      const index = reservations.findIndex((entry) => entry.id === reservationId);

      if (method === 'PATCH') {
        const body = parseRequestBody(route);
        if (index < 0) {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Reservation not found' }),
          });
          return;
        }
        reservations[index] = {
          ...reservations[index],
          ...(body as Partial<E2eReservation>),
        };
        await route.fulfill(asJson(reservations[index]));
        return;
      }

      if (method === 'DELETE') {
        reservations = reservations.filter((entry) => entry.id !== reservationId);
        await route.fulfill(asJson({ message: 'Reservation deleted' }));
        return;
      }
    }

    if (path === '/api/events') {
      if (method === 'GET') {
        await route.fulfill(asJson(events));
        return;
      }
      if (method === 'POST') {
        const body = parseRequestBody(route);
        const created: E2eEvent = {
          id: nextId(events, 9001),
          title: String(body.title ?? 'New event'),
          startDate: String(body.startDate ?? '2026-03-12'),
          endDate: String(body.endDate ?? body.startDate ?? '2026-03-12'),
          startTime:
            typeof body.startTime === 'string'
              ? body.startTime
              : typeof body.startDate === 'string' && body.startDate.includes('T')
                ? body.startDate.split('T')[1]?.slice(0, 5)
                : '09:00',
          endTime:
            typeof body.endTime === 'string'
              ? body.endTime
              : typeof body.endDate === 'string' && body.endDate.includes('T')
                ? body.endDate.split('T')[1]?.slice(0, 5)
                : '10:00',
          color: String(body.color ?? '#0ea5e9'),
          calendarId: Number(body.calendarId ?? 12),
          createdById: user.id,
          recurrenceType:
            typeof body.recurrenceType === 'string' ? body.recurrenceType : 'none',
          recurrenceRule:
            typeof body.recurrenceRule === 'string' ? body.recurrenceRule : null,
        };
        events = [created, ...events];
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(created),
        });
        return;
      }
    }

    const eventByIdMatch = /^\/api\/events\/(\d+)$/.exec(path);
    if (eventByIdMatch) {
      const eventId = Number(eventByIdMatch[1]);
      const index = events.findIndex((entry) => entry.id === eventId);

      if (method === 'PATCH') {
        const body = parseRequestBody(route);
        if (index < 0) {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Event not found' }),
          });
          return;
        }
        events[index] = {
          ...events[index],
          ...(body as Partial<E2eEvent>),
        };
        await route.fulfill(asJson(events[index]));
        return;
      }

      if (method === 'DELETE') {
        events = events.filter((entry) => entry.id !== eventId);
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
        return;
      }
    }

    if (path === '/api/calendars') {
      if (method === 'GET') {
        await route.fulfill(asJson(calendars.map(buildCalendarResponse)));
        return;
      }

      if (method === 'POST') {
        const body = parseRequestBody(route);
        const groupIdRaw = body.groupId;
        const groupId =
          typeof groupIdRaw === 'number'
            ? groupIdRaw
            : typeof groupIdRaw === 'string' && groupIdRaw.trim().length > 0
              ? Number(groupIdRaw)
              : null;
        const created: E2eCalendar = {
          id: nextId(calendars, 13),
          name: typeof body.name === 'string' && body.name.trim().length > 0
            ? body.name.trim()
            : 'New Calendar',
          color: typeof body.color === 'string' && body.color.trim().length > 0
            ? body.color.trim()
            : '#0ea5e9',
          visibility: typeof body.visibility === 'string' ? body.visibility : 'private',
          ownerId: user.id,
          owner: {
            id: user.id,
            username: user.username,
            email: user.email,
          },
          groupId: Number.isFinite(groupId as number) ? (groupId as number) : null,
        };
        calendars = [created, ...calendars];
        if (Number.isFinite(groupId as number)) {
          syncCalendarGroupMembership(created.id, groupId as number);
        }
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(buildCalendarResponse(created)),
        });
        return;
      }
    }

    if ((path === '/api/calendar-groups' || path === '/api/calendars/groups') && (method === 'GET' || method === 'POST')) {
      if (method === 'GET') {
        await route.fulfill(asJson(buildCalendarGroupsResponse(calendarGroups, calendars)));
        return;
      }

      if (method === 'POST') {
        const body = parseRequestBody(route);
        const createdGroup: E2eCalendarGroup = {
          id: nextId(calendarGroups, 301),
          name: typeof body.name === 'string' && body.name.trim().length > 0
            ? body.name.trim()
            : 'New Group',
          isVisible: body.isVisible !== false,
          ownerId: user.id,
          calendarIds: [],
        };
        calendarGroups = [...calendarGroups, createdGroup];
        await route.fulfill(asJson(buildCalendarGroupResponse(createdGroup, calendars)));
        return;
      }

      return;
    }

    const groupByIdMatch = /^\/api\/calendar-groups\/(\d+)$/.exec(path);
    if (groupByIdMatch && (method === 'PATCH' || method === 'DELETE')) {
      const groupId = Number(groupByIdMatch[1]);
      const index = calendarGroups.findIndex((group) => group.id === groupId);
      if (index < 0) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Group not found' }),
        });
        return;
      }

      if (method === 'PATCH') {
        const body = parseRequestBody(route);
        const nextGroup = {
          ...calendarGroups[index],
          name:
            typeof body.name === 'string' && body.name.trim().length > 0
              ? body.name.trim()
              : calendarGroups[index].name,
          isVisible:
            typeof body.isVisible === 'boolean'
              ? body.isVisible
              : calendarGroups[index].isVisible,
        };
        calendarGroups[index] = nextGroup;
        await route.fulfill(asJson(buildCalendarGroupResponse(nextGroup, calendars)));
        return;
      }

      removeCalendarGroup(groupId);
      await route.fulfill(asJson({ success: true }));
      return;
    }

    const groupIdMatch = /^\/api\/calendar-groups\/(\d+)\/calendars$/.exec(path);
    if (groupIdMatch && method === 'POST') {
      const groupId = Number(groupIdMatch[1]);
      const body = parseRequestBody(route);
      const group = calendarGroups.find((entry) => entry.id === groupId);
      if (!group) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Group not found' }),
        });
        return;
      }
      const calendarIds = Array.isArray(body.calendarIds)
        ? body.calendarIds.map((entry) => Number(entry)).filter((entry) => Number.isFinite(entry))
        : [];
      calendarIds.forEach((calendarId) => syncCalendarGroupMembership(calendarId, groupId));
      group.calendarIds = Array.from(new Set([...group.calendarIds, ...calendarIds]));
      await route.fulfill(asJson(buildCalendarGroupResponse(group, calendars)));
      return;
    }

    const unassignGroupMatch = /^\/api\/calendar-groups\/(\d+)\/calendars\/unassign$/.exec(path);
    if (unassignGroupMatch && method === 'POST') {
      const groupId = Number(unassignGroupMatch[1]);
      const body = parseRequestBody(route);
      const group = calendarGroups.find((entry) => entry.id === groupId);
      if (!group) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Group not found' }),
        });
        return;
      }
      const calendarIds = Array.isArray(body.calendarIds)
        ? body.calendarIds.map((entry) => Number(entry)).filter((entry) => Number.isFinite(entry))
        : [];
      group.calendarIds = group.calendarIds.filter((id) => !calendarIds.includes(id));
      calendarIds.forEach((calendarId) => syncCalendarGroupMembership(calendarId, null));
      await route.fulfill(asJson(buildCalendarGroupResponse(group, calendars)));
      return;
    }

    const shareGroupMatch = /^\/api\/calendar-groups\/(\d+)\/share$/.exec(path);
    if (shareGroupMatch) {
      const groupId = Number(shareGroupMatch[1]);
      const group = calendarGroups.find((entry) => entry.id === groupId);
      if (!group) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Group not found' }),
        });
        return;
      }
      const body = parseRequestBody(route);
      const calendarIds = group.calendarIds.length > 0 ? [...group.calendarIds] : [];
      if (method === 'POST') {
        await route.fulfill(asJson({ sharedCalendarIds: calendarIds }));
        return;
      }
      if (method === 'DELETE') {
        const requestedIds = Array.isArray(body.userIds)
          ? body.userIds.map((entry) => Number(entry)).filter((entry) => Number.isFinite(entry))
          : [];
        await route.fulfill(asJson({ unsharedCalendarIds: requestedIds.length > 0 ? calendarIds : [] }));
        return;
      }
    }

    if (path === '/api/tasks') {
      if (method === 'GET') {
        const filtered = filterTasks(tasks, route);
        await route.fulfill(asJson(toTaskListResponse(filtered)));
        return;
      }
      if (method === 'POST') {
        const body = parseRequestBody(route);
        const labelIds = Array.isArray(body.labelIds)
          ? body.labelIds.map((entry) => Number(entry))
          : [];
        const createdTask: E2eTask = {
          id: nextId(tasks, 7001),
          title: String(body.title ?? 'New task'),
          status:
            body.status === 'todo' ||
            body.status === 'in_progress' ||
            body.status === 'done'
              ? body.status
              : 'todo',
          priority:
            body.priority === 'high' ||
            body.priority === 'medium' ||
            body.priority === 'low'
              ? body.priority
              : 'medium',
          color: typeof body.color === 'string' ? body.color : '#0ea5e9',
          dueDate:
            typeof body.dueDate === 'string'
              ? body.dueDate
              : body.dueDate === null
                ? null
                : undefined,
          dueEnd:
            typeof body.dueEnd === 'string'
              ? body.dueEnd
              : body.dueEnd === null
                ? null
                : undefined,
          dueTimezone:
            typeof body.dueTimezone === 'string'
              ? body.dueTimezone
              : body.dueTimezone === null
                ? null
                : undefined,
          labels: taskLabels.filter((label) => labelIds.includes(label.id)),
        };
        tasks = [createdTask, ...tasks];
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(createdTask),
        });
        return;
      }
    }

    const taskByIdMatch = /^\/api\/tasks\/(\d+)$/.exec(path);
    if (taskByIdMatch) {
      const taskId = Number(taskByIdMatch[1]);
      const taskIndex = tasks.findIndex((entry) => entry.id === taskId);

      if (method === 'PATCH') {
        const body = parseRequestBody(route);
        if (taskIndex < 0) {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Task not found' }),
          });
          return;
        }
        const next = { ...tasks[taskIndex] };
        if (body.title !== undefined) {
          next.title = String(body.title);
        }
        if (body.status === 'todo' || body.status === 'in_progress' || body.status === 'done') {
          next.status = body.status;
        }
        if (body.priority === 'high' || body.priority === 'medium' || body.priority === 'low') {
          next.priority = body.priority;
        }
        if (body.dueDate !== undefined) {
          next.dueDate = body.dueDate === null ? null : String(body.dueDate);
        }
        if (body.labelIds !== undefined) {
          const labelIds = Array.isArray(body.labelIds)
            ? body.labelIds.map((entry) => Number(entry))
            : [];
          next.labels = taskLabels.filter((label) => labelIds.includes(label.id));
        }
        tasks[taskIndex] = next;
        await route.fulfill(asJson(next));
        return;
      }

      if (method === 'DELETE') {
        tasks = tasks.filter((entry) => entry.id !== taskId);
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
        return;
      }
    }

    if (path === '/api/task-labels') {
      if (method === 'GET') {
        await route.fulfill(asJson(taskLabels));
        return;
      }
      if (method === 'POST') {
        const body = parseRequestBody(route);
        const createdLabel: E2eTaskLabel = {
          id: nextId(taskLabels, 41),
          name: String(body.name ?? 'New Label'),
          color:
            typeof body.color === 'string' && body.color.length > 0
              ? body.color
              : '#0ea5e9',
        };
        taskLabels = [createdLabel, ...taskLabels];
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(createdLabel),
        });
        return;
      }
    }

    const taskLabelByIdMatch = /^\/api\/task-labels\/(\d+)$/.exec(path);
    if (taskLabelByIdMatch) {
      const labelId = Number(taskLabelByIdMatch[1]);
      const labelIndex = taskLabels.findIndex((entry) => entry.id === labelId);
      if (labelIndex < 0) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Label not found' }),
        });
        return;
      }

      if (method === 'PATCH') {
        const body = parseRequestBody(route);
        taskLabels[labelIndex] = {
          ...taskLabels[labelIndex],
          name:
            typeof body.name === 'string' && body.name.length > 0
              ? body.name
              : taskLabels[labelIndex].name,
          color:
            typeof body.color === 'string' && body.color.length > 0
              ? body.color
              : taskLabels[labelIndex].color,
        };
        await route.fulfill(asJson(taskLabels[labelIndex]));
        return;
      }

      if (method === 'DELETE') {
        taskLabels = taskLabels.filter((entry) => entry.id !== labelId);
        tasks = tasks.map((task) => ({
          ...task,
          labels: (task.labels ?? []).filter((label) => label.id !== labelId),
        }));
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
        return;
      }
    }

    if (path.match(/^\/api\/tasks\/\d+\/labels$/) && method === 'POST') {
      const taskId = Number(path.split('/')[3]);
      const body = parseRequestBody(route);
      const task = tasks.find((entry) => entry.id === taskId);
      if (!task) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Task not found' }),
        });
        return;
      }
      const labelIds = Array.isArray(body.labelIds)
        ? body.labelIds.map((entry) => Number(entry))
        : [];
      task.labels = taskLabels.filter((label) => labelIds.includes(label.id));
      await route.fulfill(asJson(task));
      return;
    }

    if (path.match(/^\/api\/tasks\/\d+\/labels\/\d+$/) && method === 'DELETE') {
      const parts = path.split('/');
      const taskId = Number(parts[3]);
      const labelId = Number(parts[5]);
      const task = tasks.find((entry) => entry.id === taskId);
      if (!task) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Task not found' }),
        });
        return;
      }
      task.labels = (task.labels ?? []).filter((label) => label.id !== labelId);
      await route.fulfill(asJson(task));
      return;
    }

    if (path.endsWith('/api/notifications') && method === 'GET') {
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
      await route.fulfill(
        asJson({ calendar: [], reservation: [], organisation: [] }),
      );
      return;
    }

    if (path.endsWith('/api/health')) {
      await route.fulfill(asJson({ ok: true }));
      return;
    }

    failUnhandledApiCall(route);
  });
}
