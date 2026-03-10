import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { IdempotencyRecord } from '../../entities/idempotency-record.entity';

import { logError } from '../errors/error-logger';
import { buildErrorContext } from '../errors/error-context';
export interface IdempotencyOptions<T> {
  key: string | undefined;
  scope: string;
  userId: number;
  ttlSeconds?: number;
  payload: T;
}

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);
  private readonly keyPattern = /^[A-Za-z0-9:_-]{8,128}$/;
  private readonly minTtlSeconds = parseInt(
    process.env.IDEMPOTENCY_MIN_TTL_SEC || '30',
    10,
  );
  private readonly maxTtlSeconds = parseInt(
    process.env.IDEMPOTENCY_MAX_TTL_SEC || '86400',
    10,
  );
  private readonly defaultTtlSeconds = parseInt(
    process.env.IDEMPOTENCY_DEFAULT_TTL_SEC || '3600',
    10,
  );

  constructor(
    @InjectRepository(IdempotencyRecord)
    private readonly repository: Repository<IdempotencyRecord>,
  ) {}

  async execute<TPayload, TResult>(
    options: IdempotencyOptions<TPayload>,
    handler: () => Promise<TResult>,
  ): Promise<TResult> {
    const key = options.key?.trim();
    if (!key) {
      throw new BadRequestException(
        'Missing Idempotency-Key header for this endpoint.',
      );
    }

    if (key.length > 128) {
      throw new BadRequestException('Idempotency key is too long.');
    }
    if (!this.keyPattern.test(key)) {
      throw new BadRequestException(
        'Idempotency key must match [A-Za-z0-9:_-] and be 8-128 chars.',
      );
    }

    const normalizedScope = options.scope;
    const requestHash = this.hashPayload(options.payload);
    const requestedTtl = options.ttlSeconds ?? this.defaultTtlSeconds;
    const ttlSeconds = Math.max(
      this.minTtlSeconds,
      Math.min(this.maxTtlSeconds, requestedTtl),
    );
    const now = new Date();

    const existing = await this.repository.findOne({
      where: { key, userId: options.userId, scope: normalizedScope },
    });

    if (existing) {
      if (existing.expiresAt.getTime() < now.getTime()) {
        await this.repository.remove(existing);
      } else if (existing.requestHash !== requestHash) {
        throw new ConflictException(
          'Conflicting request payload for supplied Idempotency-Key.',
        );
      } else if (existing.responsePayload) {
        try {
          return JSON.parse(existing.responsePayload) as TResult;
        } catch {
          this.logger.warn(
            `Failed to parse cached idempotent response for key ${key}; replay cache discarded.`,
          );
          existing.responsePayload = null;
          await this.repository.save(existing);
        }
      }
    }

    const record =
      existing ??
      this.repository.create({
        key,
        scope: normalizedScope,
        userId: options.userId,
        requestHash,
        expiresAt: new Date(now.getTime() + ttlSeconds * 1000),
      });

    try {
      const result = await handler();
      record.responsePayload = JSON.stringify(result);
      record.requestHash = requestHash;
      record.expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
      await this.repository.save(record);
      return result;
    } catch (error) {
      logError(error, buildErrorContext({ action: 'idempotency.service' }));
      this.logger.warn(
        `Idempotent handler for key ${key} failed: ${
          (error as Error)?.message ?? error
        }`,
      );
      throw error;
    }
  }

  async purgeExpired(referenceDate = new Date()): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .from(IdempotencyRecord)
      .where('expiresAt < :now', { now: referenceDate.toISOString() })
      .execute();
    return result.affected ?? 0;
  }

  private hashPayload(payload: unknown): string {
    return createHash('sha256')
      .update(JSON.stringify(payload ?? {}))
      .digest('hex');
  }
}
