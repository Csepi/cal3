import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../../entities/event.entity';
import { AutomationAction, ActionType } from '../../entities/automation-action.entity';
import { IActionExecutor, ActionExecutionResult } from './action-executor.interface';
import { ActionExecutorRegistry } from './action-executor-registry';

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
  ) {}

  onModuleInit() {
    // Self-register with the registry
    this.registry.register(this);
  }

  /**
   * Execute the set event color action
   * @param action The action configuration with color in actionConfig
   * @param event The event to update
   * @returns Execution result
   */
  async execute(action: AutomationAction, event: Event): Promise<ActionExecutionResult> {
    const executedAt = new Date();

    try {
      // Validate configuration
      this.validateConfig(action.actionConfig);

      const color = action.actionConfig.color;
      const previousColor = event.color;

      // Update event color
      event.color = color;
      await this.eventRepository.save(event);

      return {
        success: true,
        actionId: action.id,
        actionType: this.actionType,
        data: {
          previousColor,
          newColor: color,
          eventId: event.id,
          eventTitle: event.title,
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
