import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { SecurityStoreService } from './security-store.service';

interface LoginFailureState {
  requiresCaptcha: boolean;
  accountLocked: boolean;
  ipBlocked: boolean;
}

@Injectable()
export class AbusePreventionService {
  private readonly logger = new Logger(AbusePreventionService.name);
  private readonly keyPrefix = 'abuse';

  private readonly captchaThreshold = this.readNumber(
    'ABUSE_CAPTCHA_THRESHOLD',
    3,
  );
  private readonly accountLockThreshold = this.readNumber(
    'ABUSE_ACCOUNT_LOCK_THRESHOLD',
    8,
  );
  private readonly accountLockSeconds = this.readNumber(
    'ABUSE_ACCOUNT_LOCK_SECONDS',
    1800,
  );
  private readonly ipBlockThreshold = this.readNumber(
    'ABUSE_IP_BLOCK_THRESHOLD',
    20,
  );
  private readonly ipBlockSeconds = this.readNumber(
    'ABUSE_IP_BLOCK_SECONDS',
    3600,
  );
  private readonly counterWindowSeconds = this.readNumber(
    'ABUSE_COUNTER_WINDOW_SECONDS',
    1800,
  );
  private readonly honeypotBlockSeconds = this.readNumber(
    'ABUSE_HONEYPOT_BLOCK_SECONDS',
    86400,
  );
  private readonly riskWindowSeconds = this.readNumber(
    'ABUSE_RISK_WINDOW_SECONDS',
    3600,
  );
  private readonly ipWhitelist = new Set(
    (process.env.SECURITY_IP_WHITELIST ?? '')
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
  );

  constructor(private readonly store: SecurityStoreService) {}

  async assertIpAllowed(ip: string | undefined): Promise<void> {
    const normalizedIp = this.normalizeIp(ip);
    if (!normalizedIp || this.isWhitelisted(normalizedIp)) {
      return;
    }

    const blocked = await this.store.getString(this.ipBlockKey(normalizedIp));
    if (blocked) {
      throw new ForbiddenException('IP temporarily blocked due to abuse risk.');
    }
  }

  async isAccountLocked(identifier: string): Promise<boolean> {
    const normalized = this.normalizeIdentifier(identifier);
    if (!normalized) {
      return false;
    }
    const value = await this.store.getString(this.accountLockKey(normalized));
    return Boolean(value);
  }

  async requiresCaptcha(
    identifier: string,
    ip?: string,
  ): Promise<boolean> {
    const normalized = this.normalizeIdentifier(identifier);
    const normalizedIp = this.normalizeIp(ip);

    const accountFlag = normalized
      ? await this.store.getString(this.captchaAccountKey(normalized))
      : null;
    const ipFlag = normalizedIp
      ? await this.store.getString(this.captchaIpKey(normalizedIp))
      : null;

    return Boolean(accountFlag || ipFlag);
  }

  async registerLoginFailure(
    identifier: string,
    ip?: string,
  ): Promise<LoginFailureState> {
    const normalized = this.normalizeIdentifier(identifier);
    const normalizedIp = this.normalizeIp(ip);
    let requiresCaptcha = false;
    let accountLocked = false;
    let ipBlocked = false;

    if (normalized) {
      const count = await this.store.increment(
        this.loginAccountCounterKey(normalized),
        this.counterWindowSeconds,
      );
      if (count >= this.captchaThreshold) {
        requiresCaptcha = true;
        await this.store.setString(
          this.captchaAccountKey(normalized),
          '1',
          this.counterWindowSeconds,
        );
      }
      if (count >= this.accountLockThreshold) {
        accountLocked = true;
        await this.store.setString(
          this.accountLockKey(normalized),
          '1',
          this.accountLockSeconds,
        );
      }
    }

    if (normalizedIp && !this.isWhitelisted(normalizedIp)) {
      const count = await this.store.increment(
        this.loginIpCounterKey(normalizedIp),
        this.counterWindowSeconds,
      );
      if (count >= this.captchaThreshold) {
        requiresCaptcha = true;
        await this.store.setString(
          this.captchaIpKey(normalizedIp),
          '1',
          this.counterWindowSeconds,
        );
      }
      if (count >= this.ipBlockThreshold) {
        ipBlocked = true;
        await this.store.setString(
          this.ipBlockKey(normalizedIp),
          '1',
          this.ipBlockSeconds,
        );
      }
    }

    if (normalizedIp) {
      await this.store.increment(
        this.riskCounterKey(normalizedIp),
        this.riskWindowSeconds,
      );
    }

    return {
      requiresCaptcha,
      accountLocked,
      ipBlocked,
    };
  }

