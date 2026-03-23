import { Event, RecurrenceType } from '../entities/event.entity';

export const RELATIVE_TIME_TO_EVENT_TRIGGER_TYPE = 'relative_time_to_event';
export const RELATIVE_TIME_CONFIG_VERSION = 1;

export type RelativeTimeReferenceBase = 'start' | 'end';
export type RelativeTimeOffsetDirection = 'before' | 'after';
export type RelativeTimeOffsetUnit = 'minutes' | 'hours' | 'days' | 'weeks';

type RelativeEventFilterInput = {
  calendars?: unknown;
  calendarIds?: unknown;
  titleContains?: unknown;
  descriptionContains?: unknown;
  tags?: unknown;
  labels?: unknown;
  isAllDayOnly?: unknown;
  isRecurringOnly?: unknown;
};

type RelativeExecutionInput = {
  runOncePerEvent?: unknown;
  fireForEveryOccurrenceOfRecurringEvent?: unknown;
  skipPast?: unknown;
  pastDueGraceMinutes?: unknown;
  schedulingWindowDays?: unknown;
};

type RelativeTimeTriggerInput = {
  configVersion?: unknown;
  eventFilter?: unknown;
  referenceTime?: unknown;
  offset?: unknown;
  execution?: unknown;
  minutes?: unknown;
};

export interface RelativeTimeToEventFilter {
  calendarIds: number[];
  titleContains: string | null;
  descriptionContains: string | null;
  tags: string[];
  isAllDayOnly: boolean;
  isRecurringOnly: boolean;
}

export interface RelativeTimeToEventExecution {
  runOncePerEvent: boolean;
  fireForEveryOccurrenceOfRecurringEvent: boolean;
  skipPast: boolean;
  pastDueGraceMinutes: number;
  schedulingWindowDays: number;
}

export interface RelativeTimeToEventTriggerConfig {
  configVersion: number;
  eventFilter: RelativeTimeToEventFilter;
  referenceTime: {
    base: RelativeTimeReferenceBase;
  };
  offset: {
    direction: RelativeTimeOffsetDirection;
    value: number;
    unit: RelativeTimeOffsetUnit;
  };
  execution: RelativeTimeToEventExecution;
}

interface LocalDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

const MAX_OFFSET_MINUTES = 60 * 24 * 365; // one year
const MIN_SCHEDULING_WINDOW_DAYS = 1;
const MAX_SCHEDULING_WINDOW_DAYS = 365 * 2;
const MAX_GRACE_MINUTES = 60;

const DEFAULT_CONFIG: RelativeTimeToEventTriggerConfig = {
  configVersion: RELATIVE_TIME_CONFIG_VERSION,
  eventFilter: {
    calendarIds: [],
    titleContains: null,
    descriptionContains: null,
    tags: [],
    isAllDayOnly: false,
    isRecurringOnly: false,
  },
  referenceTime: {
    base: 'start',
  },
  offset: {
    direction: 'before',
    value: 30,
    unit: 'minutes',
  },
  execution: {
    runOncePerEvent: true,
    fireForEveryOccurrenceOfRecurringEvent: true,
    skipPast: true,
    pastDueGraceMinutes: 0,
    schedulingWindowDays: 365,
  },
};

const FORMATTER_CACHE = new Map<string, Intl.DateTimeFormat>();

const getFormatter = (timeZone: string): Intl.DateTimeFormat => {
  const cacheKey = `en-US|${timeZone}`;
  const cached = FORMATTER_CACHE.get(cacheKey);
  if (cached) {
    return cached;
  }
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  FORMATTER_CACHE.set(cacheKey, formatter);
  return formatter;
};

const toRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
};

const toInt = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.trunc(parsed);
    }
  }
  return null;
};

const toBoolean = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') {
      return true;
    }
    if (value.toLowerCase() === 'false') {
      return false;
    }
  }
  return fallback;
};

const toNullableTrimmedString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toStringList = (value: unknown): string[] => {
  const source: unknown[] = [];
  if (Array.isArray(value)) {
    source.push(...value);
  } else if (typeof value === 'string') {
    source.push(...value.split(','));
  }

  const dedup = new Set<string>();
  for (const item of source) {
    if (typeof item !== 'string') {
      continue;
    }
    const normalized = item.trim();
    if (!normalized) {
      continue;
    }
    dedup.add(normalized);
  }
  return [...dedup];
};

