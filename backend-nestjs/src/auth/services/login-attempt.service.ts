import { Injectable, Logger } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';

interface AttemptRecord {
  count: number;
  expiresAt: number;
}

@Injectable()
export class LoginAttemptService {
  private readonly logger = new Logger(LoginAttemptService.name);
  private readonly attemptsByKey = new Map<string, AttemptRecord>();

  private readonly maxAttempts = parseInt(
    process.env.LOGIN_MAX_ATTEMPTS ?? '5',
    10,
  );
  private readonly blockSeconds = parseInt(
    process.env.LOGIN_BLOCK_SECONDS ?? '900',
    10,
  );

  registerFailure(identifier: string, ip?: string): never | void {
    const key = this.buildKey(identifier, ip);
    const now = Date.now();
    const record = this.attemptsByKey.get(key);

    if (record && record.expiresAt > now) {
      record.count += 1;
      if (record.count >= this.maxAttempts) {
        this.logger.warn(
          `Blocking login attempts for identifier ${identifier} from ${ip ?? 'unknown IP'}`,
        );
        throw new ThrottlerException(
          'Too many failed attempts. Please try again later.',
        );
      }
      this.attemptsByKey.set(key, record);
      return;
    }

    this.attemptsByKey.set(key, {
      count: 1,
      expiresAt: now + this.blockSeconds * 1000,
    });
  }

  reset(identifier: string, ip?: string): void {
    const key = this.buildKey(identifier, ip);
    this.attemptsByKey.delete(key);
  }

  private buildKey(identifier: string, ip?: string): string {
    return `${identifier.toLowerCase()}::${ip ?? 'unknown'}`;
  }
}
