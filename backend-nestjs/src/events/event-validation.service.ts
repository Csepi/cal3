import { Injectable } from '@nestjs/common';
import { Event, RecurrenceType } from '../entities/event.entity';
import { RecurrencePatternDto, RecurrenceEndType } from '../dto/recurrence.dto';

@Injectable()
export class EventValidationService {
  sanitizeAndAssignUpdateData(event: Event, updateData: any): void {
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

    Object.assign(event, updateData);
  }

  createEventEntity(
    eventData: any,
    calendarId: number,
    createdById: number,
  ): Event {
    const event = new Event();
    Object.assign(event, eventData);
    event.calendarId = calendarId;
    event.createdById = createdById;
    event.startDate = new Date(eventData.startDate);
    if (eventData.endDate) {
      event.endDate = new Date(eventData.endDate);
    }
    event.startTime =
      eventData.startTime && eventData.startTime !== ''
        ? eventData.startTime
        : undefined;
    event.endTime =
      eventData.endTime && eventData.endTime !== ''
        ? eventData.endTime
        : undefined;
    return event;
  }

  buildRecurrenceRule(recurrence: RecurrencePatternDto): any {
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
    const pattern = new RecurrencePatternDto();
    pattern.type = recurrenceType;
    pattern.interval = rule.interval || 1;
    pattern.endType = rule.endType || RecurrenceEndType.NEVER;
    pattern.count = rule.count;
    pattern.endDate = rule.endDate;
    pattern.daysOfWeek = rule.daysOfWeek;
    pattern.dayOfMonth = rule.dayOfMonth;
    pattern.monthOfYear = rule.monthOfYear;
    pattern.timezone = rule.timezone;
    return pattern;
  }
}
