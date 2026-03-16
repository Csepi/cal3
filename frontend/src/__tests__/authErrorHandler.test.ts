import { AuthErrorHandler, secureFetch } from '../services/authErrorHandler';
import { sessionManager } from '../services/sessionManager';
import { applyCsrfHeader } from '../services/csrf';
import { isNativeClient } from '../services/clientPlatform';

jest.mock('../services/sessionManager', () => ({
  sessionManager: {
    clearSession: jest.fn(),
    hasActiveSession: jest.fn(),
    peekAccessToken: jest.fn(),
    getAccessToken: jest.fn(),
    refreshAccessToken: jest.fn(),
  },
}));

jest.mock('../services/csrf', () => ({
  applyCsrfHeader: jest.fn(),
}));

jest.mock('../services/clientPlatform', () => ({
  isNativeClient: jest.fn(() => false),
}));

jest.mock('../utils/clientLogger', () => ({
  clientLogger: {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('AuthErrorHandler + secureFetch', () => {
  const mockedSession = sessionManager as jest.Mocked<typeof sessionManager>;
  const mockedApplyCsrfHeader = applyCsrfHeader as jest.MockedFunction<typeof applyCsrfHeader>;
  const mockedIsNativeClient = isNativeClient as jest.MockedFunction<typeof isNativeClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockedSession.hasActiveSession.mockReturnValue(true);
    mockedSession.peekAccessToken.mockReturnValue('a.b.c');
    mockedSession.getAccessToken.mockResolvedValue('a.b.c');
    mockedSession.refreshAccessToken.mockResolvedValue(null);
    mockedIsNativeClient.mockReturnValue(false);

    localStorage.clear();
    sessionStorage.clear();
    (global as unknown as { fetch?: unknown }).fetch = undefined;
    window.history.replaceState({}, '', '/login');
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('getInstance returns a singleton', () => {
    const a = AuthErrorHandler.getInstance();
    const b = AuthErrorHandler.getInstance();
    expect(a).toBe(b);
  });

  test('isAuthenticated proxies session manager', () => {
    mockedSession.hasActiveSession.mockReturnValueOnce(true).mockReturnValueOnce(false);

    const handler = AuthErrorHandler.getInstance();
    expect(handler.isAuthenticated()).toBe(true);
    expect(handler.isAuthenticated()).toBe(false);
  });

  test.each([
    ['a.b.c', true],
    ['missing-dot', false],
    ['', false],
    [null, false],
  ])('hasValidTokenFormat(%p) -> %p', (token, expected) => {
    mockedSession.peekAccessToken.mockReturnValue(token as string | null);
    const handler = AuthErrorHandler.getInstance();
    expect(handler.hasValidTokenFormat()).toBe(expected);
  });

  test('handleAuthError clears session and storage for web clients', () => {
    localStorage.setItem('cache_sample', '1');
    localStorage.setItem('api_profile', '2');
    localStorage.setItem('userProfile', '3');
    localStorage.setItem('userPermissions', '4');
    localStorage.setItem('custom', 'keep');
    sessionStorage.setItem('sessionOnly', 'x');

    const handler = AuthErrorHandler.getInstance();
    handler.handleAuthError(401, '/api/protected');

    expect(mockedSession.clearSession).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('cache_sample')).toBeNull();
    expect(localStorage.getItem('api_profile')).toBeNull();
    expect(localStorage.getItem('userProfile')).toBeNull();
    expect(localStorage.getItem('userPermissions')).toBeNull();
    expect(localStorage.getItem('custom')).toBe('keep');
    expect(sessionStorage.getItem('sessionOnly')).toBeNull();
  });

  test('handleAuthError does not clear session in native client mode', () => {
    mockedIsNativeClient.mockReturnValue(true);

    const handler = AuthErrorHandler.getInstance();
    handler.handleAuthError(401, '/api/protected');

    expect(mockedSession.clearSession).not.toHaveBeenCalled();
  });

  test('secureFetch attaches bearer token and csrf header on mutating methods', async () => {
    const fetchSpy = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      text: async () => '',
    });
    (global as unknown as { fetch: typeof fetch }).fetch = fetchSpy as unknown as typeof fetch;

    await secureFetch('https://example.test/api/events', {
      method: 'POST',
      body: JSON.stringify({ title: 'test' }),
    });

    const requestInit = fetchSpy.mock.calls[0][1] as RequestInit;
    const headers = requestInit.headers as Headers;

    expect(mockedSession.getAccessToken).toHaveBeenCalled();
    expect(headers.get('Authorization')).toBe('Bearer a.b.c');
    expect(mockedApplyCsrfHeader).toHaveBeenCalled();
  });

  test('secureFetch retries once after 401 when refresh succeeds', async () => {
    mockedSession.refreshAccessToken.mockResolvedValue('x.y.z');

    const fetchSpy = jest
      .fn()
      .mockResolvedValueOnce({ status: 401, ok: false, text: async () => '' })
      .mockResolvedValueOnce({ status: 200, ok: true, text: async () => '' });
    (global as unknown as { fetch: typeof fetch }).fetch = fetchSpy as unknown as typeof fetch;

    const response = await secureFetch('https://example.test/api/protected', {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    expect(mockedSession.refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  test('secureFetch returns forbidden responses without clearing session', async () => {
    const fetchSpy = jest.fn().mockResolvedValue({
      status: 403,
      ok: false,
      text: async () => '',
    });
    (global as unknown as { fetch: typeof fetch }).fetch = fetchSpy as unknown as typeof fetch;

    const response = await secureFetch('https://example.test/api/admin', {
      method: 'GET',
    });

    expect(response.status).toBe(403);
    expect(mockedSession.clearSession).not.toHaveBeenCalled();
  });

  test('secureFetch handles 401 by clearing session when refresh fails', async () => {
    mockedSession.refreshAccessToken.mockResolvedValue(null);

    const fetchSpy = jest.fn().mockResolvedValue({
      status: 401,
      ok: false,
      text: async () => '',
    });
    (global as unknown as { fetch: typeof fetch }).fetch =
      fetchSpy as unknown as typeof fetch;

    await expect(
      secureFetch('https://example.test/api/protected', { method: 'GET' }),
    ).rejects.toThrow('Authentication error: 401');

    expect(mockedSession.clearSession).toHaveBeenCalled();
  });

  test('secureFetch handles network failure and clears invalid sessions', async () => {
    mockedSession.peekAccessToken.mockReturnValue('invalid');

    const fetchSpy = jest.fn().mockRejectedValue(new Error('network down'));
    (global as unknown as { fetch: typeof fetch }).fetch = fetchSpy as unknown as typeof fetch;

    await expect(
      secureFetch('https://example.test/api/protected', { method: 'GET' }),
    ).rejects.toThrow('network down');

    expect(mockedSession.clearSession).toHaveBeenCalled();
  });
});
