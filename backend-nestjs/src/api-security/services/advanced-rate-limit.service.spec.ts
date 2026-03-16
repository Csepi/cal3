import { AdvancedRateLimitService } from './advanced-rate-limit.service';
import { ApiKeyScope } from '../../entities/api-key.entity';

describe('AdvancedRateLimitService', () => {
  const store = {
    consumeSlidingWindow: jest.fn(),
  };
  const abusePrevention = {
    getRiskScore: jest.fn(),
    registerRateLimitViolation: jest.fn(),
  };

  let service: AdvancedRateLimitService;

  beforeEach(() => {
    jest.clearAllMocks();
    abusePrevention.getRiskScore.mockResolvedValue(0);
    store.consumeSlidingWindow.mockResolvedValue({
      count: 1,
      resetAtMs: Date.now() + 60000,
    });
    service = new AdvancedRateLimitService(
      store as never,
      abusePrevention as never,
    );
  });

  it('allows requests within limits and returns rate decision metadata', async () => {
    const decision = await service.evaluate({
      method: 'GET',
      path: '/auth/profile',
      ip: '1.2.3.4',
    } as never);

    expect(decision.allowed).toBe(true);
    expect(decision.category).toBe('auth');
    expect(decision.tier).toBe('guest');
    expect(decision.limit).toBeGreaterThan(0);
    expect(decision.remaining).toBeGreaterThanOrEqual(0);
  });

  it('classifies auth availability endpoints separately from auth login flow', async () => {
    const decision = await service.evaluate({
      method: 'GET',
      path: '/auth/email-availability',
      ip: '1.2.3.4',
    } as never);

    expect(decision.category).toBe('availability');
    expect(decision.tier).toBe('guest');
    expect(decision.limit).toBeGreaterThanOrEqual(30);
  });

  it('marks premium tier when enterprise usage plan is present', async () => {
    await service.evaluate({
      method: 'GET',
      path: '/calendars',
      ip: '1.2.3.4',
      user: {
        id: 7,
        usagePlans: ['enterprise'],
      },
    } as never);

    expect(store.consumeSlidingWindow).toHaveBeenCalledWith(
      expect.stringContaining('premium'),
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('rejects requests over limit and reports abuse signal', async () => {
    store.consumeSlidingWindow.mockResolvedValue({
      count: 1000,
      resetAtMs: Date.now() + 60000,
    });

    const decision = await service.evaluate({
      method: 'POST',
      path: '/admin/users',
      ip: '1.2.3.4',
      apiKey: {
        id: 11,
        userId: 9,
        tier: 'user',
        scopes: [ApiKeyScope.ADMIN],
        rotationRequired: false,
      },
    } as never);

    expect(decision.allowed).toBe(false);
    expect(decision.category).toBe('admin');
    expect(decision.retryAfterSeconds).toBeGreaterThan(0);
    expect(abusePrevention.registerRateLimitViolation).toHaveBeenCalled();
  });
});
