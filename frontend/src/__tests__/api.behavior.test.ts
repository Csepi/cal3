import { apiService } from '../services/api';
import { secureFetch } from '../services/authErrorHandler';
import { sessionManager } from '../services/sessionManager';

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

describe('apiService behavior', () => {
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

  it('normalizes task label ids when building a task query', async () => {
    mockedSecureFetch.mockResolvedValueOnce(
      response({
        data: [],
        pagination: { page: 1, limit: 25, total: 0, totalPages: 0 },
      }),
    );

    await apiService.getTasks({
      labelIds: [1, '2', '3:4', '2', 0, 'abc', 1] as unknown as number[],
    });

    const requestedUrl = new URL(
      mockedSecureFetch.mock.calls[0]?.[0] as string,
    );
    expect(requestedUrl.pathname).toBe('/api/tasks');
    expect(requestedUrl.searchParams.getAll('labelIds')).toEqual([
      '1',
      '2',
      '3',
      '4',
      '0',
    ]);
  });

  it('prefers top-level validation details over nested errors in login responses', async () => {
    mockedSecureFetch.mockResolvedValueOnce(
      response(
        {
          details: {
            fields: [
              {
                field: 'username',
                reasons: ['username is invalid'],
              },
            ],
          },
          error: {
            message: 'nested message should not win',
            details: {
              fields: [
                {
                  field: 'password',
                  reasons: ['password should not win'],
                },
              ],
            },
          },
          message: 'top-level message should not win',
        },
        { ok: false, status: 400 },
      ),
    );

    await expect(
      apiService.login('demo@example.com', 'password123'),
    ).rejects.toThrow('username: username is invalid');
  });

  it('falls back to nested validation details when top-level details are absent', async () => {
    mockedSecureFetch.mockResolvedValueOnce(
      response(
        {
          error: {
            details: {
              fields: [
                {
                  field: 'email',
                  reasons: ['email is already used'],
                },
              ],
            },
          },
        },
        { ok: false, status: 400 },
      ),
    );

    await expect(
      apiService.register({
        username: 'demo_user',
        email: 'demo@example.com',
        password: 'Password123!',
      }),
    ).rejects.toThrow('email: email is already used');
  });

  it('falls back to the default register error when the body is not JSON', async () => {
    mockedSecureFetch.mockResolvedValueOnce(
      response('plain text error body', {
        ok: false,
        status: 500,
        jsonRejects: true,
      }),
    );

    await expect(
      apiService.register({
        username: 'demo_user',
        email: 'demo@example.com',
        password: 'Password123!',
      }),
    ).rejects.toThrow('Unable to create your account right now.');
  });

  it('shapes username availability rate-limit errors with Retry-After', async () => {
    mockedSecureFetch.mockResolvedValueOnce(
      response({ message: 'rate limited' }, { ok: false, status: 429, retryAfter: '12' }),
    );

    await expect(
      apiService.checkUsernameAvailability('demo'),
    ).rejects.toMatchObject({
      name: 'AvailabilityRateLimitError',
      code: 'RATE_LIMITED',
      retryAfterSeconds: 12,
      message: 'Too many checks right now. Please wait 12 seconds and try again.',
    });
  });

  it('shapes email availability rate-limit errors without Retry-After', async () => {
    mockedSecureFetch.mockResolvedValueOnce(
      response({ message: 'rate limited' }, { ok: false, status: 429 }),
    );

    await expect(apiService.checkEmailAvailability('demo@example.com')).rejects.toMatchObject({
      name: 'AvailabilityRateLimitError',
      code: 'RATE_LIMITED',
      message: 'Too many checks right now. Please wait a moment and try again.',
    });
  });

  it('returns the calendar sync default payload when the endpoint is missing', async () => {
    mockedSecureFetch.mockResolvedValueOnce(
      response({ message: 'missing' }, { ok: false, status: 404 }),
    );

    await expect(apiService.getCalendarSyncStatus()).resolves.toEqual({
      providers: [
        {
          provider: 'google',
          isConnected: false,
          calendars: [],
          syncedCalendars: [],
        },
        {
          provider: 'microsoft',
          isConnected: false,
          calendars: [],
          syncedCalendars: [],
        },
      ],
    });
  });

  it('retries profile updates after removing unsupported optional fields', async () => {
    mockedSecureFetch
      .mockResolvedValueOnce(
        response({
          id: 1,
          username: 'current-user',
          hiddenFromLiveFocusTags: [],
          eventLabels: [],
        }),
      )
      .mockResolvedValueOnce(
        response(
          {
            error: {
              details: {
                fields: [
                  {
                    field: 'hiddenFromLiveFocusTags',
                    reasons: ['unsupported'],
                  },
                  {
                    field: 'eventLabels',
                    reasons: ['unsupported'],
                  },
                ],
              },
            },
          },
          { ok: false, status: 400 },
        ),
      )
      .mockResolvedValueOnce(
        response({
          id: 1,
          username: 'current-user',
          timezone: 'UTC',
        }),
      );

    const result = await apiService.updateUserProfile({
      hiddenFromLiveFocusTags: ['focus'],
      eventLabels: ['tag-a', 'tag-b'],
      timezone: 'Europe/Budapest',
    });

    expect(result).toEqual(
      expect.objectContaining({
        id: 1,
        timezone: 'UTC',
      }),
    );
    expect(mockedSecureFetch).toHaveBeenCalledTimes(3);

    const firstPatchBody = JSON.parse(
      mockedSecureFetch.mock.calls[1]?.[1]?.body as string,
    ) as Record<string, unknown>;
    const retryPatchBody = JSON.parse(
      mockedSecureFetch.mock.calls[2]?.[1]?.body as string,
    ) as Record<string, unknown>;

    expect(firstPatchBody.hiddenFromLiveFocusTags).toEqual(['focus']);
    expect(firstPatchBody.eventLabels).toEqual(['tag-a', 'tag-b']);
    expect(retryPatchBody.hiddenFromLiveFocusTags).toBeUndefined();
    expect(retryPatchBody.eventLabels).toBeUndefined();
    expect(retryPatchBody.timezone).toBe('Europe/Budapest');
  });
});
