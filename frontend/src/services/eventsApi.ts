import { apiService } from './api';
import { http } from '../lib/http';
import { HttpError } from '../lib/http';
import type {
  Event,
  CreateEventRequest,
  UpdateEventRequest,
  RecurrencePattern,
} from '../types/Event';
import type {
  EventComment,
  EventCommentsResponse,
  CreateEventCommentRequest,
  UpdateEventCommentRequest,
} from '../types/EventComment';
import type { UpdateRecurringEventRequest } from './api';

type EventLabelFieldSupport = 'unknown' | 'supported' | 'unsupported';
let eventLabelFieldSupport: EventLabelFieldSupport = 'unknown';
const FALLBACK_REMOVABLE_EVENT_FIELDS = new Set([
  'description',
  'startTime',
  'endDate',
  'endTime',
  'isAllDay',
  'location',
  'status',
  'recurrenceType',
  'recurrenceRule',
  'color',
  'icon',
  'notes',
  'tags',
  'labels',
  'calendarId',
  'updateMode',
]);

const CUSTOM_EMOJI_TOKEN_PATTERN = /^:c[a-z0-9]{5}:$/;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_ONLY_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;
const RECURRENCE_TYPES = new Set(['none', 'daily', 'weekly', 'monthly', 'yearly']);
const RECURRENCE_UPDATE_MODES = new Set(['single', 'future', 'all']);
const VALIDATION_FIELD_PATTERN = /(?:property\s+([a-zA-Z0-9_]+)\s+should\s+not\s+exist)|(?:^([a-zA-Z0-9_]+)\s+must\s+)/g;
const ALLOWED_EVENT_FIELDS = new Set([
  'title',
  'description',
  'startDate',
  'startTime',
  'endDate',
  'endTime',
  'isAllDay',
  'location',
  'status',
  'recurrenceType',
  'recurrenceRule',
  'color',
  'icon',
  'notes',
  'tags',
  'labels',
  'calendarId',
  'updateMode',
]);

const toLocalDateString = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const hasOwn = (value: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(value, key);

const asRecord = (value: object): Record<string, unknown> =>
  value as unknown as Record<string, unknown>;

const normalizeDateField = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    if (DATE_ONLY_PATTERN.test(trimmed)) {
      return trimmed;
    }
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      return undefined;
    }
    return toLocalDateString(parsed);
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return undefined;
    }
    return toLocalDateString(value);
  }

  return undefined;
};

const normalizeTimeField = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const match = trimmed.match(TIME_ONLY_PATTERN);
  if (!match) {
    return undefined;
  }
  return `${match[1]}:${match[2]}`;
};

const normalizeLabels = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized: string[] = [];
  const seen = new Set<string>();
  for (const entry of value) {
    if (typeof entry !== 'string') {
      continue;
    }
    const label = entry.trim();
    if (!label) {
      continue;
    }
    const key = label.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    normalized.push(label.slice(0, 64));
    if (normalized.length >= 50) {
      break;
    }
  }

  return normalized;
};

const normalizeIconField = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (CUSTOM_EMOJI_TOKEN_PATTERN.test(trimmed)) {
    return trimmed;
  }

  // Avoid invalid icon payloads that end up as mojibake or oversized DB values.
  if (!/\p{Extended_Pictographic}/u.test(trimmed) || trimmed.length > 10) {
    return undefined;
  }

  return trimmed;
};

const sanitizeRecurrenceRule = (value: unknown): Record<string, unknown> | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  const raw = value as Record<string, unknown>;
  const cleaned: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(raw)) {
    if (entry === undefined || entry === null || entry === '') {
      continue;
    }
    cleaned[key] = entry;
  }
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
};

