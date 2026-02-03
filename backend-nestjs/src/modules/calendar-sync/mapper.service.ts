import { Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { Event, RecurrenceType } from '../../entities/event.entity';
import { SyncProvider } from '../../entities/calendar-sync.entity';
import { logError } from '../../common/errors/error-logger';
import { buildErrorContext } from '../../common/errors/error-context';

interface ExternalDateTimeValue {
  dateTime?: string;
  date?: string;
  timeZone?: string;
}

interface ExternalEventData {
  [key: string]: unknown;
  id?: string;
  subject?: string;
  summary?: string;
  description?: string;
  body?: { content?: string };
  bodyPreview?: string;
  location?: { displayName?: string };
  isAllDay?: boolean;
  start?: ExternalDateTimeValue;
  end?: ExternalDateTimeValue;
  originalStartTimeZone?: string;
  originalEndTimeZone?: string;
  originalStart?: string;
  originalStartTime?: ExternalDateTimeValue;
  seriesMasterId?: string;
  recurringEventId?: string;
}

@Injectable()
export class CalendarSyncMapperService {
  private readonly logger = new Logger(CalendarSyncMapperService.name);

  buildLocalEventData(
    provider: SyncProvider,
    externalEvent: ExternalEventData,
    userTimezone: string,
  ): Partial<Event> {
    let eventData: Partial<Event> = {};

    if (provider === SyncProvider.MICROSOFT) {
      eventData = {
        title: externalEvent.subject || 'Untitled Event',
        description:
          externalEvent.body?.content || externalEvent.bodyPreview || '',
        location: externalEvent.location?.displayName || '',
        isAllDay: externalEvent.isAllDay || false,
      };

      if (externalEvent.start) {
        if (externalEvent.isAllDay) {
          eventData.startDate =
            this.toDate(
              externalEvent.start.dateTime || externalEvent.start.date,
            ) ?? undefined;
          eventData.startTime = null;
        } else {
          const start = this.convertToUserDateTime(
            externalEvent.start.dateTime,
            userTimezone,
            [
              externalEvent.start.timeZone,
              externalEvent.originalStartTimeZone,
              externalEvent.originalEndTimeZone,
            ],
          );
          if (start) {
            eventData.startDate = new Date(start.datePart);
            eventData.startTime = start.timePart;
          }
        }
      }

      eventData.recurrenceType = RecurrenceType.NONE;

      if (externalEvent.seriesMasterId) {
        eventData.recurrenceId = externalEvent.seriesMasterId;
        if (externalEvent.originalStart) {
          eventData.originalDate =
            this.toDate(externalEvent.originalStart) ?? undefined;
        }
      }

      if (externalEvent.end) {
        if (externalEvent.isAllDay) {
          const rawEndDate =
            externalEvent.end.dateTime || externalEvent.end.date;
          eventData.endDate =
            this.normalizeAllDayEndDate(rawEndDate) ?? undefined;
          eventData.endTime = null;
        } else {
          const end = this.convertToUserDateTime(
            externalEvent.end.dateTime,
            userTimezone,
            [
              externalEvent.end.timeZone,
              externalEvent.originalEndTimeZone,
              externalEvent.originalStartTimeZone,
            ],
          );
          if (end) {
            eventData.endDate = new Date(end.datePart);
            eventData.endTime = end.timePart;
          }
        }
      }
    } else if (provider === SyncProvider.GOOGLE) {
      eventData = {
        title: externalEvent.summary || 'Untitled Event',
        description: externalEvent.description || '',
        location:
          typeof externalEvent.location === 'string'
            ? externalEvent.location
            : '',
      };

      eventData.recurrenceType = RecurrenceType.NONE;

      if (externalEvent.recurringEventId) {
        eventData.recurrenceId = externalEvent.recurringEventId;
        if (externalEvent.originalStartTime) {
          eventData.originalDate = this.toDate(
            externalEvent.originalStartTime.dateTime ??
              externalEvent.originalStartTime.date,
          );
        }
      }

      if (externalEvent.start) {
        if (externalEvent.start.date) {
          eventData.isAllDay = true;
          eventData.startDate =
            this.toDate(externalEvent.start.date) ?? undefined;
          eventData.startTime = null;
        } else if (externalEvent.start.dateTime) {
          eventData.isAllDay = false;
          const start = this.convertToUserDateTime(
            externalEvent.start.dateTime,
            userTimezone,
            [externalEvent.start.timeZone],
          );
          if (start) {
            eventData.startDate = new Date(start.datePart);
            eventData.startTime = start.timePart;
          }
        }
      }

      if (externalEvent.end) {
        if (externalEvent.end.date) {
          eventData.endDate =
            this.normalizeAllDayEndDate(externalEvent.end.date) ?? undefined;
          eventData.endTime = null;
        } else if (externalEvent.end.dateTime) {
          const end = this.convertToUserDateTime(
            externalEvent.end.dateTime,
            userTimezone,
            [externalEvent.end.timeZone],
          );
          if (end) {
            eventData.endDate = new Date(end.datePart);
            eventData.endTime = end.timePart;
          }
        }
      }
    }

    return eventData;
  }

  normalizeAllDayEndDate(rawDate: unknown): Date | null {
    if (!rawDate) {
      return null;
    }
    const parsed = this.toDate(rawDate);
    if (!parsed) {
      return null;
    }
    parsed.setDate(parsed.getDate() - 1);
    return parsed;
  }

  getSafeUserTimezone(timeZone?: unknown): string {
    const fallback = 'UTC';
    if (typeof timeZone !== 'string' || !timeZone) return fallback;

    try {
      new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
      return timeZone;
    } catch (error) {
      logError(error, buildErrorContext({ action: 'calendar-sync.mapper' }));
      this.logger.warn(
        `[calendar-sync] Invalid user timezone "${timeZone}", falling back to ${fallback}`,
      );
      return fallback;
    }
  }

  getMicrosoftTimeZone(timeZone: unknown): string | undefined {
    if (typeof timeZone !== 'string' || !timeZone) return undefined;
    const trimmed = timeZone.trim();
    if (!trimmed) return undefined;

    const windowsFromIana = this.mapIanaToWindows(trimmed);
    if (windowsFromIana) {
      return windowsFromIana;
    }

    if (this.mapWindowsToIana(trimmed)) {
      return trimmed;
    }

    return undefined;
  }

  resolveTimeZone(timeZone?: unknown): string | undefined {
    if (typeof timeZone !== 'string' || !timeZone) return undefined;
    const trimmed = timeZone.trim();
    const mapped = this.mapWindowsToIana(trimmed);
    const candidate = mapped || trimmed;
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: candidate }).format(
        new Date(),
      );
      return candidate;
    } catch {
      return undefined;
    }
  }

  convertToUserDateTime(
    rawDateTime: unknown,
    userTimezone: string,
    preferredSourceTimezones: unknown[],
  ): { datePart: string; timePart: string } | null {
    if (typeof rawDateTime !== 'string' || !rawDateTime) return null;

    const sourceZone =
      preferredSourceTimezones
        .map((tz) => this.resolveTimeZone(tz))
        .find((tz): tz is string => !!tz) || 'UTC';

    const hasOffset = /([zZ]|[+-]\\d{2}:?\\d{2})$/.test(rawDateTime);

    let sourceDateTime = DateTime.fromISO(rawDateTime, {
      zone: hasOffset ? undefined : sourceZone,
      setZone: true,
    });

    if (!sourceDateTime.isValid) {
      sourceDateTime = DateTime.fromJSDate(new Date(rawDateTime)).setZone(
        sourceZone,
      );
    }

    const userDateTime = sourceDateTime.setZone(userTimezone);
    if (!userDateTime.isValid) return null;

    return {
      datePart: userDateTime.toISODate(),
      timePart: userDateTime.toFormat('HH:mm'),
    };
  }

  private toDate(value: unknown): Date | null {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : new Date(value);
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  }

  mapWindowsToIana(timeZone: string): string | undefined {
    const normalized = timeZone.toLowerCase();
    const windowsToIana: Record<string, string> = {
      utc: 'UTC',
      'w. europe standard time': 'Europe/Berlin',
      'central europe standard time': 'Europe/Budapest',
      'central european standard time': 'Europe/Warsaw',
      'romance standard time': 'Europe/Paris',
      'gmt standard time': 'Europe/London',
      'greenwich standard time': 'Etc/Greenwich',
      'e. europe standard time': 'Europe/Bucharest',
      'eastern standard time': 'America/New_York',
      'pacific standard time': 'America/Los_Angeles',
      'mountain standard time': 'America/Denver',
      'china standard time': 'Asia/Shanghai',
      'tokyo standard time': 'Asia/Tokyo',
      'india standard time': 'Asia/Kolkata',
    };
    return windowsToIana[normalized];
  }

  mapIanaToWindows(timeZone: string): string | undefined {
    const normalized = timeZone.toLowerCase();
    const ianaToWindows: Record<string, string> = {
      utc: 'UTC',
      'europe/berlin': 'W. Europe Standard Time',
      'europe/budapest': 'Central Europe Standard Time',
      'europe/warsaw': 'Central European Standard Time',
      'europe/paris': 'Romance Standard Time',
      'europe/london': 'GMT Standard Time',
      'etc/greenwich': 'Greenwich Standard Time',
      'europe/bucharest': 'E. Europe Standard Time',
      'america/new_york': 'Eastern Standard Time',
      'america/los_angeles': 'Pacific Standard Time',
      'america/denver': 'Mountain Standard Time',
      'asia/shanghai': 'China Standard Time',
      'asia/tokyo': 'Tokyo Standard Time',
      'asia/kolkata': 'India Standard Time',
    };
    return ianaToWindows[normalized];
  }
}
