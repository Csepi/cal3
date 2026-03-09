import { ForbiddenException } from '@nestjs/common';
import { StrictOriginMiddleware } from './strict-origin.middleware';

const createRequest = (overrides: Record<string, unknown> = {}) =>
  ({
    method: 'GET',
    path: '/api/tasks',
    url: '/api/tasks',
    originalUrl: '/api/tasks',
    headers: {},
    ...overrides,
  }) as any;

describe('StrictOriginMiddleware', () => {
  const originalOrigins = process.env.SECURITY_ALLOWED_ORIGINS;

  beforeEach(() => {
    process.env.SECURITY_ALLOWED_ORIGINS =
      'https://app.primecal.eu,https://admin.primecal.eu';
  });

  afterAll(() => {
    if (originalOrigins === undefined) {
      delete process.env.SECURITY_ALLOWED_ORIGINS;
    } else {
      process.env.SECURITY_ALLOWED_ORIGINS = originalOrigins;
    }
  });

  it('allows non-mutating requests regardless of origin', () => {
    const middleware = new StrictOriginMiddleware();
    const req = createRequest({
      method: 'GET',
      headers: { origin: 'https://evil.example' },
    });
    const next = jest.fn();

    middleware.use(req, {} as any, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('allows mutating requests when origin header is absent', () => {
    const middleware = new StrictOriginMiddleware();
    const req = createRequest({ method: 'POST' });
    const next = jest.fn();

    middleware.use(req, {} as any, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('allows mutating requests from allowed origin', () => {
    const middleware = new StrictOriginMiddleware();
    const req = createRequest({
      method: 'PATCH',
      headers: { origin: 'https://app.primecal.eu' },
    });
    const next = jest.fn();

    middleware.use(req, {} as any, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('blocks mutating requests from disallowed origin', () => {
    const middleware = new StrictOriginMiddleware();
    const req = createRequest({
      method: 'DELETE',
      headers: { origin: 'https://evil.example' },
    });
    const next = jest.fn();

    middleware.use(req, {} as any, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(ForbiddenException);
  });
});
