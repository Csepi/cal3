import { apiService } from '../services/api';
import { secureFetch } from '../services/authErrorHandler';
import { sessionManager } from '../services/sessionManager';
import { CalendarVisibility, SharePermission } from '../types/Calendar';
import { TaskPriority, TaskStatus } from '../types/Task';

jest.mock('../config/apiConfig', () => ({
  BASE_URL: 'https://api.test',
}));

jest.mock('../services/authErrorHandler', () => ({
  secureFetch: jest.fn(),
}));

jest.mock('../services/sessionManager', () => ({
  sessionManager: {
    setSessionFromResponse: jest.fn(),
    updateUser: jest.fn(),
    peekRefreshToken: jest.fn(() => null),
    clearSession: jest.fn(),
    hasActiveSession: jest.fn(() => false),
    getCurrentUser: jest.fn(() => ({})),
  },
}));

describe('apiService calendar, group, task, label, and reservation endpoints', () => {
  const mockedSecureFetch = secureFetch as jest.MockedFunction<
    typeof secureFetch
  >;
  const mockedSessionManager = sessionManager as jest.Mocked<
    typeof sessionManager
  >;

  const response = <T,>(
    body: T,
    init: {
      ok?: boolean;
      status?: number;
      retryAfter?: string | null;
      jsonRejects?: boolean;
    } = {},
  ): Response =>
    ({
      ok: init.ok ?? true,
      status: init.status ?? 200,
      json: init.jsonRejects
        ? async () => {
            throw new Error('invalid json');
          }
        : async () => body,
      text: async () =>
        typeof body === 'string' ? body : JSON.stringify(body),
      headers: {
        get: (key: string) =>
          key.toLowerCase() === 'retry-after' ? init.retryAfter ?? null : null,
      },
    }) as Response;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedSessionManager.getCurrentUser.mockReturnValue({
      id: 1,
      username: 'current-user',
    } as never);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('creates calendars and returns the created payload', async () => {
    const calendar = {
      id: 5,
      name: 'Planning',
      description: 'Team planning calendar',
      color: '#0ea5e9',
      visibility: 'shared' as const,
      isActive: true,
      owner: {
        id: 1,
        username: 'current-user',
        email: 'demo@example.com',
      },
      createdAt: '2026-04-03T10:00:00.000Z',
      updatedAt: '2026-04-03T10:00:00.000Z',
    };

    mockedSecureFetch.mockResolvedValueOnce(response(calendar));

    await expect(
      apiService.createCalendar({
        name: 'Planning',
        description: 'Team planning calendar',
        color: '#0ea5e9',
        visibility: CalendarVisibility.SHARED,
        groupId: 2,
        rank: 4,
      }),
    ).resolves.toEqual(calendar);

    expect(mockedSecureFetch).toHaveBeenCalledWith(
      'https://api.test/api/calendars',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Planning',
          description: 'Team planning calendar',
          color: '#0ea5e9',
          visibility: CalendarVisibility.SHARED,
          groupId: 2,
          rank: 4,
        }),
      }),
    );
  });

  it('lists, updates, and deletes calendars on success', async () => {
    const calendars = [
      {
        id: 5,
        name: 'Planning',
        color: '#0ea5e9',
        groupId: 9,
      },
    ];
    const updatedCalendar = {
      id: 5,
      name: 'Planning Updated',
      color: '#2563eb',
      groupId: null,
    };

    mockedSecureFetch
      .mockResolvedValueOnce(response(calendars))
      .mockResolvedValueOnce(response(updatedCalendar))
      .mockResolvedValueOnce(response({ success: true }));

    await expect(apiService.getAllCalendars()).resolves.toEqual(calendars);
    await expect(
      apiService.updateCalendar(5, {
        name: 'Planning Updated',
        color: '#2563eb',
        groupId: null,
      }),
    ).resolves.toEqual(updatedCalendar);
    await expect(apiService.deleteCalendar(5)).resolves.toBeUndefined();

    expect(mockedSecureFetch.mock.calls[0]?.[0]).toBe(
      'https://api.test/api/calendars',
    );
    expect(mockedSecureFetch.mock.calls[1]?.[0]).toBe(
      'https://api.test/api/calendars/5',
    );
    expect(mockedSecureFetch.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Planning Updated',
          color: '#2563eb',
          groupId: null,
        }),
      }),
    );
    expect(mockedSecureFetch.mock.calls[2]?.[0]).toBe(
      'https://api.test/api/calendars/5',
    );
    expect(mockedSecureFetch.mock.calls[2]?.[1]).toEqual(
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('surfaces calendar update auth errors', async () => {
    mockedSecureFetch.mockResolvedValueOnce(
      response({ message: 'unauthorized' }, { ok: false, status: 401 }),
    );

    await expect(
      apiService.updateCalendar(12, { name: 'Renamed calendar' }),
    ).rejects.toThrow(
      'Authentication required. Please log in to update calendars.',
    );
  });

  it('surfaces calendar fetch auth errors and delete fallback errors', async () => {
    mockedSecureFetch
      .mockResolvedValueOnce(
        response({ message: 'unauthorized' }, { ok: false, status: 401 }),
      )
      .mockResolvedValueOnce(
        response('plain text failure', { ok: false, status: 500, jsonRejects: true }),
      );

    await expect(apiService.getAllCalendars()).rejects.toThrow(
      'Authentication required. Please log in to view calendars.',
    );

    await expect(apiService.deleteCalendar(88)).rejects.toThrow('invalid json');
  });

  it('falls back to the legacy calendar groups endpoint when the primary route is missing', async () => {
    const groups = [
      {
        id: 9,
        name: 'Work',
        isVisible: true,
        ownerId: 1,
        calendars: [{ id: 5, name: 'Planning', color: '#0ea5e9', groupId: 9 }],
      },
    ];

    mockedSecureFetch
      .mockResolvedValueOnce(response({ message: 'not found' }, { ok: false, status: 404 }))
      .mockResolvedValueOnce(response(groups));

    await expect(apiService.getCalendarGroups()).resolves.toEqual(groups);

    expect(mockedSecureFetch.mock.calls[0]?.[0]).toBe(
      'https://api.test/api/calendar-groups',
    );
    expect(mockedSecureFetch.mock.calls[1]?.[0]).toBe(
      'https://api.test/api/calendars/groups',
    );
  });

  it('surfaces calendar group fetch errors when primary response is not 404', async () => {
    mockedSecureFetch.mockResolvedValueOnce(
      response({ message: 'group listing failed' }, { ok: false, status: 500 }),
    );

    await expect(apiService.getCalendarGroups()).rejects.toThrow(
      'group listing failed',
    );
  });

  it('falls back to /api/calendars/groups for calendar group creation when /api/calendar-groups is missing', async () => {
    const createdGroup = {
      id: 18,
      name: 'Fallback Group',
      ownerId: 1,
      isVisible: true,
      createdAt: '2026-04-03T10:00:00.000Z',
      updatedAt: '2026-04-03T10:00:00.000Z',
    };

    mockedSecureFetch
      .mockResolvedValueOnce(
        response({ message: 'not found' }, { ok: false, status: 404 }),
      )
      .mockResolvedValueOnce(response(createdGroup));

    await expect(
      apiService.createCalendarGroup({
        name: 'Fallback Group',
        isVisible: true,
      }),
    ).resolves.toEqual(createdGroup);
  });

  it('uses the primary calendar group routes when they succeed', async () => {
    const groups = [
      {
        id: 21,
        name: 'Primary Route Group',
        ownerId: 1,
        isVisible: true,
        calendars: [{ id: 5, name: 'Planning', groupId: 21 }],
      },
    ];
    const createdGroup = {
      id: 22,
      name: 'Direct Group',
      ownerId: 1,
      isVisible: false,
    };

    mockedSecureFetch
      .mockResolvedValueOnce(response(groups))
      .mockResolvedValueOnce(response(createdGroup));

    await expect(apiService.getCalendarGroups()).resolves.toEqual(groups);
    await expect(
      apiService.createCalendarGroup({
        name: 'Direct Group',
        isVisible: false,
      }),
    ).resolves.toEqual(createdGroup);

    expect(mockedSecureFetch).toHaveBeenNthCalledWith(
      1,
      'https://api.test/api/calendar-groups',
      {},
    );
    expect(mockedSecureFetch).toHaveBeenNthCalledWith(
      2,
      'https://api.test/api/calendar-groups',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Direct Group',
          isVisible: false,
        }),
      }),
    );
    expect(mockedSecureFetch).toHaveBeenCalledTimes(2);
  });

  it('uses the fallback message when calendar group creation fails without JSON', async () => {
    mockedSecureFetch.mockResolvedValueOnce(
      response('plain text failure', {
        ok: false,
        status: 500,
        jsonRejects: true,
      }),
    );

    await expect(
      apiService.createCalendarGroup({
        name: 'Shared',
        isVisible: true,
      }),
    ).rejects.toThrow('Failed to create calendar group');
  });

  it('updates, assigns, unassigns, shares, unshares, and deletes calendar groups', async () => {
    const updatedGroup = {
      id: 20,
      name: 'Updated Group',
      ownerId: 1,
      isVisible: false,
    };
    const groupWithCalendars = {
      ...updatedGroup,
      calendars: [{ id: 7, name: 'Planning' }],
    };
    const sharedPayload = { sharedCalendarIds: [7] };
    const unsharedPayload = { unsharedCalendarIds: [7] };

    mockedSecureFetch
      .mockResolvedValueOnce(response(updatedGroup))
      .mockResolvedValueOnce(response(groupWithCalendars))
      .mockResolvedValueOnce(response(groupWithCalendars))
      .mockResolvedValueOnce(response(sharedPayload))
      .mockResolvedValueOnce(response(unsharedPayload))
      .mockResolvedValueOnce(response({ success: true }));

    await expect(
      apiService.updateCalendarGroup(20, { name: 'Updated Group', isVisible: false }),
    ).resolves.toEqual(updatedGroup);

    await expect(
      apiService.assignCalendarsToGroup(20, { calendarIds: [7] }),
    ).resolves.toEqual(groupWithCalendars);

    await expect(
      apiService.unassignCalendarsFromGroup(20, { calendarIds: [7] }),
    ).resolves.toEqual(groupWithCalendars);

    await expect(
      apiService.shareCalendarGroup(20, {
        userIds: [9],
        permission: SharePermission.READ,
      }),
    ).resolves.toEqual(sharedPayload);

    await expect(apiService.unshareCalendarGroup(20, [9])).resolves.toEqual(
      unsharedPayload,
    );

    await expect(apiService.deleteCalendarGroup(20)).resolves.toBeUndefined();

    expect(mockedSecureFetch.mock.calls[0]?.[0]).toBe(
      'https://api.test/api/calendar-groups/20',
    );
    expect(mockedSecureFetch.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Updated Group',
          isVisible: false,
        }),
      }),
    );
    expect(mockedSecureFetch.mock.calls[1]?.[0]).toBe(
      'https://api.test/api/calendar-groups/20/calendars',
    );
    expect(mockedSecureFetch.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarIds: [7] }),
      }),
    );
    expect(mockedSecureFetch.mock.calls[2]?.[0]).toBe(
      'https://api.test/api/calendar-groups/20/calendars/unassign',
    );
    expect(mockedSecureFetch.mock.calls[2]?.[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarIds: [7] }),
      }),
    );
    expect(mockedSecureFetch.mock.calls[3]?.[0]).toBe(
      'https://api.test/api/calendar-groups/20/share',
    );
    expect(mockedSecureFetch.mock.calls[3]?.[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: [9],
          permission: SharePermission.READ,
        }),
      }),
    );
    expect(mockedSecureFetch.mock.calls[4]?.[1]).toEqual(
      expect.objectContaining({
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: [9] }),
      }),
    );
    expect(mockedSecureFetch.mock.calls[5]?.[1]).toEqual(
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('returns calendar sync success payloads and forwards sync request options', async () => {
    const syncStatus = {
      providers: [
        {
          provider: 'google',
          isConnected: true,
          calendars: [{ id: 'g-1' }],
          syncedCalendars: ['g-1'],
        },
      ],
    };
    const syncPayload = {
      provider: 'google',
      calendars: [
        {
          externalId: 'g-1',
          localName: 'Google Primary',
          triggerAutomationRules: true,
          selectedRuleIds: [7, 8],
        },
      ],
    };
    const syncResult = { imported: 1, updated: 0 };
    const forceResult = { queued: true };

    mockedSecureFetch
      .mockResolvedValueOnce(response(syncStatus))
      .mockResolvedValueOnce(response({ authUrl: 'https://accounts.example.test/auth' }))
      .mockResolvedValueOnce(response(syncResult))
      .mockResolvedValueOnce(response({ success: true }))
      .mockResolvedValueOnce(response({ success: true }))
      .mockResolvedValueOnce(response(forceResult));

    await expect(apiService.getCalendarSyncStatus()).resolves.toEqual(syncStatus);
    await expect(apiService.getCalendarAuthUrl('google')).resolves.toBe(
      'https://accounts.example.test/auth',
    );
    await expect(apiService.syncCalendars(syncPayload)).resolves.toEqual(
      syncResult,
    );
    await expect(
      apiService.disconnectCalendarProvider('google'),
    ).resolves.toBeUndefined();
    await expect(apiService.disconnectCalendarProvider()).resolves.toBeUndefined();
    await expect(apiService.forceCalendarSync()).resolves.toEqual(forceResult);

    expect(mockedSecureFetch.mock.calls[0]?.[0]).toBe(
      'https://api.test/api/calendar-sync/status',
    );
    expect(mockedSecureFetch.mock.calls[1]?.[0]).toBe(
      'https://api.test/api/calendar-sync/auth/google',
    );
    expect(mockedSecureFetch.mock.calls[2]?.[0]).toBe(
      'https://api.test/api/calendar-sync/sync',
    );
    expect(mockedSecureFetch.mock.calls[2]?.[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(syncPayload),
        timeoutMs: 120000,
      }),
    );
    expect(mockedSecureFetch.mock.calls[3]?.[0]).toBe(
      'https://api.test/api/calendar-sync/disconnect/google',
    );
    expect(mockedSecureFetch.mock.calls[3]?.[1]).toEqual(
      expect.objectContaining({ method: 'POST' }),
    );
    expect(mockedSecureFetch.mock.calls[4]?.[0]).toBe(
      'https://api.test/api/calendar-sync/disconnect',
    );
    expect(mockedSecureFetch.mock.calls[4]?.[1]).toEqual(
      expect.objectContaining({ method: 'POST' }),
    );
    expect(mockedSecureFetch.mock.calls[5]?.[0]).toBe(
      'https://api.test/api/calendar-sync/force',
    );
    expect(mockedSecureFetch.mock.calls[5]?.[1]).toEqual(
      expect.objectContaining({ method: 'POST', timeoutMs: 60000 }),
    );
  });

  it('builds normalized task queries and returns the task list payload', async () => {
    const taskList = {
      data: [
        {
          id: 21,
          title: 'Ship release notes',
          body: 'Draft the release notes for the sprint',
          color: '#f97316',
          priority: 'high',
          status: 'todo',
          ownerId: 1,
          labels: [],
          createdAt: '2026-04-03T10:00:00.000Z',
          updatedAt: '2026-04-03T10:00:00.000Z',
        },
      ],
      total: 1,
      page: 2,
      limit: 25,
    };

    mockedSecureFetch.mockResolvedValueOnce(response(taskList));

    await expect(
      apiService.getTasks({
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        search: 'release notes',
        dueFrom: '2026-04-01',
        dueTo: '2026-04-30',
        labelIds: [1, '2', '3:4', '2', 0, 'abc', 1] as unknown as number[],
        sortBy: 'updatedAt',
        sortDirection: 'desc',
        page: 2,
        limit: 25,
      }),
    ).resolves.toEqual(taskList);

    const requestedUrl = new URL(
      mockedSecureFetch.mock.calls[0]?.[0] as string,
    );
    expect(requestedUrl.pathname).toBe('/api/tasks');
    expect(requestedUrl.searchParams.get('status')).toBe('todo');
    expect(requestedUrl.searchParams.get('priority')).toBe('high');
    expect(requestedUrl.searchParams.get('search')).toBe('release notes');
    expect(requestedUrl.searchParams.get('dueFrom')).toBe('2026-04-01');
    expect(requestedUrl.searchParams.get('dueTo')).toBe('2026-04-30');
    expect(requestedUrl.searchParams.getAll('labelIds')).toEqual([
      '1',
      '2',
      '3',
      '4',
      '0',
    ]);
    expect(requestedUrl.searchParams.get('sortBy')).toBe('updatedAt');
    expect(requestedUrl.searchParams.get('sortDirection')).toBe('desc');
    expect(requestedUrl.searchParams.get('page')).toBe('2');
    expect(requestedUrl.searchParams.get('limit')).toBe('25');
  });

  it('falls back to the default task creation error when the response body is invalid JSON', async () => {
    mockedSecureFetch.mockResolvedValueOnce(
      response('invalid task payload', {
        ok: false,
        status: 500,
        jsonRejects: true,
      }),
    );

    await expect(
      apiService.createTask({
        title: 'Write docs',
        body: 'Document the release process',
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
        labelIds: [3],
      }),
    ).rejects.toThrow('Failed to create task');
  });

  it('surfaces fallback task update and delete errors when non-JSON bodies are returned', async () => {
    mockedSecureFetch
      .mockResolvedValueOnce(
        response('broken update', { ok: false, status: 500, jsonRejects: true }),
      )
      .mockResolvedValueOnce(
        response('broken delete', { ok: false, status: 500, jsonRejects: true }),
      );

    await expect(
      apiService.updateTask(21, { title: 'Updated title' }),
    ).rejects.toThrow('Failed to update task');

    await expect(apiService.deleteTask(21)).rejects.toThrow(
      'Failed to delete task',
    );
  });

  it('returns task labels as-is and surfaces label creation fallback errors', async () => {
    const labels = [
      {
        id: 7,
        name: 'Urgent',
        color: '#ef4444',
        userId: 1,
        createdAt: '2026-04-03T10:00:00.000Z',
        updatedAt: '2026-04-03T10:00:00.000Z',
      },
    ];

    mockedSecureFetch
      .mockResolvedValueOnce(response(labels))
      .mockResolvedValueOnce(
        response('invalid label payload', {
          ok: false,
          status: 500,
          jsonRejects: true,
        }),
      );

    await expect(apiService.getTaskLabels()).resolves.toEqual(labels);

    await expect(
      apiService.createTaskLabel({
        name: 'Blocked',
        color: '#111827',
      }),
    ).rejects.toThrow('Failed to create label');
  });

  it('updates, deletes, adds, and removes task labels via task-label endpoints', async () => {
    const updatedLabel = {
      id: 7,
      name: 'Urgent Updated',
      color: '#b91c1c',
      userId: 1,
    };
    const taskWithLabels = {
      id: 31,
      title: 'Task with labels',
      labels: [{ id: 7, name: 'Urgent Updated', color: '#b91c1c' }],
    };

    mockedSecureFetch
      .mockResolvedValueOnce(response(updatedLabel))
      .mockResolvedValueOnce(response({ success: true }))
      .mockResolvedValueOnce(response(taskWithLabels))
      .mockResolvedValueOnce(response(taskWithLabels));

    await expect(
      apiService.updateTaskLabel(7, { name: 'Urgent Updated', color: '#b91c1c' }),
    ).resolves.toEqual(updatedLabel);

    await expect(apiService.deleteTaskLabel(7)).resolves.toBeUndefined();

    await expect(
      apiService.addTaskLabels(31, { labelIds: [7] }),
    ).resolves.toEqual(taskWithLabels);

    await expect(apiService.removeTaskLabel(31, 7)).resolves.toEqual(
      taskWithLabels,
    );

    expect(mockedSecureFetch.mock.calls[0]?.[0]).toBe(
      'https://api.test/api/task-labels/7',
    );
    expect(mockedSecureFetch.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({ method: 'PATCH' }),
    );
    expect(mockedSecureFetch.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({ method: 'DELETE' }),
    );
    expect(mockedSecureFetch.mock.calls[2]?.[0]).toBe(
      'https://api.test/api/tasks/31/labels',
    );
    expect(mockedSecureFetch.mock.calls[3]?.[0]).toBe(
      'https://api.test/api/tasks/31/labels/7',
    );
  });

  it('includes a resourceId query parameter when fetching reservations', async () => {
    const reservations = [
      {
        id: 41,
        startTime: '2026-04-03T12:00:00.000Z',
        endTime: '2026-04-03T13:00:00.000Z',
        quantity: 1,
        status: 'confirmed',
        resourceId: 88,
      },
    ];

    mockedSecureFetch.mockResolvedValueOnce(response(reservations));

    await expect(apiService.getReservations('room A/1')).resolves.toEqual(
      reservations,
    );

    expect(mockedSecureFetch.mock.calls[0]?.[0]).toBe(
      'https://api.test/api/reservations?resourceId=room%20A%2F1',
    );
  });

  it('propagates the default reservations error when the endpoint fails', async () => {
    mockedSecureFetch.mockResolvedValueOnce(
      response({ message: 'down' }, { ok: false, status: 500 }),
    );

    await expect(apiService.getReservations()).rejects.toThrow(
      'Unable to load reservations',
    );
  });
});
