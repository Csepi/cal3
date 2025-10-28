import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AutomationAction, ActionType } from '../../entities/automation-action.entity';
import { Event } from '../../entities/event.entity';
import { Calendar } from '../../entities/calendar.entity';
import {
  IActionExecutor,
  ActionExecutionContext,
  ActionExecutionResult,
} from './action-executor.interface';
import { ActionExecutorRegistry } from './action-executor-registry';
import { AutomationSmartValuesService } from '../automation-smart-values.service';

@Injectable()
export class MoveToCalendarExecutor implements IActionExecutor, OnModuleInit {
  readonly actionType = ActionType.MOVE_TO_CALENDAR;

  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Calendar)
    private readonly calendarRepository: Repository<Calendar>,
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
        throw new Error('No event available to move');
      }

      const interpolatedConfig = this.smartValuesService.interpolateObjectValues(
        action.actionConfig || {},
        context,
      );
      this.validateConfig(interpolatedConfig);

      const targetId = Number(interpolatedConfig.targetCalendarId);
      if (Number.isNaN(targetId)) {
        throw new Error('Target calendar ID must be a number');
      }

      const targetCalendar = await this.calendarRepository.findOne({
        where: { id: targetId },
      });

      if (!targetCalendar) {
        throw new Error('Target calendar not found');
      }

      const event = context.event;
      const previousCalendarId = event.calendarId;

      if (previousCalendarId === targetCalendar.id) {
        return {
          success: true,
          actionId: action.id,
          actionType: this.actionType,
          data: {
            previousCalendarId,
            newCalendarId: targetCalendar.id,
            changed: false,
          },
          executedAt,
        };
      }

      await this.eventRepository.update(event.id, { calendarId: targetCalendar.id });
      event.calendarId = targetCalendar.id;
      event.calendar = targetCalendar;

      return {
        success: true,
        actionId: action.id,
        actionType: this.actionType,
        data: {
          previousCalendarId,
          newCalendarId: targetCalendar.id,
          changed: true,
        },
        executedAt,
      };
    } catch (error) {
      return {
        success: false,
        actionId: action.id,
        actionType: this.actionType,
        error: error.message || 'Failed to move event to target calendar',
        executedAt,
      };
    }
  }

  validateConfig(actionConfig: Record<string, any>): boolean {
    if (!actionConfig || typeof actionConfig !== 'object') {
      throw new Error('Action configuration must be an object');
    }

    if (
      actionConfig.targetCalendarId === undefined ||
      actionConfig.targetCalendarId === null ||
      String(actionConfig.targetCalendarId).trim() === ''
    ) {
      throw new Error('Action configuration must include "targetCalendarId"');
    }

    return true;
  }
}
