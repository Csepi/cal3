import { Injectable } from '@nestjs/common';
import { Event, RecurrenceType } from '../entities/event.entity';
import {
  RecurrencePatternDto,
  RecurrenceEndType,
  WeekDay,
} from '../dto/recurrence.dto';

type EventMutationInput = {
  startDate?: string | number | Date;
  endDate?: string | number | Date;
  startTime?: string | null;
  endTime?: string | null;
  [key: string]: any;
};

type RecurrenceRule = {
  frequency?: RecurrenceType;
  interval?: number;
  endType?: RecurrenceEndType;
  count?: number;
  endDate?: string;
  daysOfWeek?: WeekDay[];
  dayOfMonth?: number;
  monthOfYear?: number;
  timezone?: string;
};

const toRecurrenceRule = (value: any): RecurrenceRule => {
  if (!value || typeof value !== 'object') {
    return {};
  }
  return value as RecurrenceRule;
};

@Injectable()
export class EventValidationService {
  sanitizeAndAssignUpdateData(
    event: Event,
    updateData: EventMutationInput,
  ): void {
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }

    if ('startTime' in updateData) {
      updateData.startTime =
        updateData.startTime && updateData.startTime !== ''
          ? updateData.startTime
          : undefined;
    }
    if ('endTime' in updateData) {
      updateData.endTime =
        updateData.endTime && updateData.endTime !== ''
          ? updateData.endTime
          : undefined;
    }

    Object.assign(event, updateData as Partial<Event>);
  }

  createEventEntity(
    eventData: EventMutationInput,
    calendarId: number,
    createdById: number,
  ): Event {
    const event = new Event();
    Object.assign(event, eventData);
    event.calendarId = calendarId;
    event.createdById = createdById;
    event.startDate = new Date(eventData.startDate as string | number | Date);
    if (eventData.endDate) {
      event.endDate = new Date(eventData.endDate);
    }
    event.startTime =
      eventData.startTime && eventData.startTime !== ''
        ? eventData.startTime
        : null;
    event.endTime =
      eventData.endTime && eventData.endTime !== '' ? eventData.endTime : null;
    return event;
  }

  buildRecurrenceRule(recurrence: RecurrencePatternDto): RecurrenceRule {
    return {
      frequency: recurrence.type,
      interval: recurrence.interval || 1,
      endType: recurrence.endType || RecurrenceEndType.NEVER,
      count: recurrence.count,
      endDate: recurrence.endDate,
      daysOfWeek: recurrence.daysOfWeek,
      dayOfMonth: recurrence.dayOfMonth,
      monthOfYear: recurrence.monthOfYear,
      timezone: recurrence.timezone,
    };
  }

  convertRuleToPattern(
    rule: any,
    recurrenceType: RecurrenceType,
  ): RecurrencePatternDto {
    const safeRule = toRecurrenceRule(rule);
    const pattern = new RecurrencePatternDto();
    pattern.type = recurrenceType;
    pattern.interval = safeRule.interval || 1;
    pattern.endType = safeRule.endType || RecurrenceEndType.NEVER;
    pattern.count = safeRule.count;
    pattern.endDate = safeRule.endDate;
    pattern.daysOfWeek = safeRule.daysOfWeek;
    pattern.dayOfMonth = safeRule.dayOfMonth;
    pattern.monthOfYear = safeRule.monthOfYear;
    pattern.timezone = safeRule.timezone;
    return pattern;
  }
}
