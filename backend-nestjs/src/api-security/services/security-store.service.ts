import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';

interface MemoryValue {
  value: string;
  expiresAtMs: number | null;
}

interface SlidingWindowConsumeResult {
  count: number;
  resetAtMs: number;
}

@Injectable()
export class SecurityStoreService implements OnModuleDestroy {
  private readonly logger = new Logger(SecurityStoreService.name);
  private readonly memoryValues = new Map<string, MemoryValue>();
  private readonly memorySlidingWindows = new Map<string, number[]>();
  private redisClient: Redis | null = null;
  private redisInitPromise: Promise<Redis | null> | null = null;
  private readonly redisInitRetryDelayMs = 30_000;
  private readonly redisErrorLogThrottleMs = 60_000;
  private redisRetryAfterMs = 0;
  private lastRedisErrorLogAtMs = 0;
  private lastRedisErrorMessage: string | null = null;

  async increment(key: string, ttlSeconds: number): Promise<number> {
    const redis = await this.getRedisClient();
    if (redis) {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, Math.max(1, ttlSeconds));
      }
      return count;
    }

    const now = Date.now();
    const existing = this.readMemoryValue(key, now);
    const nextCount = (existing ? Number(existing.value) : 0) + 1;
    this.memoryValues.set(key, {
      value: String(nextCount),
      expiresAtMs: now + Math.max(1, ttlSeconds) * 1000,
    });
    return nextCount;
  }

  async getNumber(key: string): Promise<number> {
    const redis = await this.getRedisClient();
    if (redis) {
      const value = await redis.get(key);
      if (!value) {
        return 0;
      }
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    const existing = this.readMemoryValue(key, Date.now());
    if (!existing) {
      return 0;
    }
    const parsed = Number(existing.value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  async setString(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<void> {
    const redis = await this.getRedisClient();
    if (redis) {
      await redis.setex(key, Math.max(1, ttlSeconds), value);
      return;
    }

    this.memoryValues.set(key, {
      value,
      expiresAtMs: Date.now() + Math.max(1, ttlSeconds) * 1000,
    });
  }

  async setIfAbsent(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    const ttl = Math.max(1, ttlSeconds);
    const redis = await this.getRedisClient();
    if (redis) {
      const result = await redis.set(key, value, 'EX', ttl, 'NX');
      return result === 'OK';
    }

    const now = Date.now();
    const existing = this.readMemoryValue(key, now);
    if (existing) {
      return false;
    }
    this.memoryValues.set(key, {
      value,
      expiresAtMs: now + ttl * 1000,
    });
    return true;
  }

  async getString(key: string): Promise<string | null> {
    const redis = await this.getRedisClient();
    if (redis) {
      return redis.get(key);
    }

    const existing = this.readMemoryValue(key, Date.now());
    return existing?.value ?? null;
  }

  async delete(key: string): Promise<void> {
    const redis = await this.getRedisClient();
    if (redis) {
      await redis.del(key);
    }
    this.memoryValues.delete(key);
    this.memorySlidingWindows.delete(key);
  }

  async consumeSlidingWindow(
    key: string,
    windowMs: number,
    nowMs = Date.now(),
  ): Promise<SlidingWindowConsumeResult> {
    const normalizedWindowMs = Math.max(1000, windowMs);
    const redis = await this.getRedisClient();
    if (redis) {
      return this.consumeSlidingWindowRedis(key, normalizedWindowMs, nowMs);
    }
    return this.consumeSlidingWindowMemory(key, normalizedWindowMs, nowMs);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.redisClient = null;
    }
  }

  private async consumeSlidingWindowRedis(
    key: string,
    windowMs: number,
    nowMs: number,
  ): Promise<SlidingWindowConsumeResult> {
    const member = `${nowMs}:${randomUUID()}`;
    const lowerBound = nowMs - windowMs;

    const pipeline = this.redisClient!.multi();
    pipeline.zadd(key, nowMs, member);
    pipeline.zremrangebyscore(key, 0, lowerBound);
    pipeline.zcard(key);
    pipeline.zrange(key, 0, 0, 'WITHSCORES');
    pipeline.pexpire(key, windowMs);
    const response = await pipeline.exec();

    const entries =
      (response as Array<[Error | null, unknown]> | null) ?? [];
    const countRaw = entries[2]?.[1];
    const count =
      typeof countRaw === 'number'
        ? countRaw
        : Number.isFinite(Number(countRaw))
          ? Number(countRaw)
          : 0;

    const oldestRaw = entries[3]?.[1];
    let oldestScore = nowMs;
    if (Array.isArray(oldestRaw) && oldestRaw.length >= 2) {
      const parsed = Number(oldestRaw[1]);
      if (Number.isFinite(parsed)) {
        oldestScore = parsed;
      }
    }

    return {
      count,
      resetAtMs: oldestScore + windowMs,
    };
  }

  private consumeSlidingWindowMemory(
    key: string,
    windowMs: number,
    nowMs: number,
  ): SlidingWindowConsumeResult {
    const lowerBound = nowMs - windowMs;
    const existing = this.memorySlidingWindows.get(key) ?? [];
    const filtered = existing.filter((entry) => entry > lowerBound);
    filtered.push(nowMs);
    this.memorySlidingWindows.set(key, filtered);

    const oldest = filtered[0] ?? nowMs;
    return {
      count: filtered.length,
      resetAtMs: oldest + windowMs,
    };
  }

  private readMemoryValue(key: string, nowMs: number): MemoryValue | null {
    const existing = this.memoryValues.get(key);
    if (!existing) {
      return null;
    }
    if (existing.expiresAtMs !== null && existing.expiresAtMs <= nowMs) {
      this.memoryValues.delete(key);
      return null;
    }
    return existing;
  }

  private async getRedisClient(): Promise<Redis | null> {
    if (this.redisClient) {
      return this.redisClient;
    }

    if (this.redisInitPromise) {
      return this.redisInitPromise;
    }

    const redisUrl = process.env.REDIS_URL?.trim();
    if (!redisUrl) {
      return null;
    }

    if (Date.now() < this.redisRetryAfterMs) {
      return null;
    }

    this.redisInitPromise = this.initializeRedis(redisUrl);
    return this.redisInitPromise;
  }

  private async initializeRedis(redisUrl: string): Promise<Redis | null> {
    const client = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
    });
    client.on('error', (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      this.logRedisClientError(message);
    });
    client.on('end', () => {
      if (this.redisClient === client) {
        this.redisClient = null;
      }
    });

    try {
      await client.connect();
      this.redisClient = client;
      this.logger.log('Security counters are backed by Redis.');
      return client;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Redis unavailable for security counters; falling back to in-memory mode. ${message}`,
      );
      this.redisRetryAfterMs = Date.now() + this.redisInitRetryDelayMs;
      client.disconnect();
      return null;
    } finally {
      this.redisInitPromise = null;
    }
  }

  private logRedisClientError(message: string): void {
    const now = Date.now();
    const isSameMessage = this.lastRedisErrorMessage === message;
    const isThrottled = now - this.lastRedisErrorLogAtMs < this.redisErrorLogThrottleMs;

    if (isSameMessage && isThrottled) {
      return;
    }

    this.lastRedisErrorLogAtMs = now;
    this.lastRedisErrorMessage = message;
    this.logger.warn(`Security Redis client error: ${message}`);
  }
}
