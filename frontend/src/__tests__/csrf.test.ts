const clearAllCookies = () => {
  const entries = document.cookie.split(';').map((cookie) => cookie.trim()).filter(Boolean);
  for (const entry of entries) {
    const [key] = entry.split('=');
    document.cookie = `${key}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict`;
  }
};

describe('csrf service', () => {
  beforeEach(() => {
    jest.resetModules();
    clearAllCookies();
    jest.restoreAllMocks();
    (global as unknown as { fetch?: unknown }).fetch = undefined;
  });

  test('ensureCsrfToken creates and stores a token when missing', async () => {
    const csrf = await import('../services/csrf');

    const token = csrf.ensureCsrfToken();

    expect(token).toHaveLength(32);
    expect(csrf.getCsrfToken()).toBe(token);
  });

  test('clearCsrfToken removes csrf cookie', async () => {
    const csrf = await import('../services/csrf');

    const token = csrf.ensureCsrfToken();
    expect(token).toHaveLength(32);

    csrf.clearCsrfToken();
    expect(csrf.getCsrfToken()).toBeNull();
  });

  test('applyCsrfHeader sets header from existing token', async () => {
    const csrf = await import('../services/csrf');

    const token = csrf.ensureCsrfToken();
    const headers = new Headers();

    csrf.applyCsrfHeader(headers);

    expect(headers.get('X-CSRF-Token')).toBe(token);
  });

  test('applyCsrfHeader force mode creates token if absent', async () => {
    const csrf = await import('../services/csrf');

    const headers = new Headers();
    csrf.applyCsrfHeader(headers, true);

    expect(headers.get('X-CSRF-Token')).toHaveLength(32);
    expect(csrf.getCsrfToken()).toBe(headers.get('X-CSRF-Token'));
  });

  test('ensureCsrfTokenFromServer returns existing token without fetch', async () => {
    const csrf = await import('../services/csrf');

    const existing = csrf.ensureCsrfToken();
    const fetchSpy = jest.fn();
    (global as unknown as { fetch: typeof fetch }).fetch = fetchSpy as unknown as typeof fetch;

    const result = await csrf.ensureCsrfTokenFromServer();

    expect(result).toBe(existing);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('ensureCsrfTokenFromServer writes token returned by backend', async () => {
    const csrf = await import('../services/csrf');

    const fetchSpy = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ csrfToken: 'server-issued-token' }),
    });
    (global as unknown as { fetch: typeof fetch }).fetch = fetchSpy as unknown as typeof fetch;

    const token = await csrf.ensureCsrfTokenFromServer();

    expect(token).toBe('server-issued-token');
    expect(csrf.getCsrfToken()).toBe('server-issued-token');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  test('ensureCsrfTokenFromServer falls back to generated token when backend fails', async () => {
    const csrf = await import('../services/csrf');

    const fetchSpy = jest.fn().mockRejectedValue(new Error('network down'));
    (global as unknown as { fetch: typeof fetch }).fetch = fetchSpy as unknown as typeof fetch;

    const token = await csrf.ensureCsrfTokenFromServer();

    expect(token).toHaveLength(32);
    expect(csrf.getCsrfToken()).toBe(token);
  });

  test('ensureCsrfTokenFromServer deduplicates parallel sync calls', async () => {
    const csrf = await import('../services/csrf');

    const fetchSpy = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ csrfToken: 'parallel-token' }),
    });
    (global as unknown as { fetch: typeof fetch }).fetch = fetchSpy as unknown as typeof fetch;

    const first = csrf.ensureCsrfTokenFromServer();
    const second = csrf.ensureCsrfTokenFromServer();

    const [a, b] = await Promise.all([first, second]);

    expect(a).toBe('parallel-token');
    expect(b).toBe('parallel-token');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  test.each([
    ['alpha token'],
    ['token-with-dash'],
    ['token_with_underscore'],
  ])('getCsrfToken reads cookie value (%s)', async (cookieValue) => {
    const csrf = await import('../services/csrf');

    document.cookie = `cal3_csrf_token=${encodeURIComponent(cookieValue)}; Path=/; SameSite=Strict`;

    expect(csrf.getCsrfToken()).toBe(cookieValue);
  });
});
