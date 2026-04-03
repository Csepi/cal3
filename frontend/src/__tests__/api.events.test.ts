import { apiService } from '../services/api';
import { secureFetch } from '../services/authErrorHandler';
import { sessionManager } from '../services/sessionManager';
import { RecurrenceEndType, RecurrenceType } from '../types/Event';

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

describe('apiService event endpoints', () => {
  const mockedSecureFetch = secureFetch as jest.MockedFunction<typeof secureFetch>;
  const mockedSessionManager = sessionManager as jest.Mocked<typeof sessionManager>;

  const response = <T,>(
    body: T,
    init: { ok?: boolean; status?: number } = {},
  ): Response =>
    ({
      ok: init.ok ?? true,
      status: init.status ?? 200,
      json: async () => body,
      text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
      headers: { get: () => null },
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

  it('creates events and sends the expected payload to the backend', async () => {
    const createdEvent = {
      id: 101,
      title: 'Sprint planning',
      startDate: '2026-04-03',
      startTime: '09:00',
      endDate: '2026-04-03',
      endTime: '10:00',
      isAllDay: false,
      calendarId: 12,
      createdAt: '2026-04-03T09:00:00.000Z',
      updatedAt: '2026-04-03T09:00:00.000Z',
    };

    mockedSecureFetch.mockResolvedValueOnce(response(createdEvent));

    await expect(
      apiService.createEvent({
        title: 'Sprint planning',
        description: 'Weekly planning slot',
        startDate: '2026-04-03',
        startTime: '09:00',
        endDate: '2026-04-03',
        endTime: '10:00',
        calendarId: 12,
        labels: ['planning'],
      }),
    ).resolves.toEqual(createdEvent);

    expect(mockedSecureFetch).toHaveBeenCalledWith(
      'https://api.test/api/events',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Sprint planning',
          description: 'Weekly planning slot',
          startDate: '2026-04-03',
          startTime: '09:00',
          endDate: '2026-04-03',
          endTime: '10:00',
          calendarId: 12,
          labels: ['planning'],
        }),
      }),
    );
  });

  it('creates recurring events and returns the parent event from the response payload', async () => {
    const parentEvent = {
      id: 201,
      title: 'Daily standup',
      startDate: '2026-04-03',
      startTime: '10:00',
      endDate: '2026-04-03',
      endTime: '10:15',
      isAllDay: false,
      calendarId: 12,
      createdAt: '2026-04-03T10:00:00.000Z',
      updatedAt: '2026-04-03T10:00:00.000Z',
    };

    mockedSecureFetch.mockResolvedValueOnce(response([parentEvent, { ...parentEvent, id: 202 }]));

    await expect(
      apiService.createEventWithRecurrence(
        {
          title: 'Daily standup',
          startDate: '2026-04-03',
          startTime: '10:00',
          endDate: '2026-04-03',
          endTime: '10:15',
          calendarId: 12,
        },
        {
          type: RecurrenceType.DAILY,
          interval: 2,
          endType: RecurrenceEndType.COUNT,
          count: 5,
          timezone: 'Europe/Budapest',
        },
      ),
    ).resolves.toEqual(parentEvent);

    expect(mockedSecureFetch).toHaveBeenCalledWith(
      'https://api.test/api/events/recurring',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Daily standup',
          startDate: '2026-04-03',
          startTime: '10:00',
          endDate: '2026-04-03',
          endTime: '10:15',
          calendarId: 12,
          recurrence: {
            type: 'daily',
            interval: 2,
            endType: 'count',
            count: 5,
            timezone: 'Europe/Budapest',
          },
        }),
      }),
    );
  });

  it('updates and deletes events with the expected endpoint wiring', async () => {
    const updatedEvent = {
      id: 301,
      title: 'Updated planning',
      startDate: '2026-04-04',
      startTime: '11:00',
      endDate: '2026-04-04',
      endTime: '12:00',
      isAllDay: false,
      calendarId: 14,
      createdAt: '2026-04-03T11:00:00.000Z',
      updatedAt: '2026-04-03T11:00:00.000Z',
    };

    mockedSecureFetch
      .mockResolvedValueOnce(response(updatedEvent))
      .mockResolvedValueOnce(response(undefined));

    await expect(
      apiService.updateEvent(301, {
        title: 'Updated planning',
        startDate: '2026-04-04',
        startTime: '11:00',
        endDate: '2026-04-04',
        endTime: '12:00',
        calendarId: 14,
      }),
    ).resolves.toEqual(updatedEvent);

    await expect(apiService.deleteEvent(301, 'future')).resolves.toBeUndefined();

    expect(mockedSecureFetch).toHaveBeenNthCalledWith(
      1,
      'https://api.test/api/events/301',
      expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Updated planning',
          startDate: '2026-04-04',
          startTime: '11:00',
          endDate: '2026-04-04',
          endTime: '12:00',
          calendarId: 14,
        }),
      }),
    );
    expect(mockedSecureFetch).toHaveBeenNthCalledWith(
      2,
      'https://api.test/api/events/301?scope=future',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('surfaces default event mutation errors when the backend returns an empty body', async () => {
    mockedSecureFetch
      .mockResolvedValueOnce(response({}, { ok: false, status: 500 }))
      .mockResolvedValueOnce(response({}, { ok: false, status: 500 }))
      .mockResolvedValueOnce(response({}, { ok: false, status: 500 }));

    await expect(
      apiService.createEvent({
        title: 'Broken event',
        startDate: '2026-04-03',
        calendarId: 12,
      }),
    ).rejects.toThrow('Failed to create event');

    await expect(
      apiService.updateEvent(9, {
        title: 'Broken event',
        startDate: '2026-04-03',
        calendarId: 12,
      }),
    ).rejects.toThrow('Failed to update event');

    await expect(apiService.deleteEvent(9)).rejects.toThrow('Failed to delete event');
  });

  it('surfaces authentication-specific failures for recurring event creation', async () => {
    mockedSecureFetch.mockResolvedValueOnce(
      response({ message: 'unauthorized' }, { ok: false, status: 401 }),
    );

    await expect(
      apiService.createEventWithRecurrence(
        {
          title: 'Recurring event',
          startDate: '2026-04-03',
          startTime: '09:00',
          endDate: '2026-04-03',
          endTime: '09:30',
          calendarId: 12,
        },
        {
          type: RecurrenceType.WEEKLY,
          daysOfWeek: ['mon'],
        },
      ),
    ).rejects.toThrow(
      'Authentication required. Please log in to create recurring events.',
    );
  });
});
