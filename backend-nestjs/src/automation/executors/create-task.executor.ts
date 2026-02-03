import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AutomationAction,
  ActionType,
} from '../../entities/automation-action.entity';
import { Event } from '../../entities/event.entity';
import {
  IActionExecutor,
  ActionExecutionContext,
  ActionExecutionResult,
} from './action-executor.interface';
import { ActionExecutorRegistry } from './action-executor-registry';
import { AutomationSmartValuesService } from '../automation-smart-values.service';

@Injectable()
export class CreateTaskExecutor implements IActionExecutor, OnModuleInit {
  readonly actionType = ActionType.CREATE_TASK;

  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
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
      if (!context.event) {
        throw new Error('No event available to attach task');
      }

      const interpolatedConfig =
        this.smartValuesService.interpolateObjectValues(
          action.actionConfig || {},
          context,
        );
      this.validateConfig(interpolatedConfig);

      const title = String(interpolatedConfig.taskTitle).trim();
      const description =
        interpolatedConfig.taskDescription !== undefined &&
        interpolatedConfig.taskDescription !== null
          ? String(interpolatedConfig.taskDescription).trim()
          : undefined;
      const dueMinutesBefore =
        interpolatedConfig.dueMinutesBefore !== undefined &&
        interpolatedConfig.dueMinutesBefore !== null &&
        String(interpolatedConfig.dueMinutesBefore).trim() !== ''
          ? Number(interpolatedConfig.dueMinutesBefore)
          : undefined;

      if (dueMinutesBefore !== undefined && Number.isNaN(dueMinutesBefore)) {
        throw new Error('dueMinutesBefore must be a number if provided');
      }

      const event = context.event;
      const existingTasks = Array.isArray(event.automationTasks)
        ? [...event.automationTasks]
        : [];

      const taskEntry = {
        title,
        description: description || undefined,
        dueMinutesBefore,
        createdAt: executedAt.toISOString(),
        createdByRuleId: action.ruleId,
      };

      existingTasks.push(taskEntry);
      await this.eventRepository.update(event.id, {
        automationTasks: existingTasks,
      });
      event.automationTasks = existingTasks;

      return {
        success: true,
        actionId: action.id,
        actionType: this.actionType,
        data: taskEntry,
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
            : String(error) || 'Failed to create automation task',
        executedAt,
      };
    }
  }

  validateConfig(actionConfig: Record<string, unknown>): boolean {
    if (!actionConfig || typeof actionConfig !== 'object') {
      throw new Error('Action configuration must be an object');
    }

    if (
      typeof actionConfig.taskTitle !== 'string' ||
      actionConfig.taskTitle.trim().length === 0
    ) {
      throw new Error('Task title is required');
    }

    if (
      actionConfig.taskDescription !== undefined &&
      actionConfig.taskDescription !== null &&
      typeof actionConfig.taskDescription !== 'string'
    ) {
      throw new Error('Task description must be a string');
    }

    if (
      actionConfig.dueMinutesBefore !== undefined &&
      actionConfig.dueMinutesBefore !== null &&
      String(actionConfig.dueMinutesBefore).trim() !== '' &&
      Number.isNaN(Number(actionConfig.dueMinutesBefore))
    ) {
      throw new Error('dueMinutesBefore must be a number when provided');
    }

    return true;
  }
}
