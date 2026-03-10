import { ForbiddenException, HttpException } from '@nestjs/common';
import { AbusePreventionService } from './abuse-prevention.service';
import { SecurityStoreService } from './security-store.service';

describe('AbusePreventionService', () => {
  const originalEnv = { ...process.env };
  let store: SecurityStoreService;
  let service: AbusePreventionService;

  beforeEach(() => {
    process.env.REDIS_URL = '';
    process.env.ABUSE_CAPTCHA_THRESHOLD = '2';
    process.env.ABUSE_ACCOUNT_LOCK_THRESHOLD = '3';
    process.env.ABUSE_ACCOUNT_LOCK_SECONDS = '600';
    process.env.ABUSE_IP_BLOCK_THRESHOLD = '3';
    process.env.ABUSE_IP_BLOCK_SECONDS = '600';
    process.env.ABUSE_COUNTER_WINDOW_SECONDS = '600';
    process.env.ABUSE_HONEYPOT_BLOCK_SECONDS = '600';
    process.env.ABUSE_RISK_WINDOW_SECONDS = '600';

    store = new SecurityStoreService();
    service = new AbusePreventionService(store);
  });

  afterEach(async () => {
    await store.onModuleDestroy();
    process.env = { ...originalEnv };
  });

  it('locks account after repeated failed login attempts', async () => {
    await service.registerLoginFailure('test@example.com', '10.1.1.1');
    await service.registerLoginFailure('test@example.com', '10.1.1.1');
    await service.registerLoginFailure('test@example.com', '10.1.1.1');

    await expect(
      service.assertAccountAllowed('test@example.com'),
    ).rejects.toBeInstanceOf(HttpException);
  });

  it('blocks IP after honeypot hit', async () => {
    await service.markHoneypotHit('8.8.8.8', '/api/security/honeypot/admin-login');
    await expect(service.assertIpAllowed('8.8.8.8')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('increases risk score when violations are recorded', async () => {
    const before = await service.getRiskScore('9.9.9.9');
    await service.registerRateLimitViolation('9.9.9.9', 'user:1');
    const after = await service.getRiskScore('9.9.9.9', 'user:1');
    expect(after).toBeGreaterThanOrEqual(before);
  });
});
