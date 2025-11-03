import { Injectable, Logger } from '@nestjs/common';
import { InboxRuleDto } from './dto/inbox-rule.dto';

export interface NotificationPreferenceSummary {
  eventType: string;
  channels: Record<string, boolean>;
  digest?: string;
  fallbackOrder?: string[];
  quietHours?: Record<string, any> | null;
}

@Injectable()
export class NotificationRulesService {
  private readonly logger = new Logger(NotificationRulesService.name);

  async getUserPreferences(userId: number): Promise<NotificationPreferenceSummary[]> {
    this.logger.debug(`getUserPreferences placeholder invoked for user ${userId}`);
    return [];
  }

  async updateUserPreferences(
    userId: number,
    payload: NotificationPreferenceSummary[],
  ): Promise<NotificationPreferenceSummary[]> {
    this.logger.debug(`updateUserPreferences placeholder invoked for user ${userId}`);
    return payload;
  }

  async getUserInboxRules(userId: number): Promise<InboxRuleDto[]> {
    this.logger.debug(`getUserInboxRules placeholder invoked for user ${userId}`);
    return [];
  }

  async upsertRule(userId: number, rule: InboxRuleDto): Promise<InboxRuleDto> {
    this.logger.debug(
      `upsertRule placeholder invoked for user ${userId} with rule ${rule.name}`,
    );
    return { ...rule, id: rule.id ?? 0 };
  }

  async reorderRules(
    userId: number,
    rules: InboxRuleDto[],
  ): Promise<InboxRuleDto[]> {
    this.logger.debug(`reorderRules placeholder invoked for user ${userId}`);
    return rules;
  }

  async deleteRule(userId: number, ruleId: number): Promise<void> {
    this.logger.debug(
      `deleteRule placeholder invoked for user ${userId}, rule ${ruleId}`,
    );
  }
}
