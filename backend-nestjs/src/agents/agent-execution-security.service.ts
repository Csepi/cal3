import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  PayloadTooLargeException,
  RequestTimeoutException,
} from '@nestjs/common';
import { SecurityStoreService } from '../api-security/services/security-store.service';
import { AgentActionKey } from './agent-actions.registry';
import { ThrottlerException } from '@nestjs/throttler';

import { bStatic } from '../i18n/runtime';

@Injectable()
export class AgentExecutionSecurityService {
  private readonly maxPayloadBytes = this.readPositiveNumber(
    'AGENT_MAX_PAYLOAD_BYTES',
    64 * 1024,
  );
  private readonly maxExecutionMs = this.readPositiveNumber(
    'AGENT_MAX_EXECUTION_MS',
    12_000,
  );
  private readonly maxExecutionsPerMinute = this.readPositiveNumber(
    'AGENT_MAX_EXECUTIONS_PER_MIN',
    120,
  );
  private readonly maxMemoryRssMb = this.readPositiveNumber(
    'AGENT_MAX_RSS_MB',
    1024,
  );
  private readonly deniedActions = this.readActionSet(
    'AGENT_ACTION_DENYLIST',
    [],
  );
  private readonly allowedActions = this.readActionSet(
    'AGENT_ACTION_ALLOWLIST',
    Object.values(AgentActionKey),
  );
  private readonly blockedParameterKeyTokens = [
    'url',
    'uri',
    'endpoint',
    'webhook',
    'callback',
    'destination',
  ];

  constructor(private readonly securityStore: SecurityStoreService) {}

  async executeGuarded<T>(input: {
    agentId: number;
    action: AgentActionKey;
    parameters: Record<string, unknown>;
    run: () => Promise<T>;
  }): Promise<T> {
    this.assertActionAllowed(input.action);
    this.assertPayloadSafe(input.parameters);
    await this.assertRateLimit(input.agentId, input.action);
    this.assertResourceBudget();

    try {
      return await Promise.race([
        input.run(),
        this.timeoutRejection(this.maxExecutionMs),
      ]);
    } finally {
      this.assertResourceBudget();
    }
  }

  private assertActionAllowed(action: AgentActionKey): void {
    if (this.deniedActions.has(action)) {
      throw new ForbiddenException(
        `Agent action "${action}" is blocked by policy.`,
      );
    }
    if (!this.allowedActions.has(action)) {
      throw new ForbiddenException(
        `Agent action "${action}" is not in the allowlist.`,
      );
    }
  }

  private assertPayloadSafe(parameters: Record<string, unknown>): void {
    const serialized = JSON.stringify(parameters ?? {});
    if (Buffer.byteLength(serialized, 'utf8') > this.maxPayloadBytes) {
      throw new PayloadTooLargeException(bStatic('errors.auto.backend.k7dbe923cf672'));
    }

    this.scanForBlockedKeys(parameters);
  }

  private scanForBlockedKeys(value: unknown): void {
    if (!value || typeof value !== 'object') {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((entry) => this.scanForBlockedKeys(entry));
      return;
    }

    const record = value as Record<string, unknown>;
    for (const [key, entry] of Object.entries(record)) {
      const normalizedKey = key.toLowerCase();
      const isBlocked = this.blockedParameterKeyTokens.some((token) =>
        normalizedKey.includes(token),
      );
      if (isBlocked) {
        throw new BadRequestException(
          `Parameter "${key}" is not allowed for MCP actions.`,
        );
      }
      this.scanForBlockedKeys(entry);
    }
  }

  private async assertRateLimit(
    agentId: number,
    action: AgentActionKey,
  ): Promise<void> {
    const windowMs = 60_000;
    const key = `agent:rate:${agentId}:${action}`;
    const result = await this.securityStore.consumeSlidingWindow(key, windowMs);
    if (result.count > this.maxExecutionsPerMinute) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((result.resetAtMs - Date.now()) / 1000),
      );
      throw new ThrottlerException(
        `Agent rate limit exceeded. Retry in ${retryAfterSeconds}s.`,
      );
    }
  }

  private assertResourceBudget(): void {
    const rssMb = process.memoryUsage().rss / (1024 * 1024);
    if (rssMb > this.maxMemoryRssMb) {
      throw new ForbiddenException(
        `Agent resource budget exceeded (RSS ${rssMb.toFixed(1)}MB).`,
      );
    }
  }

  private timeoutRejection(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(
        () =>
          reject(
            new RequestTimeoutException(
              `Agent execution exceeded ${ms}ms limit.`,
            ),
          ),
        ms,
      );
    });
  }

  private readActionSet(envName: string, fallback: string[]): Set<AgentActionKey> {
    const parsed = (process.env[envName] ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .filter((item): item is AgentActionKey =>
        (Object.values(AgentActionKey) as string[]).includes(item),
      );
    const source = parsed.length > 0 ? parsed : fallback;
    return new Set(
      source.filter((item): item is AgentActionKey =>
        (Object.values(AgentActionKey) as string[]).includes(item),
      ),
    );
  }

  private readPositiveNumber(envName: string, fallback: number): number {
    const parsed = Number(process.env[envName]);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }
}
