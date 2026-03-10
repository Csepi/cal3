import { BadRequestException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common/interfaces/features/execution-context.interface';
import { Reflector } from '@nestjs/core';
import { firstValueFrom, of } from 'rxjs';
import { IdempotencyInterceptor } from './idempotency.interceptor';

describe('IdempotencyInterceptor', () => {
  const originalEnv = { ...process.env };
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;
  const idempotencyService = {
    execute: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    reflector.getAllAndOverride = jest.fn().mockReturnValue(false);
  });

  function createContext(request: Record<string, unknown>) {
    const response = { setHeader: jest.fn() };
    return {
      getType: () => 'http',
      getHandler: () => ({}),
      getClass: () => class TestClass {},
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;
  }

  it('wraps mutating authenticated requests with idempotency execution', async () => {
    process.env.IDEMPOTENCY_REQUIRE_KEY_FOR_MUTATIONS = 'true';
    const interceptor = new IdempotencyInterceptor(
      reflector,
      idempotencyService as never,
    );
    idempotencyService.execute.mockImplementation(async (_opts, handler) =>
      handler(),
    );

    const context = createContext({
      method: 'POST',
      baseUrl: '/events',
      route: { path: '/:id' },
      headers: { 'idempotency-key': 'my_key_1234' },
      user: { id: 9 },
      body: { title: 'A' },
      params: { id: 1 },
      query: {},
    });

    const result$ = await interceptor.intercept(context, {
      handle: () => of({ ok: true }),
    });

    await expect(firstValueFrom(result$)).resolves.toEqual({ ok: true });
    expect(idempotencyService.execute).toHaveBeenCalled();
  });

  it('rejects missing idempotency key in strict mode', async () => {
    process.env.IDEMPOTENCY_REQUIRE_KEY_FOR_MUTATIONS = 'true';
    const interceptor = new IdempotencyInterceptor(
      reflector,
      idempotencyService as never,
    );

    const context = createContext({
      method: 'PATCH',
      baseUrl: '/events',
      route: { path: '/:id' },
      headers: {},
      user: { id: 9 },
      body: { title: 'B' },
      params: { id: 1 },
      query: {},
    });

    await expect(
      interceptor.intercept(context, { handle: () => of({ ok: true }) }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