const sanitizeEventPayload = (
  payload: Record<string, unknown>,
): Record<string, unknown> => {
  const next = { ...payload };

  for (const key of Object.keys(next)) {
    if (!ALLOWED_EVENT_FIELDS.has(key)) {
      delete next[key];
    }
  }

  if (hasOwn(next, 'title') && typeof next.title === 'string') {
    next.title = next.title.trim().slice(0, 300);
  }

  if (hasOwn(next, 'startDate')) {
    const startDate = normalizeDateField(next.startDate);
    if (startDate) {
      next.startDate = startDate;
    } else {
      delete next.startDate;
    }
  }

  if (hasOwn(next, 'endDate')) {
    const endDate = normalizeDateField(next.endDate);
    if (endDate) {
      next.endDate = endDate;
    } else {
      delete next.endDate;
    }
  }

  if (hasOwn(next, 'startTime')) {
    const startTime = normalizeTimeField(next.startTime);
    if (startTime) {
      next.startTime = startTime;
    } else {
      delete next.startTime;
    }
  }

  if (hasOwn(next, 'endTime')) {
    const endTime = normalizeTimeField(next.endTime);
    if (endTime) {
      next.endTime = endTime;
    } else {
      delete next.endTime;
    }
  }

  if (next.isAllDay === true) {
    delete next.startTime;
    delete next.endTime;
  } else if (hasOwn(next, 'isAllDay') && typeof next.isAllDay !== 'boolean') {
    delete next.isAllDay;
  }

  if (hasOwn(next, 'calendarId')) {
    const parsed =
      typeof next.calendarId === 'number'
        ? next.calendarId
        : Number.parseInt(String(next.calendarId), 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      next.calendarId = parsed;
    } else {
      delete next.calendarId;
    }
  }

  if (hasOwn(next, 'icon')) {
    const icon = normalizeIconField(next.icon);
    if (icon) {
      next.icon = icon;
    } else {
      delete next.icon;
    }
  }

  if (hasOwn(next, 'tags')) {
    next.tags = normalizeLabels(next.tags);
  }

  if (hasOwn(next, 'labels')) {
    next.labels = normalizeLabels(next.labels);
  }

  if (
    next.recurrenceType === undefined ||
    next.recurrenceType === null ||
    next.recurrenceType === 'none'
  ) {
    if (next.recurrenceType === null) {
      delete next.recurrenceType;
    }
    delete next.recurrenceRule;
  } else if (
    typeof next.recurrenceType !== 'string' ||
    !RECURRENCE_TYPES.has(next.recurrenceType)
  ) {
    delete next.recurrenceType;
    delete next.recurrenceRule;
  } else if (hasOwn(next, 'recurrenceRule')) {
    const recurrenceRule = sanitizeRecurrenceRule(next.recurrenceRule);
    if (recurrenceRule) {
      next.recurrenceRule = recurrenceRule;
    } else {
      delete next.recurrenceRule;
    }
  }

  if (hasOwn(next, 'updateMode')) {
    if (
      typeof next.updateMode !== 'string' ||
      !RECURRENCE_UPDATE_MODES.has(next.updateMode)
    ) {
      delete next.updateMode;
    }
  }

  return next;
};

const stripEventLabelFields = <T extends Record<string, unknown>>(payload: T): T => {
  const next = { ...payload };
  delete next.tags;
  delete next.labels;
  return next as T;
};

const stripEventIconField = <T extends Record<string, unknown>>(payload: T): T => {
  const next = { ...payload };
  delete next.icon;
  return next as T;
};

const shouldRetryWithoutLabelFields = (
  error: unknown,
  payload: Record<string, unknown>,
): boolean => {
  if (!(error instanceof HttpError) || error.status !== 400) {
    return false;
  }

  if (!hasOwn(payload, 'tags') && !hasOwn(payload, 'labels')) {
    return false;
  }

  return true;
};

const shouldRetryWithoutIconField = (
  error: unknown,
  payload: Record<string, unknown>,
): boolean => {
  if (!(error instanceof HttpError) || error.status !== 400) {
    return false;
  }

  return hasOwn(payload, 'icon');
};