const toNumericList = (value: unknown): number[] => {
  const numbers = new Set<number>();
  if (Array.isArray(value)) {
    for (const rawItem of value) {
      const parsed = toInt(rawItem);
      if (parsed !== null && parsed > 0) {
        numbers.add(parsed);
      }
    }
  }
  return [...numbers];
};

const assertValidTimeZone = (timeZone: string): boolean => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
};

const parseOffsetUnit = (value: unknown): RelativeTimeOffsetUnit => {
  if (
    value === 'minutes' ||
    value === 'hours' ||
    value === 'days' ||
    value === 'weeks'
  ) {
    return value;
  }
  return DEFAULT_CONFIG.offset.unit;
};

const parseOffsetDirection = (value: unknown): RelativeTimeOffsetDirection => {
  if (value === 'before' || value === 'after') {
    return value;
  }
  return DEFAULT_CONFIG.offset.direction;
};

const parseReferenceBase = (value: unknown): RelativeTimeReferenceBase => {
  if (value === 'start' || value === 'end') {
    return value;
  }
  return DEFAULT_CONFIG.referenceTime.base;
};

const normalizeOffsetValue = (value: unknown): number => {
  const parsed = toInt(value);
  if (parsed === null) {
    return DEFAULT_CONFIG.offset.value;
  }
  if (parsed < 0) {
    throw new Error('Relative trigger offset value must be >= 0');
  }
  if (parsed > MAX_OFFSET_MINUTES) {
    throw new Error('Relative trigger offset value is too large');
  }
  return parsed;
};

const normalizeGraceMinutes = (value: unknown): number => {
  const parsed = toInt(value);
  if (parsed === null) {
    return DEFAULT_CONFIG.execution.pastDueGraceMinutes;
  }
  if (parsed < 0) {
    throw new Error('pastDueGraceMinutes must be >= 0');
  }
  return Math.min(parsed, MAX_GRACE_MINUTES);
};

const normalizeSchedulingWindowDays = (value: unknown): number => {
  const parsed = toInt(value);
  if (parsed === null) {
    return DEFAULT_CONFIG.execution.schedulingWindowDays;
  }
  if (parsed < MIN_SCHEDULING_WINDOW_DAYS) {
    return MIN_SCHEDULING_WINDOW_DAYS;
  }
  return Math.min(parsed, MAX_SCHEDULING_WINDOW_DAYS);
};

const parseDateToUtcParts = (date: Date): LocalDateTimeParts => ({
  year: date.getUTCFullYear(),
  month: date.getUTCMonth() + 1,
  day: date.getUTCDate(),
  hour: 0,
  minute: 0,
});

const parseTimeToParts = (
  timeValue: string | null | undefined,
): { hour: number; minute: number } => {
  if (!timeValue || typeof timeValue !== 'string') {
    return { hour: 0, minute: 0 };
  }
  const [hourPart, minutePart] = timeValue.split(':');
  const hour = Number.parseInt(hourPart ?? '', 10);
  const minute = Number.parseInt(minutePart ?? '', 10);
  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return { hour: 0, minute: 0 };
  }
  return { hour, minute };
};

const plusDays = (date: Date, days: number): Date => {
  const value = new Date(date.getTime());
  value.setUTCDate(value.getUTCDate() + days);
  return value;
};

const getTimeZoneOffsetMillis = (utcDate: Date, timeZone: string): number => {
  const formatter = getFormatter(timeZone);
  const parts = formatter.formatToParts(utcDate);
  const values: Record<string, number> = {};

  for (const part of parts) {
    if (
      part.type === 'year' ||
      part.type === 'month' ||
      part.type === 'day' ||
      part.type === 'hour' ||
      part.type === 'minute' ||
      part.type === 'second'
    ) {
      values[part.type] = Number.parseInt(part.value, 10);
    }
  }

  const asUtc = Date.UTC(
    values.year ?? 1970,
    (values.month ?? 1) - 1,
    values.day ?? 1,
    values.hour ?? 0,
    values.minute ?? 0,
    values.second ?? 0,
    0,
  );
  return asUtc - utcDate.getTime();
};

