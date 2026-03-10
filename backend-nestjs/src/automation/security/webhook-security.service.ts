import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { isIP } from 'net';
import { SecurityStoreService } from '../../api-security/services/security-store.service';
import { AutomationRule } from '../../entities/automation-rule.entity';

import { bStatic } from '../../i18n/runtime';

export interface IncomingWebhookSecurityInput {
  rule: AutomationRule;
  token: string;
  headers: Record<string, string | string[] | undefined>;
  rawBody: string;
  sourceIp?: string | null;
}

export interface IncomingWebhookSecurityResult {
  replayKey: string;
  webhookTimestamp: Date;
  usedPreviousSecret: boolean;
}

type HeaderValue = string | string[] | undefined;

@Injectable()
export class WebhookSecurityService {
  private readonly timestampToleranceMs =
    this.readPositiveNumber('WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS', 300) * 1000;
  private readonly replayTtlSeconds = this.readPositiveNumber(
    'WEBHOOK_REPLAY_TTL_SECONDS',
    Math.ceil(this.timestampToleranceMs / 1000) * 2,
  );
  private readonly defaultRotateGraceSeconds = this.readPositiveNumber(
    'WEBHOOK_SECRET_ROTATION_GRACE_SECONDS',
    3600,
  );
  private readonly globalIpWhitelist = this.readStringList(
    'WEBHOOK_SOURCE_IP_WHITELIST',
  );

  constructor(private readonly securityStore: SecurityStoreService) {}

  async verifyIncomingRequest(
    input: IncomingWebhookSecurityInput,
  ): Promise<IncomingWebhookSecurityResult> {
    const signature = this.extractSignature(input.headers);
    const timestamp = this.extractTimestamp(input.headers);
    this.assertTimestampWithinTolerance(timestamp);
    this.assertSourceIpAllowed(input.rule, input.sourceIp ?? null);

    const signedPayload = `${Math.floor(timestamp.getTime() / 1000)}.${input.rawBody}`;
    const usedPreviousSecret = this.verifySignatureAgainstRuleSecrets(
      input.rule,
      signature,
      signedPayload,
      timestamp,
    );

    const replayKey = this.buildReplayKey(input.token, signature, timestamp);
    await this.assertReplaySafe(replayKey);

    return {
      replayKey,
      webhookTimestamp: timestamp,
      usedPreviousSecret,
    };
  }

  computeRotatedSecretState(rule: AutomationRule): {
    webhookSecret: string;
    webhookSecretPrevious: string | null;
    webhookSecretRotatedAt: Date;
    webhookSecretGraceUntil: Date;
  } {
    const now = new Date();
    return {
      webhookSecret: this.generateWebhookSecret(),
      webhookSecretPrevious: rule.webhookSecret ?? null,
      webhookSecretRotatedAt: now,
      webhookSecretGraceUntil: new Date(
        now.getTime() + this.defaultRotateGraceSeconds * 1000,
      ),
    };
  }

  generateWebhookSecret(): string {
    return randomBytes(64).toString('hex');
  }

  private async assertReplaySafe(replayKey: string): Promise<void> {
    const created = await this.securityStore.setIfAbsent(
      replayKey,
      '1',
      this.replayTtlSeconds,
    );
    if (!created) {
      throw new UnauthorizedException(bStatic('errors.auto.backend.kb1e417a0bb43'));
    }
  }

  private verifySignatureAgainstRuleSecrets(
    rule: AutomationRule,
    signature: string,
    signedPayload: string,
    timestamp: Date,
  ): boolean {
    const activeSecret = (rule.webhookSecret ?? '').trim();
    if (!activeSecret) {
      throw new ForbiddenException(
        bStatic('errors.auto.backend.ke7ec2e69bf73'),
      );
    }

    if (this.signatureMatches(activeSecret, signedPayload, signature)) {
      return false;
    }

    if (
      rule.webhookSecretPrevious &&
      rule.webhookSecretGraceUntil &&
      rule.webhookSecretGraceUntil.getTime() >= timestamp.getTime()
    ) {
      if (
        this.signatureMatches(
          rule.webhookSecretPrevious,
          signedPayload,
          signature,
        )
      ) {
        return true;
      }
    }

    throw new UnauthorizedException(bStatic('errors.auto.backend.kee831504837a'));
  }

