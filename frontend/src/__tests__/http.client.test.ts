import { http, HttpError } from '../lib/http';
import { secureFetch } from '../services/authErrorHandler';

jest.mock('../config/apiConfig', () => ({
  BASE_URL: 'https://api.test',
}));

jest.mock('../services/authErrorHandler', () => ({
  secureFetch: jest.fn(),
}));

describe('http client', () => {
  const mockedSecureFetch = secureFetch as jest.MockedFunction<
    typeof secureFetch
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
    }) as Response;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('unwraps success envelopes from API responses', async () => {
    mockedSecureFetch.mockResolvedValueOnce(
      response({
        success: true,
        data: { id: 9, title: 'Task' },
      }),
    );

    await expect(http.get('/api/tasks/9')).resolves.toEqual({
      id: 9,
      title: 'Task',
    });
    expect(mockedSecureFetch).toHaveBeenCalledWith(
      'https://api.test/api/tasks/9',
      {},
    );
  });

  it('returns undefined for 204 responses', async () => {
    const jsonSpy = jest.fn();
    mockedSecureFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: jsonSpy,
    } as unknown as Response);

    await expect(http.delete('/api/tasks/9')).resolves.toBeUndefined();
    expect(jsonSpy).not.toHaveBeenCalled();
  });

  it('throws HttpError using nested API error metadata when present', async () => {
    mockedSecureFetch.mockResolvedValueOnce(
      response(
        {
          error: {
            code: 'CONFLICT',
            message: 'Resource already exists',
            details: { resourceId: 9 },
            requestId: 'req-123',
          },
        },
        { ok: false, status: 409 },
      ),
    );

    await expect(http.get('/api/conflict')).rejects.toMatchObject({
      name: 'HttpError',
      status: 409,
      code: 'CONFLICT',
      message: 'Resource already exists',
      details: { resourceId: 9 },
      requestId: 'req-123',
    });
  });

  it('falls back to mapped status-code errors when payload is unavailable', async () => {
    mockedSecureFetch.mockResolvedValueOnce(
      response('non-json', { ok: false, status: 403, jsonRejects: true }),
    );

    await expect(http.get('/api/admin')).rejects.toEqual(
      expect.objectContaining({
        name: 'HttpError',
        status: 403,
        code: 'FORBIDDEN',
        message: 'HTTP 403',
      }),
    );
  });

  it('sends JSON headers and serialized body for post/patch helpers', async () => {
    mockedSecureFetch
      .mockResolvedValueOnce(response({ id: 1 }))
      .mockResolvedValueOnce(response({ id: 1, title: 'Updated' }));

    await http.post('/api/tasks', { title: 'Draft' });
    await http.patch('/api/tasks/1', { title: 'Updated' });

    expect(mockedSecureFetch.mock.calls[0]).toEqual([
      'https://api.test/api/tasks',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Draft' }),
      },
    ]);
    expect(mockedSecureFetch.mock.calls[1]).toEqual([
      'https://api.test/api/tasks/1',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated' }),
      },
    ]);
  });

  it('uses status-code fallback for rate-limit errors without explicit error code', async () => {
    mockedSecureFetch.mockResolvedValueOnce(
      response({ message: 'Too many requests' }, { ok: false, status: 429 }),
    );

    try {
      await http.get('/api/rate-limited');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).code).toBe('RATE_LIMITED');
      expect((error as HttpError).status).toBe(429);
    }
  });
});
