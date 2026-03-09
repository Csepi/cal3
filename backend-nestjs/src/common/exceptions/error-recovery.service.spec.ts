import { ErrorRecoveryService } from './error-recovery.service';

describe('ErrorRecoveryService', () => {
  it('retries until success', async () => {
    const service = new ErrorRecoveryService();
    let attempts = 0;

    const value = await service.withRetry(
      async () => {
        attempts += 1;
        if (attempts < 3) {
          throw new Error('transient');
        }
        return 'ok';
      },
      { attempts: 3, baseDelayMs: 1, maxDelayMs: 2 },
    );

    expect(value).toBe('ok');
    expect(attempts).toBe(3);
  });

  it('uses fallback when task fails', async () => {
    const service = new ErrorRecoveryService();
    const value = await service.withFallback(
      async () => {
        throw new Error('boom');
      },
      () => 'fallback',
    );
    expect(value).toBe('fallback');
  });
});