  async resetLoginFailures(identifier: string, ip?: string): Promise<void> {
    const normalized = this.normalizeIdentifier(identifier);
    const normalizedIp = this.normalizeIp(ip);

    if (normalized) {
      await Promise.all([
        this.store.delete(this.loginAccountCounterKey(normalized)),
        this.store.delete(this.captchaAccountKey(normalized)),
        this.store.delete(this.accountLockKey(normalized)),
      ]);
    }

    if (normalizedIp) {
      await Promise.all([
        this.store.delete(this.loginIpCounterKey(normalizedIp)),
        this.store.delete(this.captchaIpKey(normalizedIp)),
      ]);
    }
  }

  async markHoneypotHit(ip: string | undefined, path: string): Promise<void> {
    const normalizedIp = this.normalizeIp(ip);
    if (!normalizedIp || this.isWhitelisted(normalizedIp)) {
      return;
    }
    await this.store.setString(
      this.ipBlockKey(normalizedIp),
      'honeypot',
      this.honeypotBlockSeconds,
    );
    await this.store.increment(
      this.riskCounterKey(normalizedIp),
      this.riskWindowSeconds,
    );
    this.logger.warn(`Honeypot trap triggered by ${normalizedIp} on ${path}`);
  }

  async registerRateLimitViolation(
    ip: string | undefined,
    identifier?: string,
  ): Promise<void> {
    const normalizedIp = this.normalizeIp(ip);
    if (normalizedIp && !this.isWhitelisted(normalizedIp)) {
      const count = await this.store.increment(
        this.rateViolationCounterKey(normalizedIp),
        this.riskWindowSeconds,
      );
      await this.store.increment(
        this.riskCounterKey(normalizedIp),
        this.riskWindowSeconds,
      );
      if (count >= this.ipBlockThreshold) {
        await this.store.setString(
          this.ipBlockKey(normalizedIp),
          'rate-limit',
          this.ipBlockSeconds,
        );
      }
    }

    const normalizedIdentifier = this.normalizeIdentifier(identifier);
    if (normalizedIdentifier) {
      await this.store.increment(
        this.riskIdentityCounterKey(normalizedIdentifier),
        this.riskWindowSeconds,
      );
    }
  }

  async assertAccountAllowed(identifier: string): Promise<void> {
    const locked = await this.isAccountLocked(identifier);
    if (locked) {
      throw new HttpException(
        'Account temporarily locked after repeated failed login attempts.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async getRiskScore(
    ip: string | undefined,
    identifier?: string,
  ): Promise<number> {
    const normalizedIp = this.normalizeIp(ip);
    const normalizedIdentifier = this.normalizeIdentifier(identifier);

    let score = 0;
    if (normalizedIp) {
      const ipRisk = await this.store.getNumber(this.riskCounterKey(normalizedIp));
      const ipRate = await this.store.getNumber(
        this.rateViolationCounterKey(normalizedIp),
      );
      score += Math.min(1, ipRisk / 20) * 0.7;
      score += Math.min(1, ipRate / 10) * 0.3;
      if (!this.isWhitelisted(normalizedIp)) {
        const blocked = await this.store.getString(this.ipBlockKey(normalizedIp));
        if (blocked) {
          return 1;
        }
      }
    }

    if (normalizedIdentifier) {
      const identityRisk = await this.store.getNumber(
        this.riskIdentityCounterKey(normalizedIdentifier),
      );
      score += Math.min(1, identityRisk / 10) * 0.4;
    }

    return Math.max(0, Math.min(1, score));
  }

  private normalizeIdentifier(value: string | undefined): string {
    if (!value) {
      return '';
    }
    return value.trim().toLowerCase();
  }

  private normalizeIp(ip: string | undefined): string {
    if (!ip) {
      return '';
    }
    const normalized = ip.trim();
    if (!normalized) {
      return '';
    }
    if (normalized.startsWith('::ffff:')) {
      return normalized.slice(7);
    }
    return normalized;
  }

  private isWhitelisted(ip: string): boolean {
    return this.ipWhitelist.has(ip);
  }

  private readNumber(name: string, fallback: number): number {
    const parsed = Number(process.env[name]);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  private loginAccountCounterKey(identifier: string): string {
    return `${this.keyPrefix}:login:acct:${identifier}`;
  }

  private loginIpCounterKey(ip: string): string {
    return `${this.keyPrefix}:login:ip:${ip}`;
  }

  private captchaAccountKey(identifier: string): string {
    return `${this.keyPrefix}:captcha:acct:${identifier}`;
  }

  private captchaIpKey(ip: string): string {
    return `${this.keyPrefix}:captcha:ip:${ip}`;
  }

  private accountLockKey(identifier: string): string {
    return `${this.keyPrefix}:lock:acct:${identifier}`;
  }

  private ipBlockKey(ip: string): string {
    return `${this.keyPrefix}:block:ip:${ip}`;
  }

  private riskCounterKey(ip: string): string {
    return `${this.keyPrefix}:risk:ip:${ip}`;
  }

  private riskIdentityCounterKey(identifier: string): string {
    return `${this.keyPrefix}:risk:id:${identifier}`;
  }

  private rateViolationCounterKey(ip: string): string {
    return `${this.keyPrefix}:rate:ip:${ip}`;
  }
}
