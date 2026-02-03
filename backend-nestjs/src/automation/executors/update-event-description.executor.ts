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

type DescriptionMode = 'replace' | 'append' | 'prepend';

@Injectable()
export class UpdateEventDescriptionExecutor
  implements IActionExecutor, OnModuleInit
{
  readonly actionType = ActionType.UPDATE_EVENT_DESCRIPTION;

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
        throw new Error('No event available to update');
      }

      const interpolatedConfig =
        this.smartValuesService.interpolateObjectValues(
          action.actionConfig || {},
          context,
        );
      this.validateConfig(interpolatedConfig);

      const modeValue = String(interpolatedConfig.mode ?? '');
      const mode: DescriptionMode = ['replace', 'append', 'prepend'].includes(
        modeValue,
      )
        ? (modeValue as DescriptionMode)
        : 'replace';
      const newDescription = String(interpolatedConfig.newDescription).trim();

      const event = context.event;
      const previousDescription = event.description || '';
      let updatedDescription = newDescription;

      if (mode === 'append') {
        updatedDescription = previousDescription
          ? `${previousDescription}\n${newDescription}`
          : newDescription;
      } else if (mode === 'prepend') {
        updatedDescription = previousDescription
          ? `${newDescription}\n${previousDescription}`
          : newDescription;
      }

      await this.eventRepository.update(event.id, {
        description: updatedDescription,
      });
      event.description = updatedDescription;

      return {
        success: true,
        actionId: action.id,
        actionType: this.actionType,
        data: {
          previousDescription,
          newDescription: updatedDescription,
          mode,
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
            : String(error) || 'Failed to update event description',
        executedAt,
      };
    }
  }

  validateConfig(actionConfig: Record<string, unknown>): boolean {
    if (!actionConfig || typeof actionConfig !== 'object') {
      throw new Error('Action configuration must be an object');
    }

    if (
      typeof actionConfig.newDescription !== 'string' ||
      actionConfig.newDescription.trim().length === 0
    ) {
      throw new Error(
        'Action configuration must include a non-empty "newDescription" string',
      );
    }

    if (
      actionConfig.mode !== undefined &&
      !['replace', 'append', 'prepend'].includes(String(actionConfig.mode))
    ) {
      throw new Error(
        'Description update mode must be one of: replace, append, prepend',
      );
    }

    return true;
  }
}