  private signatureMatches(
    secret: string,
    signedPayload: string,
    receivedSignature: string,
  ): boolean {
    const expected = createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    const expectedBuffer = Buffer.from(expected, 'utf8');
    const receivedBuffer = Buffer.from(receivedSignature, 'utf8');
    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }
    return timingSafeEqual(expectedBuffer, receivedBuffer);
  }

  private assertSourceIpAllowed(rule: AutomationRule, sourceIp: string | null) {
    const triggerIpWhitelist = this.extractRuleIpWhitelist(rule.triggerConfig);
    const effectiveWhitelist =
      triggerIpWhitelist.length > 0 ? triggerIpWhitelist : this.globalIpWhitelist;

    if (effectiveWhitelist.length === 0) {
      return;
    }

    const normalizedIp = this.normalizeIp(sourceIp);
    if (!normalizedIp) {
      throw new ForbiddenException(bStatic('errors.auto.backend.k347bbedb503c'));
    }

    const allowed = effectiveWhitelist.some((entry) =>
      this.ipMatchesEntry(normalizedIp, entry),
    );
    if (!allowed) {
      throw new ForbiddenException(
        `Webhook source IP ${normalizedIp} is not whitelisted.`,
      );
    }
  }

  private extractRuleIpWhitelist(triggerConfig: Record<string, unknown> | null): string[] {
    if (!triggerConfig || typeof triggerConfig !== 'object') {
      return [];
    }

    const candidate =
      (triggerConfig.allowedIps as unknown) ??
      (triggerConfig.ipWhitelist as unknown);
    if (!Array.isArray(candidate)) {
      return [];
    }

    return candidate
      .map((entry) => String(entry ?? '').trim())
      .filter((entry) => entry.length > 0);
  }

  private ipMatchesEntry(ip: string, entry: string): boolean {
    if (!entry.includes('/')) {
      return ip === this.normalizeIp(entry);
    }

    const [rawNetwork, rawPrefix] = entry.split('/');
    const networkIp = this.normalizeIp(rawNetwork);
    const prefix = Number(rawPrefix);
    if (!networkIp || !Number.isFinite(prefix)) {
      return false;
    }

    if (isIP(ip) !== 4 || isIP(networkIp) !== 4) {
      return false;
    }

    const boundedPrefix = Math.max(0, Math.min(32, Math.floor(prefix)));
    const mask = boundedPrefix === 0 ? 0 : ~(2 ** (32 - boundedPrefix) - 1);
    return (this.ipv4ToInt(ip) & mask) === (this.ipv4ToInt(networkIp) & mask);
  }

  private ipv4ToInt(ip: string): number {
    return ip
      .split('.')
      .map((part) => Number(part))
      .reduce((acc, part) => (acc << 8) + part, 0) >>> 0;
  }

  private extractSignature(
    headers: Record<string, HeaderValue>,
  ): string {
    const raw =
      this.getHeader(headers, 'x-primecal-signature') ??
      this.getHeader(headers, 'x-webhook-signature') ??
      this.getHeader(headers, 'x-hub-signature-256');
    if (!raw) {
      throw new UnauthorizedException(bStatic('errors.auto.backend.ke0327c32eca8'));
    }

    const normalized = raw.trim().toLowerCase();
    const signature = normalized.startsWith('sha256=')
      ? normalized.slice('sha256='.length)
      : normalized;
    if (!/^[a-f0-9]{64}$/.test(signature)) {
      throw new BadRequestException(bStatic('errors.auto.backend.k126cfde1d29b'));
    }
    return signature;
  }

  private extractTimestamp(
    headers: Record<string, HeaderValue>,
  ): Date {
    const raw =
      this.getHeader(headers, 'x-primecal-timestamp') ??
      this.getHeader(headers, 'x-webhook-timestamp');
    if (!raw) {
      throw new UnauthorizedException(bStatic('errors.auto.backend.ked5e2936032c'));
    }

    const trimmed = raw.trim();
    const asNumber = Number(trimmed);
    if (Number.isFinite(asNumber)) {
      const millis =
        asNumber > 10_000_000_000 ? Math.floor(asNumber) : asNumber * 1000;
      return new Date(millis);
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(bStatic('errors.auto.backend.ka6dd6e6e2776'));
    }
    return parsed;
  }

  private assertTimestampWithinTolerance(timestamp: Date): void {
    const now = Date.now();
    const drift = Math.abs(now - timestamp.getTime());
    if (drift > this.timestampToleranceMs) {
      throw new UnauthorizedException(bStatic('errors.auto.backend.k78a1ff36887d'));
    }
  }

  private buildReplayKey(
    token: string,
    signature: string,
    timestamp: Date,
  ): string {
    return `webhook:replay:${token}:${Math.floor(timestamp.getTime() / 1000)}:${signature}`;
  }

  private getHeader(
    headers: Record<string, HeaderValue>,
    headerName: string,
  ): string | null {
    const direct = headers[headerName];
    if (typeof direct === 'string' && direct.trim().length > 0) {
      return direct;
    }
    if (Array.isArray(direct) && direct[0]) {
      return String(direct[0]);
    }

    const match = Object.entries(headers).find(
      ([key]) => key.toLowerCase() === headerName.toLowerCase(),
    );
    if (!match) {
      return null;
    }
    const value = match[1];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
    if (Array.isArray(value) && value[0]) {
      return String(value[0]);
    }
    return null;
  }

  private normalizeIp(rawIp: string | null | undefined): string | null {
    if (!rawIp) {
      return null;
    }
    const trimmed = rawIp.trim();
    if (!trimmed) {
      return null;
    }
    if (trimmed.startsWith('::ffff:')) {
      return trimmed.slice('::ffff:'.length);
    }
    return trimmed;
  }

  private readStringList(envName: string): string[] {
    return (process.env[envName] ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  }

  private readPositiveNumber(envName: string, fallback: number): number {
    const parsed = Number(process.env[envName]);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }
}
