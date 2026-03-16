import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { UsagePlan } from '../../entities/user.entity';
import type {
  ApiKeyAuthContext,
  ApiRateTier,
  EndpointCategory,
  RateLimitDecision,
  RateLimitRule,
} from '../types';
import { AbusePreventionService } from './abuse-prevention.service';
import { SecurityStoreService } from './security-store.service';

type SecurityRequest = Request & {
  user?: {
    id?: number;
    usagePlans?: UsagePlan[] | string[];
  };
  apiKey?: ApiKeyAuthContext;
};

type RuleMatrix = Record<ApiRateTier, Record<EndpointCategory, RateLimitRule>>;

@Injectable()
export class AdvancedRateLimitService {
  private readonly keyPrefix = 'rl:sw';
  private readonly ruleMatrix: RuleMatrix = {
    guest: {
      auth: this.buildRule('guest', 'auth', 8, 60),
      availability: this.buildRule('guest', 'availability', 30, 60),
      booking: this.buildRule('guest', 'booking', 20, 60),
      admin: this.buildRule('guest', 'admin', 4, 60),
      default: this.buildRule('guest', 'default', 40, 60),
    },
    user: {
      auth: this.buildRule('user', 'auth', 20, 60),
      availability: this.buildRule('user', 'availability', 80, 60),
      booking: this.buildRule('user', 'booking', 120, 60),
      admin: this.buildRule('user', 'admin', 30, 60),
      default: this.buildRule('user', 'default', 180, 60),
    },
    premium: {
      auth: this.buildRule('premium', 'auth', 40, 60),
      availability: this.buildRule('premium', 'availability', 180, 60),
      booking: this.buildRule('premium', 'booking', 300, 60),
      admin: this.buildRule('premium', 'admin', 120, 60),
      default: this.buildRule('premium', 'default', 450, 60),
    },
  };

  constructor(
    private readonly store: SecurityStoreService,
    private readonly abusePrevention: AbusePreventionService,
  ) {}

  async evaluate(request: SecurityRequest): Promise<RateLimitDecision> {
    const tier = this.resolveTier(request);
    const category = this.resolveCategory(request);
    const rule = this.ruleMatrix[tier][category];
    const identity = this.resolveIdentity(request, tier);
    const riskScore = await this.abusePrevention.getRiskScore(
      request.ip,
      this.resolveRiskIdentity(request),
    );
    const adjustedLimit = this.adjustLimit(rule.limit, tier, riskScore);
    const now = Date.now();
    const consumed = await this.store.consumeSlidingWindow(
      this.buildRateLimitKey(tier, category, identity),
      rule.windowSeconds * 1000,
      now,
    );

    const allowed = consumed.count <= adjustedLimit;
    if (!allowed) {
      await this.abusePrevention.registerRateLimitViolation(
        request.ip,
        this.resolveRiskIdentity(request),
      );
    }

    const remaining = Math.max(0, adjustedLimit - consumed.count);
    const resetAtEpochSeconds = Math.ceil(consumed.resetAtMs / 1000);
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((consumed.resetAtMs - now) / 1000),
    );

    return {
      allowed,
      tier,
      category,
      limit: adjustedLimit,
      remaining,
      resetAtEpochSeconds,
      retryAfterSeconds: allowed ? undefined : retryAfterSeconds,
    };
  }

  buildRateLimitPolicy(decision: RateLimitDecision): string {
    const windowSeconds = this.ruleMatrix[decision.tier][decision.category]
      .windowSeconds;
    return `sliding-window;w=${windowSeconds};tier=${decision.tier};category=${decision.category}`;
  }

  private resolveTier(request: SecurityRequest): ApiRateTier {
    if (request.apiKey?.tier) {
      return request.apiKey.tier;
    }

    const plans = request.user?.usagePlans;
    if (Array.isArray(plans)) {
      const normalized = plans.map((plan) => String(plan).toLowerCase());
      if (
        normalized.includes(UsagePlan.ENTERPRISE) ||
        normalized.includes(UsagePlan.STORE)
      ) {
        return 'premium';
      }
    }

    return request.user?.id ? 'user' : 'guest';
  }

  private resolveCategory(request: SecurityRequest): EndpointCategory {
    const path = (request.path || request.originalUrl || '').toLowerCase();
    if (
      path.includes('/auth/username-availability') ||
      path.includes('/auth/email-availability')
    ) {
      return 'availability';
    }
    if (path.includes('/auth')) {
      return 'auth';
    }
    if (
      path.includes('/reservations') ||
      path.includes('/booking') ||
      path.includes('/public-booking')
    ) {
      return 'booking';
    }
    if (path.includes('/admin')) {
      return 'admin';
    }
    return 'default';
  }

  private resolveIdentity(request: SecurityRequest, tier: ApiRateTier): string {
    if (request.apiKey?.id) {
      return `api-key:${request.apiKey.id}`;
    }
    if (request.user?.id) {
      return `user:${request.user.id}`;
    }
    const ip = request.ip?.replace('::ffff:', '') || 'unknown';
    return `${tier}:ip:${ip}`;
  }

  private resolveRiskIdentity(request: SecurityRequest): string | undefined {
    if (request.apiKey?.id) {
      return `api-key:${request.apiKey.id}`;
    }
    if (request.user?.id) {
      return `user:${request.user.id}`;
    }
    return undefined;
  }

  private adjustLimit(
    baseLimit: number,
    tier: ApiRateTier,
    riskScore: number,
  ): number {
    const boundedRisk = Math.max(0, Math.min(1, riskScore));
    const riskPenaltyMultiplier = 1 - boundedRisk * 0.7;
    let adjusted = Math.floor(baseLimit * riskPenaltyMultiplier);

    if (tier === 'premium' && boundedRisk < 0.2) {
      adjusted = Math.floor(adjusted * 1.2);
    }

    return Math.max(1, adjusted);
  }

  private buildRateLimitKey(
    tier: ApiRateTier,
    category: EndpointCategory,
    identity: string,
  ): string {
    return `${this.keyPrefix}:${tier}:${category}:${identity}`;
  }

  private buildRule(
    tier: ApiRateTier,
    category: EndpointCategory,
    fallbackLimit: number,
    fallbackWindowSeconds: number,
  ): RateLimitRule {
    const prefix = `RATE_LIMIT_${tier}_${category}`.toUpperCase();
    const limit = this.readNumber(`${prefix}_LIMIT`, fallbackLimit);
    const windowSeconds = this.readNumber(
      `${prefix}_WINDOW_SEC`,
      fallbackWindowSeconds,
    );
    return {
      limit: Math.max(1, limit),
      windowSeconds: Math.max(1, windowSeconds),
    };
  }

  private readNumber(name: string, fallback: number): number {
    const parsed = Number(process.env[name]);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }
}
