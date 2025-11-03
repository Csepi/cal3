import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  InboxRuleDto,
  InboxRuleScope,
} from './dto/inbox-rule.dto';
import { UserNotificationPreference } from '../entities/user-notification-preference.entity';
import { NotificationInboxRule } from '../entities/notification-inbox-rule.entity';
import { NotificationScopeMute } from '../entities/notification-scope-mute.entity';

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

  constructor(
    @InjectRepository(UserNotificationPreference)
    private readonly preferenceRepository: Repository<UserNotificationPreference>,
    @InjectRepository(NotificationInboxRule)
    private readonly inboxRuleRepository: Repository<NotificationInboxRule>,
    @InjectRepository(NotificationScopeMute)
    private readonly scopeMuteRepository: Repository<NotificationScopeMute>,
  ) {}

  async getUserPreferences(userId: number): Promise<NotificationPreferenceSummary[]> {
    const preferences = await this.preferenceRepository.find({
      where: { userId },
      order: { eventType: 'ASC' },
    });

    return preferences.map((preference) => ({
      eventType: preference.eventType,
      channels: preference.channels || {},
      digest: preference.digest,
      fallbackOrder: preference.fallbackOrder ?? undefined,
      quietHours: preference.quietHours ?? undefined,
    }));
  }

  async updateUserPreferences(
    userId: number,
    payload: NotificationPreferenceSummary[],
  ): Promise<NotificationPreferenceSummary[]> {
    const seenEventTypes = new Set<string>();

    for (const preference of payload) {
      seenEventTypes.add(preference.eventType);
      let entity = await this.preferenceRepository.findOne({
        where: { userId, eventType: preference.eventType },
      });

      if (!entity) {
        entity = this.preferenceRepository.create({
          userId,
          eventType: preference.eventType,
        });
      }

      entity.channels = preference.channels ?? {};
      entity.digest = preference.digest ?? 'immediate';
      entity.fallbackOrder = preference.fallbackOrder ?? null;
      entity.quietHours = preference.quietHours ?? null;

      await this.preferenceRepository.save(entity);
    }

    // Optionally, remove preferences not submitted to avoid stale records
    if (payload.length > 0) {
      const events = Array.from(seenEventTypes);
      if (events.length > 0) {
        await this.preferenceRepository
          .createQueryBuilder()
          .delete()
          .where('userId = :userId', { userId })
          .andWhere('eventType NOT IN (:...events)', { events })
          .execute();
      }
    }

    return this.getUserPreferences(userId);
  }

  async getUserInboxRules(userId: number): Promise<InboxRuleDto[]> {
    const rules = await this.inboxRuleRepository.find({
      where: { userId },
      order: { order: 'ASC', createdAt: 'ASC' },
    });

    return rules.map((rule) => ({
      id: rule.id,
      name: rule.name,
      scopeType: rule.scopeType as InboxRuleScope,
      scopeId: rule.scopeId ?? undefined,
      isEnabled: rule.isEnabled,
      conditions: Array.isArray(rule.conditions) ? rule.conditions : [],
      actions: Array.isArray(rule.actions) ? rule.actions : [],
      continueProcessing: rule.continueProcessing,
      order: rule.order,
    }));
  }

  async upsertRule(userId: number, rule: InboxRuleDto): Promise<InboxRuleDto> {
    let entity: NotificationInboxRule | null = null;

    if (rule.id) {
      entity = await this.inboxRuleRepository.findOne({
        where: { id: rule.id, userId },
      });

      if (!entity) {
        throw new NotFoundException('Inbox rule not found');
      }
    } else {
      entity = this.inboxRuleRepository.create({
        userId,
      });
      const lastRule = await this.inboxRuleRepository.findOne({
        where: { userId },
        order: { order: 'DESC' },
      });
      entity.order = lastRule ? lastRule.order + 1 : 1;
    }

    entity.name = rule.name;
    entity.scopeType = rule.scopeType;
    entity.scopeId = rule.scopeId ? String(rule.scopeId) : null;
    entity.isEnabled = rule.isEnabled;
    entity.conditions = rule.conditions;
    entity.actions = rule.actions;
    entity.continueProcessing = rule.continueProcessing ?? false;
    if (typeof rule.order === 'number') {
      entity.order = rule.order;
    }

    const saved = await this.inboxRuleRepository.save(entity);

    return {
      id: saved.id,
      name: saved.name,
      scopeType: saved.scopeType as InboxRuleScope,
      scopeId: saved.scopeId ?? undefined,
      isEnabled: saved.isEnabled,
      conditions: saved.conditions as any,
      actions: saved.actions as any,
      continueProcessing: saved.continueProcessing,
      order: saved.order,
    };
  }

  async reorderRules(
    userId: number,
    rules: InboxRuleDto[],
  ): Promise<InboxRuleDto[]> {
    const updates: Array<Promise<NotificationInboxRule>> = [];

    rules.forEach((rule, index) => {
      if (!rule.id) {
        return;
      }
      updates.push(
        this.inboxRuleRepository.save({
          id: rule.id,
          userId,
          order: typeof rule.order === 'number' ? rule.order : index + 1,
        }),
      );
    });

    await Promise.all(updates);

    return this.getUserInboxRules(userId);
  }

  async deleteRule(userId: number, ruleId: number): Promise<void> {
    await this.inboxRuleRepository.delete({ id: ruleId, userId });
  }

  async getScopeMutes(userId: number): Promise<NotificationScopeMute[]> {
    return this.scopeMuteRepository.find({ where: { userId } });
  }
}
