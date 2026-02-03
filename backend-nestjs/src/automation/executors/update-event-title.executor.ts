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

type TitleMode = 'replace' | 'append' | 'prepend';

@Injectable()
export class UpdateEventTitleExecutor implements IActionExecutor, OnModuleInit {
  readonly actionType = ActionType.UPDATE_EVENT_TITLE;

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
      const mode: TitleMode = ['replace', 'append', 'prepend'].includes(
        modeValue,
      )
        ? (modeValue as TitleMode)
        : 'replace';
      const newTitle = String(interpolatedConfig.newTitle).trim();

      const event = context.event;
      const previousTitle = event.title || '';
      let updatedTitle = newTitle;

      if (mode === 'append') {
        updatedTitle = `${previousTitle}${previousTitle ? ' ' : ''}${newTitle}`;
      } else if (mode === 'prepend') {
        updatedTitle = `${newTitle}${previousTitle ? ' ' : ''}${previousTitle}`;
      }

      await this.eventRepository.update(event.id, { title: updatedTitle });
      event.title = updatedTitle;

      return {
        success: true,
        actionId: action.id,
        actionType: this.actionType,
        data: {
          previousTitle,
          newTitle: updatedTitle,
          mode,
        },
        executedAt,
      };
    } catch (error: any) {
      return {
        success: false,
        actionId: action.id,
        actionType: this.actionType,
        error:
          error instanceof Error
            ? error.message
            : String(error) || 'Failed to update event title',
        executedAt,
      };
    }
  }

  validateConfig(actionConfig: Record<string, unknown>): boolean {
    if (!actionConfig || typeof actionConfig !== 'object') {
      throw new Error('Action configuration must be an object');
    }

    if (
      typeof actionConfig.newTitle !== 'string' ||
      actionConfig.newTitle.trim().length === 0
    ) {
      throw new Error(
        'Action configuration must include a non-empty "newTitle" string',
      );
    }

    if (
      actionConfig.mode !== undefined &&
      !['replace', 'append', 'prepend'].includes(String(actionConfig.mode))
    ) {
      throw new Error(
        'Title update mode must be one of: replace, append, prepend',
      );
    }

    return true;
  }
}
