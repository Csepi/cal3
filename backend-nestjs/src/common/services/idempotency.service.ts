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

    const normalizedScope = options.scope;
    const requestHash = this.hashPayload(options.payload);
    const ttlSeconds = options.ttlSeconds ?? this.defaultTtlSeconds;
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
        return JSON.parse(existing.responsePayload) as TResult;
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

  private hashPayload(payload: unknown): string {
    return createHash('sha256')
      .update(JSON.stringify(payload ?? {}))
      .digest('hex');
  }
}
