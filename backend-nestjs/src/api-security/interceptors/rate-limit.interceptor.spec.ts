import { HttpException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common/interfaces/features/execution-context.interface';
import { firstValueFrom, of } from 'rxjs';
import { RateLimitInterceptor } from './rate-limit.interceptor';

describe('RateLimitInterceptor', () => {
  const rateLimitService = {
    evaluate: jest.fn(),
    buildRateLimitPolicy: jest.fn(),
  };

  let interceptor: RateLimitInterceptor;

  beforeEach(() => {
    jest.clearAllMocks();
    interceptor = new RateLimitInterceptor(rateLimitService as never);
    rateLimitService.buildRateLimitPolicy.mockReturnValue(
      'sliding-window;w=60;tier=user;category=default',
    );
  });

  function createContext() {
    const headers = new Map<string, string>();
    const response = {
      setHeader: (name: string, value: string) => {
        headers.set(name, value);
      },
    };
    const context = {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => ({ method: 'GET', path: '/api/calendars', ip: '1.1.1.1' }),
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;

    return { context, headers };
  }

  it('sets rate limit headers for allowed request', async () => {
    rateLimitService.evaluate.mockResolvedValue({
      allowed: true,
      tier: 'user',
      category: 'default',
      limit: 100,
      remaining: 99,
      resetAtEpochSeconds: 123456,
    });
    const { context, headers } = createContext();

    const observable = await interceptor.intercept(context, {
      handle: () => of('ok'),
    });

    await expect(firstValueFrom(observable)).resolves.toBe('ok');
    expect(headers.get('X-RateLimit-Limit')).toBe('100');
    expect(headers.get('X-RateLimit-Remaining')).toBe('99');
  });

  it('throws 429 for blocked request', async () => {
    rateLimitService.evaluate.mockResolvedValue({
      allowed: false,
      tier: 'guest',
      category: 'auth',
      limit: 5,
      remaining: 0,
      resetAtEpochSeconds: 123456,
      retryAfterSeconds: 30,
    });
    const { context } = createContext();

    await expect(
      interceptor.intercept(context, { handle: () => of('ok') }),
    ).rejects.toBeInstanceOf(HttpException);
  });
});