const extractValidationFieldNames = (error: unknown): string[] => {
  if (!(error instanceof HttpError) || error.status !== 400) {
    return [];
  }
  const parsedFields = new Set<string>();

  if (typeof error.message === 'string' && error.message.length > 0) {
    let match = VALIDATION_FIELD_PATTERN.exec(error.message);
    while (match) {
      const direct = match[1] ?? match[2] ?? '';
      if (direct) {
        parsedFields.add(direct.trim());
      }
      match = VALIDATION_FIELD_PATTERN.exec(error.message);
    }
    VALIDATION_FIELD_PATTERN.lastIndex = 0;
  }

  if (error.details && typeof error.details === 'object') {
    const detailsRecord = error.details as Record<string, unknown>;
    const fields = detailsRecord.fields;
    if (Array.isArray(fields)) {
      for (const entry of fields) {
        if (!entry || typeof entry !== 'object') {
          continue;
        }
        const field = (entry as { field?: unknown }).field;
        if (typeof field === 'string' && field.trim().length > 0) {
          parsedFields.add(field.trim());
        }
      }
    }

    const messages = detailsRecord.message;
    if (Array.isArray(messages)) {
      for (const message of messages) {
        if (typeof message !== 'string') {
          continue;
        }
        let match = VALIDATION_FIELD_PATTERN.exec(message);
        while (match) {
          const direct = match[1] ?? match[2] ?? '';
          if (direct) {
            parsedFields.add(direct.trim());
          }
          match = VALIDATION_FIELD_PATTERN.exec(message);
        }
        VALIDATION_FIELD_PATTERN.lastIndex = 0;
      }
    }
  }

  return Array.from(parsedFields);
};

const prunePayloadFromValidationErrors = (
  payload: Record<string, unknown>,
  error: unknown,
): Record<string, unknown> | null => {
  const invalidFields = extractValidationFieldNames(error);
  if (invalidFields.length === 0) {
    return null;
  }

  const nextPayload = { ...payload };
  let changed = false;

  for (const fieldPath of invalidFields) {
    const topLevelField = fieldPath.split('.')[0];
    if (!hasOwn(nextPayload, topLevelField)) {
      continue;
    }
    if (!FALLBACK_REMOVABLE_EVENT_FIELDS.has(topLevelField)) {
      continue;
    }
    delete nextPayload[topLevelField];
    changed = true;
  }

  return changed ? nextPayload : null;
};

const buildCompatibilityEventPayload = (
  payload: Record<string, unknown>,
): Record<string, unknown> | null => {
  const safeFields = [
    'title',
    'startDate',
    'startTime',
    'endDate',
    'endTime',
    'isAllDay',
    'calendarId',
  ] as const;
  const nextPayload: Record<string, unknown> = {};
  for (const field of safeFields) {
    if (hasOwn(payload, field)) {
      nextPayload[field] = payload[field];
    }
  }

  if (Object.keys(nextPayload).length === 0) {
    return null;
  }

  const normalized = sanitizeEventPayload(nextPayload);
  const unchanged =
    JSON.stringify(normalized) === JSON.stringify(sanitizeEventPayload(payload));
  return unchanged ? null : normalized;
};

const buildLegacyCompatibleUpdatePayload = (
  currentEvent: Event,
  payload: Record<string, unknown>,
): Record<string, unknown> | null => {
  const normalizedCurrentEvent = sanitizeEventPayload({
    title: currentEvent.title,
    startDate: currentEvent.startDate,
    startTime: currentEvent.startTime ?? undefined,
    endDate: currentEvent.endDate ?? currentEvent.startDate,
    endTime: currentEvent.endTime ?? undefined,
    isAllDay: currentEvent.isAllDay,
    calendarId: currentEvent.calendarId ?? currentEvent.calendar?.id,
  });

  const mergedPayload = sanitizeEventPayload({
    ...normalizedCurrentEvent,
    ...payload,
  });
  const unchanged =
    JSON.stringify(mergedPayload) === JSON.stringify(sanitizeEventPayload(payload));
  return unchanged ? null : mergedPayload;
};

const withEventLabelFieldFallback = async <T>(
  request: (payload: Record<string, unknown>) => Promise<T>,
  payload: Record<string, unknown>,
): Promise<T> => {
  const initialPayload =
    eventLabelFieldSupport === 'unsupported'
      ? stripEventLabelFields(payload)
      : payload;

  try {
    const result = await request(initialPayload);
    if (eventLabelFieldSupport !== 'unsupported' && hasOwn(payload, 'tags')) {
      eventLabelFieldSupport = 'supported';
    }
    return result;
  } catch (error) {
    if (!shouldRetryWithoutLabelFields(error, initialPayload)) {
      throw error;
    }

    eventLabelFieldSupport = 'unsupported';
    return request(stripEventLabelFields(payload));
  }
};

