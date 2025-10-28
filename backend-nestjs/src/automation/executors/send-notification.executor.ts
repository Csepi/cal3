import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AutomationAction, ActionType } from '../../entities/automation-action.entity';
import {
  IActionExecutor,
  ActionExecutionContext,
  ActionExecutionResult,
} from './action-executor.interface';
import { ActionExecutorRegistry } from './action-executor-registry';
import { AutomationSmartValuesService } from '../automation-smart-values.service';

@Injectable()
export class SendNotificationExecutor implements IActionExecutor, OnModuleInit {
  readonly actionType = ActionType.SEND_NOTIFICATION;
  private readonly logger = new Logger(SendNotificationExecutor.name);

  constructor(
    private readonly registry: ActionExecutorRegistry,
    private readonly smartValuesService: AutomationSmartValuesService,
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
      const interpolatedConfig = this.smartValuesService.interpolateObjectValues(
        action.actionConfig || {},
        context,
      );
      this.validateConfig(interpolatedConfig);

      const title = interpolatedConfig.title ? String(interpolatedConfig.title).trim() : null;
      const message = String(interpolatedConfig.message).trim();
      const priority =
        typeof interpolatedConfig.priority === 'string'
          ? interpolatedConfig.priority.toLowerCase()
          : 'normal';

      this.logger.log(
        `Automation notification: [${priority.toUpperCase()}] ${title ? `${title} - ` : ''}${message}`,
      );

      return {
        success: true,
        actionId: action.id,
        actionType: this.actionType,
        data: {
          title,
          message,
          priority,
        },
        executedAt,
      };
    } catch (error) {
      return {
        success: false,
        actionId: action.id,
        actionType: this.actionType,
        error: error.message || 'Failed to send notification',
        executedAt,
      };
    }
  }

  validateConfig(actionConfig: Record<string, any>): boolean {
    if (!actionConfig || typeof actionConfig !== 'object') {
      throw new Error('Action configuration must be an object');
    }

    if (typeof actionConfig.message !== 'string' || actionConfig.message.trim().length === 0) {
      throw new Error('Notification message is required');
    }

    if (actionConfig.priority !== undefined) {
      const value = String(actionConfig.priority).toLowerCase();
      if (!['low', 'normal', 'high'].includes(value)) {
        throw new Error('Notification priority must be one of: low, normal, high');
      }
    }

    if (actionConfig.title !== undefined && typeof actionConfig.title !== 'string') {
      throw new Error('Notification title must be a string');
    }

    return true;
  }
}
