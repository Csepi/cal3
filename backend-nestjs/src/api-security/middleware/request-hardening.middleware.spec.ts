import { NextFunction, Request, Response } from 'express';
import { RequestHardeningMiddleware } from './request-hardening.middleware';

describe('RequestHardeningMiddleware', () => {
  let middleware: RequestHardeningMiddleware;

  const invoke = (
    req: Partial<Request>,
  ): { error: unknown; called: boolean } => {
    let error: unknown = null;
    let called = false;
    const next: NextFunction = (err?: unknown) => {
      if (err) {
        error = err;
        return;
      }
      called = true;
    };
    middleware.use(req as Request, {} as Response, next);
    return { error, called };
  };

  beforeEach(() => {
    middleware = new RequestHardeningMiddleware();
  });

  it('rejects unsupported content type for mutating request', () => {
    const result = invoke({
      method: 'POST',
      headers: {
        'content-type': 'text/plain',
        'content-length': '10',
      },
      body: { hello: 'world' },
      path: '/api/test',
      url: '/api/test',
    });

    expect(result.error).toBeTruthy();
    expect(result.called).toBe(false);
  });

  it('rejects private webhook URLs by default', () => {
    const result = invoke({
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': '50',
      },
      body: {
        webhookUrl: 'http://127.0.0.1/hook',
      },
      path: '/api/automation/rules',
      url: '/api/automation/rules',
    });

    expect(result.error).toBeTruthy();
    expect(result.called).toBe(false);
  });

  it('allows valid JSON payload with safe URL', () => {
    const result = invoke({
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': '80',
      },
      body: {
        webhookUrl: 'https://hooks.primecal.eu/automation',
      },
      path: '/api/automation/rules',
      url: '/api/automation/rules',
    });

    expect(result.error).toBeNull();
    expect(result.called).toBe(true);
  });

  it('allows multipart upload on default profile-picture path', () => {
    const result = invoke({
      method: 'POST',
      headers: {
        'content-type': 'multipart/form-data; boundary=----x',
        'content-length': '128',
      },
      path: '/api/user/profile-picture',
      url: '/api/user/profile-picture',
    });

    expect(result.error).toBeNull();
    expect(result.called).toBe(true);
  });

  it('allows multipart upload when middleware receives mounted route path', () => {
    const result = invoke({
      method: 'POST',
      headers: {
        'content-type': 'multipart/form-data; boundary=----x',
        'content-length': '128',
      },
      path: '/',
      url: '/',
      baseUrl: '/api/user/profile-picture',
      originalUrl: '/api/user/profile-picture?source=onboarding',
    });

    expect(result.error).toBeNull();
    expect(result.called).toBe(true);
  });

  it('rejects multipart upload on non-whitelisted path', () => {
    const result = invoke({
      method: 'POST',
      headers: {
        'content-type': 'multipart/form-data; boundary=----x',
        'content-length': '128',
      },
      path: '/api/admin/import',
      url: '/api/admin/import',
    });

    expect(result.error).toBeTruthy();
    expect(result.called).toBe(false);
  });
});
