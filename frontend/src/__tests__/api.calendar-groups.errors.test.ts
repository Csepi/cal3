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

describe('apiService calendar-group edge cases', () => {
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
      headers: { get: () => null },
    }) as unknown as Response;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedSessionManager.getCurrentUser.mockReturnValue({
      id: 1,
      username: 'current-user',
    } as never);
  });

  it('rejects calendar group fetch with explicit auth message for 401', async () => {
    mockedSecureFetch.mockResolvedValueOnce(
      response({ message: 'unauthorized' }, { ok: false, status: 401 }),
    );

    await expect(apiService.getCalendarGroups()).rejects.toThrow(
      'Authentication required. Please log in to view calendar groups.',
    );
  });

  it('surfaces fallback fetch errors when primary group route returns 404', async () => {
    mockedSecureFetch
      .mockResolvedValueOnce(
        response({ message: 'not found' }, { ok: false, status: 404 }),
      )
      .mockResolvedValueOnce(
        response({ message: 'fallback exploded' }, { ok: false, status: 500 }),
      );

    await expect(apiService.getCalendarGroups()).rejects.toThrow(
      'fallback exploded',
    );
  });

  it('surfaces fallback create errors when both primary and fallback create fail', async () => {
    mockedSecureFetch
      .mockResolvedValueOnce(
        response({ message: 'not found' }, { ok: false, status: 404 }),
      )
      .mockResolvedValueOnce(
        response('plain-text', { ok: false, status: 500, jsonRejects: true }),
      );

    await expect(
      apiService.createCalendarGroup({
        name: 'Ops',
        isVisible: true,
      }),
    ).rejects.toThrow('Failed to create calendar group');
  });

  it('passes userIds in DELETE body for unshare and preserves backend restriction errors', async () => {
    mockedSecureFetch.mockResolvedValueOnce(
      response({ message: 'forbidden for non-owner' }, { ok: false, status: 403 }),
    );

    await expect(apiService.unshareCalendarGroup(9, [2, 3])).rejects.toThrow(
      'forbidden for non-owner',
    );

    expect(mockedSecureFetch).toHaveBeenCalledWith(
      'https://api.test/api/calendar-groups/9/share',
      expect.objectContaining({
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: [2, 3] }),
      }),
    );
  });

  it('loads reservations without resource filter query parameter', async () => {
    mockedSecureFetch.mockResolvedValueOnce(
      response([
        {
          id: 77,
          resourceId: 91,
          quantity: 1,
        },
      ]),
    );

    await expect(apiService.getReservations()).resolves.toEqual([
      { id: 77, resourceId: 91, quantity: 1 },
    ]);
    expect(mockedSecureFetch).toHaveBeenCalledWith(
      'https://api.test/api/reservations',
      {},
    );
  });
});
