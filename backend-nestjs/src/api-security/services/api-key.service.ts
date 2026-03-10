import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, createHash, timingSafeEqual } from 'crypto';
import { Repository } from 'typeorm';
import { UsagePlan, User } from '../../entities/user.entity';
import { ApiKey, ApiKeyScope, ApiKeyTier } from '../../entities/api-key.entity';
import type { ApiKeyAuthContext } from '../types';
import { CreateApiKeyDto } from '../dto/api-key.dto';
import { AuditTrailService } from '../../logging/audit-trail.service';

import { bStatic } from '../../i18n/runtime';

interface ParsedApiKey {
  prefix: string;
  secret: string;
}

export interface ApiKeyAuthResult {
  context: ApiKeyAuthContext;
  user: User;
}

@Injectable()
export class ApiKeyService {
  private readonly defaultRotateDays = this.readNumber(
    'API_KEY_ROTATE_DAYS_DEFAULT',
    90,
  );
  private readonly strictRotation =
    process.env.API_KEY_ENFORCE_ROTATION !== 'false';

  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly auditTrailService: AuditTrailService,
  ) {}

  async createForUser(userId: number, dto: CreateApiKeyDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException(bStatic('errors.auto.backend.kd2c36ed08a6d'));
    }

    const generated = this.generatePlaintextKey();
    const scopes = this.normalizeScopes(dto.scopes);
    const tier = this.resolveTier(dto.tier, user);
    const now = Date.now();
    const rotateDays = dto.rotateInDays ?? this.defaultRotateDays;
    const expiresAt = dto.expiresInDays
      ? new Date(now + dto.expiresInDays * 24 * 60 * 60 * 1000)
      : null;
    const rotateAfter = new Date(now + rotateDays * 24 * 60 * 60 * 1000);

    const apiKey = this.apiKeyRepository.create({
      userId: user.id,
      name: dto.name,
      prefix: generated.prefix,
      keyHash: this.hashSecret(generated.secret),
      lastFour: generated.secret.slice(-4),
      scopes,
      tier,
      expiresAt,
      rotateAfter,
      isActive: true,
    });

    const saved = await this.apiKeyRepository.save(apiKey);
    return {
      apiKey: generated.plaintext,
      key: this.toSummary(saved),
    };
  }

  async listForUser(userId: number) {
    const keys = await this.apiKeyRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return keys.map((key) => this.toSummary(key));
  }

  async revokeForUser(userId: number, keyId: number): Promise<void> {
    const key = await this.apiKeyRepository.findOne({
      where: { id: keyId, userId },
    });
    if (!key) {
      throw new NotFoundException(bStatic('errors.auto.backend.kd97fc69fecc9'));
    }
    key.isActive = false;
    key.revokedAt = new Date();
    await this.apiKeyRepository.save(key);
  }

  async rotateForUser(userId: number, keyId: number) {
    const existing = await this.apiKeyRepository.findOne({
      where: { id: keyId, userId },
    });
    if (!existing) {
      throw new NotFoundException(bStatic('errors.auto.backend.kd97fc69fecc9'));
    }

    existing.isActive = false;
    existing.revokedAt = new Date();
    await this.apiKeyRepository.save(existing);

    const replacement = await this.createForUser(userId, {
      name: existing.name,
      scopes: existing.scopes,
      tier: existing.tier,
      rotateInDays: this.defaultRotateDays,
    });

    return replacement;
  }

  async authenticate(
    rawKey: string,
    method: string,
    path: string,
  ): Promise<ApiKeyAuthResult> {
    const parsed = this.parseRawKey(rawKey);
    if (!parsed) {
      throw new UnauthorizedException(bStatic('errors.auto.backend.kcfbd08e1cd20'));
    }

    const key = await this.apiKeyRepository.findOne({
      where: { prefix: parsed.prefix, isActive: true },
    });
    if (!key) {
      throw new UnauthorizedException(bStatic('errors.auto.backend.kba8fb1ed6754'));
    }

    const expected = Buffer.from(key.keyHash, 'utf8');
    const provided = Buffer.from(this.hashSecret(parsed.secret), 'utf8');
    const hashMatches =
      expected.length === provided.length &&
      timingSafeEqual(expected, provided);
    if (!hashMatches) {
      throw new UnauthorizedException(bStatic('errors.auto.backend.kba8fb1ed6754'));
    }

    const now = Date.now();
    if (key.revokedAt) {
      throw new UnauthorizedException(bStatic('errors.auto.backend.k6de08e0e2c3b'));
    }
    if (key.expiresAt && key.expiresAt.getTime() <= now) {
      throw new UnauthorizedException(bStatic('errors.auto.backend.k26f09996ebc0'));
    }

    const requiredScope = this.inferRequiredScope(method, path);
    if (!this.hasScope(key.scopes, requiredScope)) {
      throw new ForbiddenException(
        `API key lacks required "${requiredScope}" scope.`,
      );
    }

    const rotationRequired =
      Boolean(key.rotateAfter) && key.rotateAfter!.getTime() <= now;
    if (rotationRequired && this.strictRotation) {
      throw new UnauthorizedException(bStatic('errors.auto.backend.k7b5c093c92f2'));
    }

    const user = await this.userRepository.findOne({
      where: { id: key.userId, isActive: true },
    });
    if (!user) {
      throw new UnauthorizedException(bStatic('errors.auto.backend.kcbf50014cb11'));
    }

    await Promise.all([
      this.apiKeyRepository.increment({ id: key.id }, 'usageCount', 1),
      this.apiKeyRepository.update(
        { id: key.id },
        { lastUsedAt: new Date(now) },
      ),
    ]);

    void this.auditTrailService
      .logSecurityEvent(
        'api_key.request',
        {
          apiKeyId: key.id,
          scope: requiredScope,
          method,
          path,
          tier: key.tier,
        },
        {
          userId: user.id,
          outcome: 'success',
          severity: 'info',
        },
      )
      .catch(() => undefined);

    return {
      context: {
        id: key.id,
        userId: key.userId,
        scopes: key.scopes,
        tier: key.tier,
        rotationRequired,
      },
      user,
    };
  }

  inferRequiredScope(method: string, path: string): ApiKeyScope {
    const normalizedMethod = method.toUpperCase();
    const normalizedPath = path.toLowerCase();
    if (normalizedPath.includes('/admin')) {
      return ApiKeyScope.ADMIN;
    }
    if (
      normalizedMethod === 'GET' ||
      normalizedMethod === 'HEAD' ||
      normalizedMethod === 'OPTIONS'
    ) {
      return ApiKeyScope.READ;
    }
    return ApiKeyScope.WRITE;
  }

  private hasScope(scopes: ApiKeyScope[], required: ApiKeyScope): boolean {
    if (scopes.includes(ApiKeyScope.ADMIN)) {
      return true;
    }
    if (required === ApiKeyScope.WRITE) {
      return scopes.includes(ApiKeyScope.WRITE);
    }
    if (required === ApiKeyScope.READ) {
      return (
        scopes.includes(ApiKeyScope.READ) || scopes.includes(ApiKeyScope.WRITE)
      );
    }
    return scopes.includes(required);
  }

  private normalizeScopes(scopes?: ApiKeyScope[]): ApiKeyScope[] {
    const provided = Array.isArray(scopes) ? scopes : [ApiKeyScope.READ];
    const unique = Array.from(new Set(provided));
    if (unique.length === 0) {
      return [ApiKeyScope.READ];
    }
    return unique;
  }

  private resolveTier(requested: ApiKeyTier | undefined, user: User): ApiKeyTier {
    if (requested) {
      return requested;
    }
    const plans = user.usagePlans ?? [];
    if (plans.includes(UsagePlan.ENTERPRISE) || plans.includes(UsagePlan.STORE)) {
      return ApiKeyTier.PREMIUM;
    }
    return ApiKeyTier.USER;
  }

  private generatePlaintextKey(): {
    plaintext: string;
    prefix: string;
    secret: string;
  } {
    const prefix = randomBytes(6).toString('hex');
    const secret = randomBytes(24).toString('base64url');
    return {
      plaintext: `pk_${prefix}_${secret}`,
      prefix,
      secret,
    };
  }

  private hashSecret(secret: string): string {
    const pepper =
      process.env.API_KEY_PEPPER ??
      process.env.JWT_SECRET ??
      'cal3-api-key-pepper';
    return createHash('sha256').update(`${secret}:${pepper}`).digest('hex');
  }

  private parseRawKey(rawKey: string): ParsedApiKey | null {
    const trimmed = rawKey.trim();
    const match = /^pk_([a-f0-9]{12})_([A-Za-z0-9_-]{20,})$/.exec(trimmed);
    if (!match) {
      return null;
    }
    return {
      prefix: match[1],
      secret: match[2],
    };
  }

  private toSummary(key: ApiKey) {
    return {
      id: key.id,
      name: key.name,
      prefix: key.prefix,
      scopes: key.scopes,
      tier: key.tier,
      isActive: key.isActive,
      expiresAt: key.expiresAt ? key.expiresAt.toISOString() : null,
      rotateAfter: key.rotateAfter ? key.rotateAfter.toISOString() : null,
      lastUsedAt: key.lastUsedAt ? key.lastUsedAt.toISOString() : null,
      usageCount: key.usageCount,
    };
  }

  private readNumber(name: string, fallback: number): number {
    const parsed = Number(process.env[name]);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }
}
