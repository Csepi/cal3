import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  AutomationAction,
  ActionType,
} from '../../entities/automation-action.entity';
import {
  IActionExecutor,
  ActionExecutionContext,
  ActionExecutionResult,
} from './action-executor.interface';
import { ActionExecutorRegistry } from './action-executor-registry';
import { AutomationSmartValuesService } from '../automation-smart-values.service';
import { NotificationsService } from '../../notifications/notifications.service';
import type { NotificationChannelType } from '../../notifications/notifications.constants';

@Injectable()
export class SendNotificationExecutor implements IActionExecutor, OnModuleInit {
  readonly actionType = ActionType.SEND_NOTIFICATION;

  constructor(
    private readonly registry: ActionExecutorRegistry,
    private readonly smartValuesService: AutomationSmartValuesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  onModuleInit() {
    this.registry.register(this);
  }

  async execute(
    action: AutomationAction,
    context: ActionExecutionContext,
  ): Promise<ActionExecutionResult> {
    const executedAt = new Date();

    try {
      const interpolatedConfig =
        this.smartValuesService.interpolateObjectValues(
          action.actionConfig || {},
          context,
        );
      this.validateConfig(interpolatedConfig);

      const title = interpolatedConfig.title
        ? String(interpolatedConfig.title).trim()
        : null;
      const message = String(interpolatedConfig.message).trim();
      const priority =
        typeof interpolatedConfig.priority === 'string'
          ? interpolatedConfig.priority.toLowerCase()
          : 'normal';

      const recipients = this.resolveRecipients(interpolatedConfig, context);
      if (recipients.length === 0) {
        throw new Error('No recipients resolved for automation notification');
      }

      const channels = Array.isArray(interpolatedConfig.channels)
        ? (interpolatedConfig.channels as string[]).filter(
            (channel): channel is NotificationChannelType =>
              [
                'inapp',
                'email',
                'webpush',
                'mobilepush',
                'slack',
                'teams',
              ].includes(channel),
          )
        : undefined;

      await this.notificationsService.publish({
        eventType: String(
          interpolatedConfig.eventType ?? 'automation.notification',
        ),
        actorId: context.event?.createdById ?? null,
        recipients,
        title: title ?? `Automation Notification`,
        body: message,
        preferredChannels: channels,
        data: {
          automationActionId: action.id,
          ruleId: action.ruleId,
          priority,
        },
        context: {
          threadKey: `automation:rule:${action.ruleId}`,
          contextType: 'automation',
          contextId: String(action.ruleId),
        },
      });

      return {
        success: true,
        actionId: action.id,
        actionType: this.actionType,
        data: {
          title,
          message,
          priority,
          recipients,
        },
        executedAt,
      };
    } catch (error: unknown) {
      return {
        success: false,
        actionId: action.id,
        actionType: this.actionType,
        error:
          error instanceof Error
            ? error.message
            : String(error) || 'Failed to send notification',
        executedAt,
      };
    }
  }

  private resolveRecipients(
    config: Record<string, unknown>,
    context: ActionExecutionContext,
  ): number[] {
    const recipients = new Set<number>();

    const explicitRecipients = Array.isArray(config.recipientUserIds)
      ? config.recipientUserIds
      : Array.isArray(config.recipients)
        ? config.recipients
        : [];

    explicitRecipients.forEach((candidate: unknown) => {
      const numericId = Number(candidate);
      if (!Number.isNaN(numericId) && numericId > 0) {
        recipients.add(numericId);
      }
    });

    if (config.includeEventCreator !== false && context.event?.createdById) {
      recipients.add(context.event.createdById);
    }

    if (config.includeCalendarOwner && context.event?.calendar?.ownerId) {
      recipients.add(context.event.calendar.ownerId);
    }

    return Array.from(recipients);
  }

  validateConfig(actionConfig: Record<string, unknown>): boolean {
    if (!actionConfig || typeof actionConfig !== 'object') {
      throw new Error('Action configuration must be an object');
    }

    if (
      typeof actionConfig.message !== 'string' ||
      actionConfig.message.trim().length === 0
    ) {
      throw new Error('Notification message is required');
    }

    if (actionConfig.priority !== undefined) {
      const value = String(actionConfig.priority).toLowerCase();
      if (!['low', 'normal', 'high'].includes(value)) {
        throw new Error(
          'Notification priority must be one of: low, normal, high',
        );
      }
    }

    if (
      actionConfig.title !== undefined &&
      typeof actionConfig.title !== 'string'
    ) {
      throw new Error('Notification title must be a string');
    }

    return true;
  }
}
