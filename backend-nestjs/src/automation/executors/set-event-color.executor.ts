import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../../entities/event.entity';
import {
  AutomationAction,
  ActionType,
} from '../../entities/automation-action.entity';
import {
  IActionExecutor,
  ActionExecutionResult,
  ActionExecutionContext,
} from './action-executor.interface';
import { ActionExecutorRegistry } from './action-executor-registry';
import { AutomationSmartValuesService } from '../automation-smart-values.service';

/**
 * Executor for SET_EVENT_COLOR action
 * Changes the color of an event
 */
@Injectable()
export class SetEventColorExecutor implements IActionExecutor, OnModuleInit {
  readonly actionType = ActionType.SET_EVENT_COLOR;

  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    private readonly registry: ActionExecutorRegistry,
    private readonly smartValuesService: AutomationSmartValuesService,
  ) {}

  onModuleInit() {
    // Self-register with the registry
    this.registry.register(this);
  }

  /**
   * Execute the set event color action with smart values support
   * @param action The action configuration with color in actionConfig
   * @param context The execution context (includes event and webhook data)
   * @returns Execution result
   */
  async execute(
    action: AutomationAction,
    context: ActionExecutionContext,
  ): Promise<ActionExecutionResult> {
    const executedAt = new Date();

    try {
      // Webhook triggers don't have events to modify
      if (!context.event) {
        return {
          success: false,
          actionId: action.id,
          actionType: this.actionType,
          error:
            'No event available to modify (webhook triggers cannot modify events)',
          executedAt,
        };
      }

      // Interpolate smart values in action configuration
      const interpolatedConfig =
        this.smartValuesService.interpolateObjectValues(
          action.actionConfig,
          context,
        );

      // Validate configuration (after interpolation)
      this.validateConfig(interpolatedConfig);

      const color = interpolatedConfig.color;
      const previousColor = context.event.color;

      // Update event color
      context.event.color = color;
      await this.eventRepository.save(context.event);

      return {
        success: true,
        actionId: action.id,
        actionType: this.actionType,
        data: {
          previousColor,
          newColor: color,
          eventId: context.event.id,
          eventTitle: context.event.title,
        },
        executedAt,
      };
    } catch (error) {
      return {
        success: false,
        actionId: action.id,
        actionType: this.actionType,
        error: error.message,
        executedAt,
      };
    }
  }

  /**
   * Validate action configuration
   * @param actionConfig Must contain a valid color (hex format)
   * @returns True if valid
   * @throws Error if invalid
   */
  validateConfig(actionConfig: Record<string, any>): boolean {
    if (!actionConfig || typeof actionConfig !== 'object') {
      throw new Error('Action configuration must be an object');
    }

    if (!actionConfig.color) {
      throw new Error('Action configuration must include a "color" property');
    }

    const color = actionConfig.color;

    if (typeof color !== 'string') {
      throw new Error('Color must be a string');
    }

    // Validate hex color format (#RRGGBB or #RGB)
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(color)) {
      throw new Error(
        `Invalid color format: "${color}". Expected hex format like #3b82f6 or #f00`,
      );
    }

    return true;
  }
}
