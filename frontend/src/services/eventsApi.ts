import { apiService } from './api';
import type {
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

export const eventsApi = {
  getEvents: () => apiService.getAllEvents(),
  createEvent: (payload: CreateEventRequest) => apiService.createEvent(payload),
  createEventWithRecurrence: (payload: CreateEventRequest, recurrence: RecurrencePattern) =>
    apiService.createEventWithRecurrence(payload, recurrence),
  updateEvent: (eventId: number, payload: UpdateEventRequest) =>
    apiService.updateEvent(eventId, payload),
  updateRecurringEvent: (eventId: number, payload: UpdateRecurringEventRequest) =>
    apiService.updateRecurringEvent(eventId, payload),
  deleteEvent: (eventId: number, scope: 'this' | 'future' | 'all' = 'this') =>
    apiService.deleteEvent(eventId, scope),
  getEventComments: (eventId: number): Promise<EventCommentsResponse> =>
    apiService.getEventComments(eventId),
  addEventComment: (eventId: number, payload: CreateEventCommentRequest): Promise<EventComment> =>
    apiService.addEventComment(eventId, payload),
  replyToEventComment: (
    eventId: number,
    parentCommentId: number,
    payload: CreateEventCommentRequest,
  ): Promise<EventComment> => apiService.replyToEventComment(eventId, parentCommentId, payload),
  updateEventComment: (
    eventId: number,
    commentId: number,
    payload: UpdateEventCommentRequest,
  ): Promise<EventComment> => apiService.updateEventComment(eventId, commentId, payload),
  flagEventComment: (
    eventId: number,
    commentId: number,
    payload: { reason: string; note?: string },
  ): Promise<EventComment> => apiService.flagEventComment(eventId, commentId, payload),
  trackEventOpen: (eventId: number, note?: string): Promise<EventComment | null> =>
    apiService.trackEventOpen(eventId, note),
} as const;
