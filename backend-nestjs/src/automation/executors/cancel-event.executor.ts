import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AutomationAction,
  ActionType,
} from '../../entities/automation-action.entity';
import { Event, EventStatus } from '../../entities/event.entity';
import {
  IActionExecutor,
  ActionExecutionContext,
  ActionExecutionResult,
} from './action-executor.interface';
import { ActionExecutorRegistry } from './action-executor-registry';
import { AutomationSmartValuesService } from '../automation-smart-values.service';

@Injectable()
export class CancelEventExecutor implements IActionExecutor, OnModuleInit {
  readonly actionType = ActionType.CANCEL_EVENT;

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
        throw new Error('No event available to cancel');
      }

      const interpolatedConfig =
        this.smartValuesService.interpolateObjectValues(
          action.actionConfig || {},
          context,
        );
      this.validateConfig(interpolatedConfig);

      const reason =
        interpolatedConfig.reason !== undefined &&
        interpolatedConfig.reason !== null
          ? String(interpolatedConfig.reason).trim()
          : undefined;

      const event = context.event;
      const previousStatus = event.status;

      await this.eventRepository.update(event.id, {
        status: EventStatus.CANCELLED,
        notes: reason
          ? this.appendCancellationReason(event.notes, reason, executedAt)
          : event.notes,
      });

      event.status = EventStatus.CANCELLED;
      if (reason) {
        event.notes = this.appendCancellationReason(
          event.notes,
          reason,
          executedAt,
        );
      }

      return {
        success: true,
        actionId: action.id,
        actionType: this.actionType,
        data: {
          previousStatus,
          reason: reason || null,
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
            : String(error) || 'Failed to cancel event',
        executedAt,
      };
    }
  }

  validateConfig(actionConfig: Record<string, unknown>): boolean {
    if (!actionConfig || typeof actionConfig !== 'object') {
      throw new Error('Action configuration must be an object');
    }

    if (
      actionConfig.reason !== undefined &&
      actionConfig.reason !== null &&
      typeof actionConfig.reason !== 'string'
    ) {
      throw new Error('Cancellation reason must be a string when provided');
    }

    return true;
  }

  private appendCancellationReason(
    currentNotes: string | null | undefined,
    reason: string,
    executedAt: Date,
  ): string {
    const reasonText = `Cancelled automatically (${executedAt.toISOString()}): ${reason}`;
    return currentNotes && currentNotes.trim().length > 0
      ? `${currentNotes}\n${reasonText}`
      : reasonText;
  }
}