const zonedLocalDateTimeToUtc = (
  localDateTime: LocalDateTimeParts,
  timeZone: string,
): Date => {
  const naiveUtc = Date.UTC(
    localDateTime.year,
    localDateTime.month - 1,
    localDateTime.day,
    localDateTime.hour,
    localDateTime.minute,
    0,
    0,
  );

  let guess = naiveUtc;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const offset = getTimeZoneOffsetMillis(new Date(guess), timeZone);
    const adjusted = naiveUtc - offset;
    if (Math.abs(adjusted - guess) < 1) {
      guess = adjusted;
      break;
    }
    guess = adjusted;
  }
  return new Date(guess);
};

const applyOffset = (
  localDateTime: LocalDateTimeParts,
  direction: RelativeTimeOffsetDirection,
  value: number,
  unit: RelativeTimeOffsetUnit,
): LocalDateTimeParts => {
  const sign = direction === 'before' ? -1 : 1;
  const cursor = new Date(
    Date.UTC(
      localDateTime.year,
      localDateTime.month - 1,
      localDateTime.day,
      localDateTime.hour,
      localDateTime.minute,
      0,
      0,
    ),
  );

  switch (unit) {
    case 'minutes':
      cursor.setUTCMinutes(cursor.getUTCMinutes() + sign * value);
      break;
    case 'hours':
      cursor.setUTCHours(cursor.getUTCHours() + sign * value);
      break;
    case 'days':
      cursor.setUTCDate(cursor.getUTCDate() + sign * value);
      break;
    case 'weeks':
      cursor.setUTCDate(cursor.getUTCDate() + sign * value * 7);
      break;
  }

  return {
    year: cursor.getUTCFullYear(),
    month: cursor.getUTCMonth() + 1,
    day: cursor.getUTCDate(),
    hour: cursor.getUTCHours(),
    minute: cursor.getUTCMinutes(),
  };
};

export const isRelativeTimeToEventTrigger = (triggerType: string): boolean =>
  triggerType === RELATIVE_TIME_TO_EVENT_TRIGGER_TYPE;

export const isRecurringEvent = (event: Event): boolean =>
  event.recurrenceType !== RecurrenceType.NONE ||
  event.parentEventId !== null ||
  Boolean(event.recurrenceId);

export const normalizeRelativeTimeToEventTriggerConfig = (
  input: Record<string, unknown> | null | undefined,
): RelativeTimeToEventTriggerConfig => {
  const value = toRecord(input) as RelativeTimeTriggerInput;
  const eventFilterInput = toRecord(
    value.eventFilter,
  ) as RelativeEventFilterInput;
  const executionInput = toRecord(value.execution) as RelativeExecutionInput;

  const referenceTimeInput = toRecord(value.referenceTime);
  const offsetInput = toRecord(value.offset);

  const minutesFallback = toInt(value.minutes);
  const offsetValueSource =
    offsetInput.value !== undefined ? offsetInput.value : minutesFallback;

  const calendarCandidates =
    eventFilterInput.calendarIds !== undefined
      ? eventFilterInput.calendarIds
      : eventFilterInput.calendars;

  const tagsCandidates =
    eventFilterInput.tags !== undefined
      ? eventFilterInput.tags
      : eventFilterInput.labels;

  const configVersion = toInt(value.configVersion);

  return {
    configVersion:
      configVersion && configVersion > 0
        ? configVersion
        : RELATIVE_TIME_CONFIG_VERSION,
    eventFilter: {
      calendarIds: toNumericList(calendarCandidates),
      titleContains: toNullableTrimmedString(eventFilterInput.titleContains),
      descriptionContains: toNullableTrimmedString(
        eventFilterInput.descriptionContains,
      ),
      tags: toStringList(tagsCandidates),
      isAllDayOnly: toBoolean(
        eventFilterInput.isAllDayOnly,
        DEFAULT_CONFIG.eventFilter.isAllDayOnly,
      ),
      isRecurringOnly: toBoolean(
        eventFilterInput.isRecurringOnly,
        DEFAULT_CONFIG.eventFilter.isRecurringOnly,
      ),
    },
    referenceTime: {
      base: parseReferenceBase(
        referenceTimeInput.base ?? value.referenceTime ?? 'start',
      ),
    },
    offset: {
      direction: parseOffsetDirection(offsetInput.direction),
      value: normalizeOffsetValue(offsetValueSource),
      unit: parseOffsetUnit(offsetInput.unit),
    },
    execution: {
      runOncePerEvent: toBoolean(
        executionInput.runOncePerEvent,
        DEFAULT_CONFIG.execution.runOncePerEvent,
      ),
      fireForEveryOccurrenceOfRecurringEvent: toBoolean(
        executionInput.fireForEveryOccurrenceOfRecurringEvent,
        DEFAULT_CONFIG.execution.fireForEveryOccurrenceOfRecurringEvent,
      ),
      skipPast: toBoolean(
        executionInput.skipPast,
        DEFAULT_CONFIG.execution.skipPast,
      ),
      pastDueGraceMinutes: normalizeGraceMinutes(
        executionInput.pastDueGraceMinutes,
      ),
      schedulingWindowDays: normalizeSchedulingWindowDays(
        executionInput.schedulingWindowDays,
      ),
    },
  };
};

