import { ForbiddenException } from '@nestjs/common';
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  CsrfService,
} from '../security/csrf.service';
import { CsrfProtectionMiddleware } from './csrf-protection.middleware';

const createRequest = (overrides: Record<string, unknown> = {}) =>
  ({
    method: 'GET',
    path: '/api/test',
    url: '/api/test',
    originalUrl: '/api/test',
    headers: {},
    cookies: {},
    secure: false,
    ...overrides,
  }) as any;

describe('CsrfProtectionMiddleware', () => {
  let middleware: CsrfProtectionMiddleware;
  let csrfService: CsrfService;

  beforeEach(() => {
    csrfService = new CsrfService();
    middleware = new CsrfProtectionMiddleware(csrfService);
  });

  it('issues CSRF cookie for requests without token cookie', () => {
    const req = createRequest();
    const res = { cookie: jest.fn() } as any;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(res.cookie).toHaveBeenCalledWith(
      CSRF_COOKIE_NAME,
      expect.any(String),
      expect.objectContaining({ httpOnly: false }),
    );
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects mutating request when cookie exists but header is missing', () => {
    const req = createRequest({
      method: 'POST',
      headers: {
        cookie: `${CSRF_COOKIE_NAME}=known-token`,
      },
      cookies: {
        [CSRF_COOKIE_NAME]: 'known-token',
      },
    });
    const res = { cookie: jest.fn() } as any;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(ForbiddenException);
  });

  it('rejects mutating request when header does not match cookie token', () => {
    const req = createRequest({
      method: 'PATCH',
      headers: {
        cookie: `${CSRF_COOKIE_NAME}=known-token`,
        [CSRF_HEADER_NAME]: 'different-token',
      },
      cookies: {
        [CSRF_COOKIE_NAME]: 'known-token',
      },
    });
    const res = { cookie: jest.fn() } as any;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(next.mock.calls[0][0]).toBeInstanceOf(ForbiddenException);
  });

  it('allows mutating request with matching header/cookie token', () => {
    const req = createRequest({
      method: 'DELETE',
      headers: {
        cookie: `${CSRF_COOKIE_NAME}=known-token`,
        [CSRF_HEADER_NAME]: 'known-token',
      },
      cookies: {
        [CSRF_COOKIE_NAME]: 'known-token',
      },
    });
    const res = { cookie: jest.fn() } as any;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('bootstraps CSRF cookie from header when request has cookies but no CSRF cookie', () => {
    const req = createRequest({
      method: 'POST',
      headers: {
        cookie: 'cal3_access_token=abc123',
        [CSRF_HEADER_NAME]: 'bootstrap-token',
      },
      cookies: {},
    });
    const res = { cookie: jest.fn() } as any;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(res.cookie).toHaveBeenCalledWith(
      CSRF_COOKIE_NAME,
      'bootstrap-token',
      expect.objectContaining({ httpOnly: false }),
    );
    expect(next).toHaveBeenCalledWith();
  });

  it('skips CSRF validation for excluded webhook path', () => {
    const req = createRequest({
      method: 'POST',
      path: '/api/automation/webhook/test-token',
      url: '/api/automation/webhook/test-token',
      originalUrl: '/api/automation/webhook/test-token',
      headers: {
        cookie: `${CSRF_COOKIE_NAME}=known-token`,
      },
      cookies: {
        [CSRF_COOKIE_NAME]: 'known-token',
      },
    });
    const res = { cookie: jest.fn() } as any;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('skips CSRF validation for mobile-native client header', () => {
    const req = createRequest({
      method: 'POST',
      headers: {
        cookie: `${CSRF_COOKIE_NAME}=known-token`,
        'x-primecal-client': 'mobile-native',
      },
      cookies: {
        [CSRF_COOKIE_NAME]: 'known-token',
      },
    });
    const res = { cookie: jest.fn() } as any;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });
});
