import { RequestSanitizationMiddleware } from './request-sanitization.middleware';

describe('RequestSanitizationMiddleware', () => {
  it('sanitizes body, query, and params payloads recursively', () => {
    const middleware = new RequestSanitizationMiddleware();
    const req = {
      body: {
        name: 'a\u0000b',
        nested: {
          label: 'x\u202Ey',
        },
      },
      query: {
        search: 'te\u0007st',
      },
      params: {
        id: '12\u0000',
      },
    } as any;

    const next = jest.fn();
    middleware.use(req, {} as any, next);

    expect(req.body).toEqual({
      name: 'ab',
      nested: {
        label: 'xy',
      },
    });
    expect(req.query).toEqual({ search: 'test' });
    expect(req.params).toEqual({ id: '12' });
    expect(next).toHaveBeenCalledTimes(1);
  });
});
