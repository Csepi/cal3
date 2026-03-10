import { Injectable } from '@nestjs/common';
import { DomainInfrastructureException } from './domain.exception';

import { bStatic } from '../../i18n/runtime';

export interface RetryPolicy {
  attempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

@Injectable()
export class ErrorRecoveryService {
  async withRetry<T>(
    task: () => Promise<T>,
    policy: RetryPolicy = {},
  ): Promise<T> {
    const attempts = Math.max(policy.attempts ?? 3, 1);
    const baseDelayMs = Math.max(policy.baseDelayMs ?? 100, 0);
    const maxDelayMs = Math.max(policy.maxDelayMs ?? 1000, baseDelayMs);

    let lastError: unknown;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await task();
      } catch (error) {
        lastError = error;
        if (attempt >= attempts) {
          break;
        }
        const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
        await this.sleep(delay);
      }
    }

    throw new DomainInfrastructureException(
      bStatic('errors.auto.backend.k422775494206'),
      undefined,
      {
        attempts,
        errorMessage:
          lastError instanceof Error ? lastError.message : String(lastError),
      },
    );
  }

  async withFallback<T>(
    task: () => Promise<T>,
    fallback: (error: unknown) => Promise<T> | T,
  ): Promise<T> {
    try {
      return await task();
    } catch (error) {
      return await fallback(error);
    }
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
