import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { SecurityStoreService } from '../../api-security/services/security-store.service';
import { AutomationAction } from '../../entities/automation-action.entity';
import { AutomationRule } from '../../entities/automation-rule.entity';
import { ThrottlerException } from '@nestjs/throttler';

import { bStatic } from '../../i18n/runtime';

export type AutomationExecutionSource = 'manual' | 'webhook' | 'agent';

@Injectable()
export class AutomationSecurityService {
  private readonly requireApprovalForSensitive =
    process.env.AUTOMATION_REQUIRE_APPROVAL_FOR_SENSITIVE !== 'false';
  private readonly manualWindowMs = this.readPositiveNumber(
    'AUTOMATION_MANUAL_WINDOW_MS',
    60_000,
  );
  private readonly manualMax = this.readPositiveNumber(
    'AUTOMATION_MANUAL_MAX_PER_WINDOW',
    6,
  );
  private readonly webhookWindowMs = this.readPositiveNumber(
    'AUTOMATION_WEBHOOK_WINDOW_MS',
    60_000,
  );
  private readonly webhookMax = this.readPositiveNumber(
    'AUTOMATION_WEBHOOK_MAX_PER_WINDOW',
    60,
  );
  private readonly agentWindowMs = this.readPositiveNumber(
    'AUTOMATION_AGENT_WINDOW_MS',
    60_000,
  );
  private readonly agentMax = this.readPositiveNumber(
    'AUTOMATION_AGENT_MAX_PER_WINDOW',
    20,
  );
  private readonly sensitiveActionTypes = this.readStringSet(
    'AUTOMATION_SENSITIVE_ACTIONS',
    ['webhook', 'cancel_event', 'move_to_calendar'],
  );

  constructor(private readonly securityStore: SecurityStoreService) {}

  assertKillSwitchDisabled(): void {
    if (process.env.AUTOMATION_KILL_SWITCH === 'true') {
      throw new ForbiddenException(
        bStatic('errors.auto.backend.k96e5338b2d83'),
      );
    }
  }

  async assertWithinRateLimits(
    ruleId: number,
    source: AutomationExecutionSource,
    actorKey: string,
  ): Promise<void> {
    const { max, windowMs } = this.resolveSourceLimits(source);
    const key = `automation:rate:${source}:${ruleId}:${actorKey}`;
    const consumption = await this.securityStore.consumeSlidingWindow(
      key,
      windowMs,
    );

    if (consumption.count > max) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((consumption.resetAtMs - Date.now()) / 1000),
      );
      throw new ThrottlerException(
        `Automation trigger rate limit exceeded. Retry in ${retryAfterSeconds}s.`,
      );
    }
  }

  applyApprovalRequirement(
    actions: AutomationAction[],
    existingFlag: boolean | null | undefined,
  ): boolean {
    if (!this.requireApprovalForSensitive) {
      return Boolean(existingFlag);
    }
    return (
      Boolean(existingFlag) ||
      actions.some((action) =>
        this.sensitiveActionTypes.has(String(action.actionType).toLowerCase()),
      )
    );
  }

  assertApprovalSatisfied(rule: AutomationRule): void {
    if (!rule.isApprovalRequired) {
      return;
    }
    if (rule.approvedAt) {
      return;
    }
    throw new ForbiddenException(
      bStatic('errors.auto.backend.kbd3b20ebf94f'),
    );
  }

  private resolveSourceLimits(source: AutomationExecutionSource): {
    max: number;
    windowMs: number;
  } {
    switch (source) {
      case 'manual':
        return { max: this.manualMax, windowMs: this.manualWindowMs };
      case 'agent':
        return { max: this.agentMax, windowMs: this.agentWindowMs };
      default:
        return { max: this.webhookMax, windowMs: this.webhookWindowMs };
    }
  }

  private readStringSet(
    envName: string,
    fallback: string[],
  ): Set<string> {
    const entries = (process.env[envName] ?? '')
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean);
    if (entries.length === 0) {
      return new Set(fallback.map((entry) => entry.toLowerCase()));
    }
    return new Set(entries);
  }

  private readPositiveNumber(envName: string, fallback: number): number {
    const parsed = Number(process.env[envName]);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }
}
