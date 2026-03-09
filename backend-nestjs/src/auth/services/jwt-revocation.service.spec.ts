import { JwtRevocationService } from './jwt-revocation.service';

describe('JwtRevocationService', () => {
  let service: JwtRevocationService;
  const originalRedisUrl = process.env.REDIS_URL;

  beforeEach(() => {
    delete process.env.REDIS_URL;
    service = new JwtRevocationService();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(async () => {
    jest.useRealTimers();
    if (originalRedisUrl) {
      process.env.REDIS_URL = originalRedisUrl;
    } else {
      delete process.env.REDIS_URL;
    }
    await service.onModuleDestroy();
  });

  it('stores revocations in memory when redis is unavailable', async () => {
    await service.revokeJti('test-jti', 10);

    await expect(service.isRevoked('test-jti')).resolves.toBe(true);
  });

  it('expires revocations from memory store', async () => {
    await service.revokeJti('short-lived-jti', 1);
    await expect(service.isRevoked('short-lived-jti')).resolves.toBe(true);

    jest.advanceTimersByTime(1200);

    await expect(service.isRevoked('short-lived-jti')).resolves.toBe(false);
  });

  it('decodes jti/exp without signature verification', () => {
    const payload = {
      jti: 'abc-123',
      exp: Math.floor(Date.now() / 1000) + 60,
    };
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
      'base64url',
    );
    const fakeJwt = `header.${encodedPayload}.sig`;

    expect(service.decodeWithoutVerification(fakeJwt)).toEqual(payload);
  });
});

