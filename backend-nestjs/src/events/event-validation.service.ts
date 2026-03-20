import { Injectable } from '@nestjs/common';
import { Event, RecurrenceType } from '../entities/event.entity';
import {
  RecurrencePatternDto,
  RecurrenceEndType,
  WeekDay,
} from '../dto/recurrence.dto';

export type EventMutationInput = {
  startDate?: string | number | Date;
  endDate?: string | number | Date;
  startTime?: string | null;
  endTime?: string | null;
  tags?: string[] | null;
  labels?: string[] | null;
  [key: string]: unknown;
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

const toRecurrenceRule = (value: unknown): RecurrenceRule => {
  if (!value || typeof value !== 'object') {
    return {};
  }
  return value as RecurrenceRule;
};

@Injectable()
export class EventValidationService {
  private normalizeEventLabels(
    value: unknown,
  ): string[] | null {
    if (!Array.isArray(value)) {
      return null;
    }

    const normalized: string[] = [];
    const seen = new Set<string>();
    for (const raw of value) {
      const label = typeof raw === 'string' ? raw.trim() : '';
      if (!label) {
        continue;
      }
      const key = label.toLowerCase();
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      normalized.push(label);
      if (normalized.length >= 50) {
        break;
      }
    }
    return normalized.length > 0 ? normalized : null;
  }

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

    const payload = { ...updateData } as Record<string, unknown>;
    const hasLabelsField = 'labels' in payload || 'tags' in payload;
    if (hasLabelsField) {
      const labels = this.normalizeEventLabels(payload.labels ?? payload.tags);
      payload.tags = labels;
    }
    delete payload.labels;

    Object.assign(event, payload as Partial<Event>);
  }

  createEventEntity(
    eventData: EventMutationInput,
    calendarId: number,
    createdById: number,
  ): Event {
    const payload = { ...eventData } as Record<string, unknown>;
    const labels = this.normalizeEventLabels(payload.labels ?? payload.tags);
    payload.tags = labels;
    delete payload.labels;

    const event = new Event();
    Object.assign(event, payload);
    event.calendarId = calendarId;
    event.createdById = createdById;
    event.startDate = new Date(payload.startDate as string | number | Date);
    if (payload.endDate) {
      event.endDate = new Date(payload.endDate as string | number | Date);
    }
    const startTimeValue =
      typeof payload.startTime === 'string' || payload.startTime === null
        ? payload.startTime
        : undefined;
    const endTimeValue =
      typeof payload.endTime === 'string' || payload.endTime === null
        ? payload.endTime
        : undefined;
    event.startTime =
      startTimeValue && startTimeValue !== ''
        ? startTimeValue
        : null;
    event.endTime =
      endTimeValue && endTimeValue !== '' ? endTimeValue : null;
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
    rule: unknown,
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