const withEventPayloadFallbacks = async <T>(
  request: (payload: Record<string, unknown>) => Promise<T>,
  payload: Record<string, unknown>,
): Promise<T> => {
  let candidatePayload = payload;
  let lastError: unknown = null;
  const triedPayloads = new Set<string>();

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const attemptKey = JSON.stringify(candidatePayload);
    if (triedPayloads.has(attemptKey)) {
      break;
    }
    triedPayloads.add(attemptKey);

    try {
      return await withEventLabelFieldFallback(request, candidatePayload);
    } catch (error) {
      lastError = error;

      const prunedPayload = prunePayloadFromValidationErrors(
        candidatePayload,
        error,
      );
      if (prunedPayload) {
        candidatePayload = prunedPayload;
        continue;
      }

      if (shouldRetryWithoutIconField(error, candidatePayload)) {
        candidatePayload = stripEventIconField(candidatePayload);
        continue;
      }

      const compatibilityPayload = buildCompatibilityEventPayload(
        candidatePayload,
      );
      if (compatibilityPayload) {
        candidatePayload = compatibilityPayload;
        continue;
      }

      throw error;
    }
  }

  throw lastError;
};

export const eventsApi = {
  /** Fetch all events visible to the current user. */
  getEvents: () => http.get<Event[]>('/api/events'),
  /** Create a single event. */
  createEvent: (payload: CreateEventRequest) => {
    const sanitizedPayload = sanitizeEventPayload(asRecord(payload));
    return withEventPayloadFallbacks(
      (nextPayload) => http.post<Event>('/api/events', nextPayload),
      sanitizedPayload,
    );
  },
  /** Create an event with recurrence configuration. */
  createEventWithRecurrence: (payload: CreateEventRequest, recurrence: RecurrencePattern) =>
    apiService.createEventWithRecurrence(payload, recurrence),
  /** Update an existing event by id. */
  updateEvent: (eventId: number, payload: UpdateEventRequest) => {
    const sanitizedPayload = sanitizeEventPayload(asRecord(payload));
    const sendPatch = (nextPayload: Record<string, unknown>) =>
      http.patch<Event>(`/api/events/${eventId}`, nextPayload);

    return withEventPayloadFallbacks(sendPatch, sanitizedPayload).catch(
      async (error) => {
        if (!(error instanceof HttpError) || error.status !== 400) {
          throw error;
        }

        let currentEvent: Event;
        try {
          currentEvent = await http.get<Event>(`/api/events/${eventId}`);
        } catch {
          throw error;
        }

        const legacyPayload = buildLegacyCompatibleUpdatePayload(
          currentEvent,
          sanitizedPayload,
        );
        if (!legacyPayload) {
          throw error;
        }

        return withEventPayloadFallbacks(sendPatch, legacyPayload);
      },
    );
  },
  /** Update one/future/all instances for a recurring event. */
  updateRecurringEvent: (eventId: number, payload: UpdateRecurringEventRequest) =>
    apiService.updateRecurringEvent(eventId, payload),
  /** Delete an event using the selected scope strategy. */
  deleteEvent: (eventId: number, scope: 'this' | 'future' | 'all' = 'this') =>
    http.delete<void>(`/api/events/${eventId}?scope=${scope}`),
  /** Load comments for a specific event. */
  getEventComments: (eventId: number): Promise<EventCommentsResponse> =>
    apiService.getEventComments(eventId),
  /** Add a new comment to an event. */
  addEventComment: (eventId: number, payload: CreateEventCommentRequest): Promise<EventComment> =>
    apiService.addEventComment(eventId, payload),
  /** Reply to an existing event comment thread. */
  replyToEventComment: (
    eventId: number,
    parentCommentId: number,
    payload: CreateEventCommentRequest,
  ): Promise<EventComment> => apiService.replyToEventComment(eventId, parentCommentId, payload),
  /** Edit an existing comment. */
  updateEventComment: (
    eventId: number,
    commentId: number,
    payload: UpdateEventCommentRequest,
  ): Promise<EventComment> => apiService.updateEventComment(eventId, commentId, payload),
  /** Flag or unflag a comment for moderation workflows. */
  flagEventComment: (
    eventId: number,
    commentId: number,
    isFlagged: boolean,
  ): Promise<EventComment> => apiService.flagEventComment(eventId, commentId, isFlagged),
  /** Emit an event-open tracking marker for audit/history UI. */
  trackEventOpen: (eventId: number, note?: string): Promise<EventComment | null> =>
    apiService.trackEventOpen(eventId, note),
} as const;
