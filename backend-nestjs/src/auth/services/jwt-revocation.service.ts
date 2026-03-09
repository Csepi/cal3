import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

interface ParsedJwtPayload {
  jti?: string;
  exp?: number;
}

@Injectable()
export class JwtRevocationService implements OnModuleDestroy {
  private readonly logger = new Logger(JwtRevocationService.name);
  private readonly memoryStore = new Map<string, number>();
  private readonly keyPrefix = 'auth:jwt:blacklist:';
  private redisClient: Redis | null = null;
  private redisInitPromise: Promise<Redis | null> | null = null;

  async revokeToken(token: string | null | undefined): Promise<void> {
    if (!token) {
      return;
    }
    const parsed = this.decodeWithoutVerification(token);
    if (!parsed?.jti || !parsed.exp) {
      return;
    }
    const ttlSeconds = parsed.exp - Math.floor(Date.now() / 1000);
    await this.revokeJti(parsed.jti, ttlSeconds);
  }

  async revokeJti(jti: string, ttlSeconds: number): Promise<void> {
    if (!jti || ttlSeconds <= 0) {
      return;
    }

    const redis = await this.getRedisClient();
    if (redis) {
      await redis.setex(this.buildKey(jti), ttlSeconds, '1');
      return;
    }

    this.memoryStore.set(jti, Date.now() + ttlSeconds * 1000);
    this.pruneMemoryStore();
  }

  async isRevoked(jti: string | undefined): Promise<boolean> {
    if (!jti) {
      return false;
    }
    const redis = await this.getRedisClient();
    if (redis) {
      const value = await redis.get(this.buildKey(jti));
      return value === '1';
    }

    const expiresAt = this.memoryStore.get(jti);
    if (!expiresAt) {
      return false;
    }
    if (expiresAt <= Date.now()) {
      this.memoryStore.delete(jti);
      return false;
    }
    return true;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.redisClient = null;
    }
  }

  decodeWithoutVerification(
    token: string,
  ): ParsedJwtPayload | null {
    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }

    try {
      const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
      const payload = JSON.parse(payloadJson) as ParsedJwtPayload;
      return payload;
    } catch {
      return null;
    }
  }

  private buildKey(jti: string): string {
    return `${this.keyPrefix}${jti}`;
  }

  private pruneMemoryStore(): void {
    const now = Date.now();
    for (const [jti, expiresAt] of this.memoryStore.entries()) {
      if (expiresAt <= now) {
        this.memoryStore.delete(jti);
      }
    }
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

    this.redisInitPromise = this.initializeRedis(redisUrl);
    return this.redisInitPromise;
  }

  private async initializeRedis(redisUrl: string): Promise<Redis | null> {
    const client = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
    });

    try {
      await client.connect();
      this.redisClient = client;
      this.logger.log('JWT revocation list is backed by Redis.');
      return client;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Redis unavailable for JWT revocation; falling back to in-memory blacklist. ${message}`,
      );
      client.disconnect();
      return null;
    } finally {
      this.redisInitPromise = null;
    }
  }
}