export const resolveEventTimeZone = (
  event: Event,
  fallbackTimeZone: string,
): string => {
  const fallback = assertValidTimeZone(fallbackTimeZone)
    ? fallbackTimeZone
    : 'UTC';

  const recurrenceRuleObject = (() => {
    if (!event.recurrenceRule) {
      return null;
    }
    if (typeof event.recurrenceRule === 'string') {
      try {
        return toRecord(JSON.parse(event.recurrenceRule));
      } catch {
        return null;
      }
    }
    return toRecord(event.recurrenceRule);
  })();

  const candidateTimezone = toNullableTrimmedString(
    recurrenceRuleObject?.timezone,
  );
  if (candidateTimezone && assertValidTimeZone(candidateTimezone)) {
    return candidateTimezone;
  }
  return fallback;
};

const resolveReferenceLocalDateTime = (
  event: Event,
  base: RelativeTimeReferenceBase,
): LocalDateTimeParts | null => {
  const startDate = event.startDate instanceof Date ? event.startDate : null;
  if (!startDate) {
    return null;
  }

  if (event.isAllDay) {
    if (base === 'start') {
      return parseDateToUtcParts(startDate);
    }

    const endSource =
      event.endDate instanceof Date
        ? event.endDate
        : event.startDate instanceof Date
          ? event.startDate
          : null;
    if (!endSource) {
      return null;
    }

    return parseDateToUtcParts(plusDays(endSource, 1));
  }

  const referenceDate =
    base === 'end'
      ? event.endDate instanceof Date
        ? event.endDate
        : event.startDate
      : event.startDate;
  if (!(referenceDate instanceof Date)) {
    return null;
  }

  const { hour, minute } = parseTimeToParts(
    base === 'end' ? (event.endTime ?? event.startTime) : event.startTime,
  );
  return {
    ...parseDateToUtcParts(referenceDate),
    hour,
    minute,
  };
};

export const computeRelativeTimeToEventScheduleAt = (
  event: Event,
  config: RelativeTimeToEventTriggerConfig,
  fallbackTimeZone: string,
): Date | null => {
  const referenceLocalDateTime = resolveReferenceLocalDateTime(
    event,
    config.referenceTime.base,
  );
  if (!referenceLocalDateTime) {
    return null;
  }

  const targetLocalDateTime = applyOffset(
    referenceLocalDateTime,
    config.offset.direction,
    config.offset.value,
    config.offset.unit,
  );
  const eventTimeZone = resolveEventTimeZone(event, fallbackTimeZone);
  return zonedLocalDateTimeToUtc(targetLocalDateTime, eventTimeZone);
};

export const matchesRelativeTimeToEventFilter = (
  event: Event,
  filter: RelativeTimeToEventFilter,
): boolean => {
  if (
    filter.calendarIds.length > 0 &&
    !filter.calendarIds.includes(event.calendarId)
  ) {
    return false;
  }

  if (filter.isAllDayOnly && !event.isAllDay) {
    return false;
  }

  if (filter.isRecurringOnly && !isRecurringEvent(event)) {
    return false;
  }

  if (filter.titleContains) {
    const title = (event.title ?? '').toLowerCase();
    if (!title.includes(filter.titleContains.toLowerCase())) {
      return false;
    }
  }

  if (filter.descriptionContains) {
    const description = (event.description ?? '').toLowerCase();
    if (!description.includes(filter.descriptionContains.toLowerCase())) {
      return false;
    }
  }

  if (filter.tags.length > 0) {
    const eventTags = (event.tags ?? []).map((tag) => tag.toLowerCase());
    const hasMatchingTag = filter.tags.some((tag) =>
      eventTags.includes(tag.toLowerCase()),
    );
    if (!hasMatchingTag) {
      return false;
    }
  }

  return true;
};
