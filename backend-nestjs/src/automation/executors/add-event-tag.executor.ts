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
export class AddEventTagExecutor implements IActionExecutor, OnModuleInit {
  readonly actionType = ActionType.ADD_EVENT_TAG;

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
        throw new Error('No event available to tag');
      }

      const interpolatedConfig =
        this.smartValuesService.interpolateObjectValues(
          action.actionConfig || {},
          context,
        );
      this.validateConfig(interpolatedConfig);

      const rawTags = (interpolatedConfig.tag as string)
        .split(',')
        .map((tag) => tag.trim());
      const tagsToAdd = rawTags.filter((tag) => tag.length > 0);

      if (tagsToAdd.length === 0) {
        throw new Error('No tags provided after processing');
      }

      const event = context.event;
      const existingTags = Array.isArray(event.tags) ? [...event.tags] : [];
      const addedTags: string[] = [];

      for (const tag of tagsToAdd) {
        if (!existingTags.includes(tag)) {
          existingTags.push(tag);
          addedTags.push(tag);
        }
      }

      await this.eventRepository.update(event.id, { tags: existingTags });
      event.tags = existingTags;

      return {
        success: true,
        actionId: action.id,
        actionType: this.actionType,
        data: {
          addedTags,
          tags: existingTags,
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
            : String(error) || 'Failed to add tag to event',
        executedAt,
      };
    }
  }

  validateConfig(actionConfig: Record<string, unknown>): boolean {
    if (!actionConfig || typeof actionConfig !== 'object') {
      throw new Error('Action configuration must be an object');
    }

    if (
      typeof actionConfig.tag !== 'string' ||
      actionConfig.tag.trim().length === 0
    ) {
      throw new Error(
        'Action configuration must include a non-empty "tag" string',
      );
    }

    return true;
  }
}
