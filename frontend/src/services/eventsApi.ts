import { apiService } from './api';
import { http } from '../lib/http';
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

export const eventsApi = {
  /** Fetch all events visible to the current user. */
  getEvents: () => http.get<Event[]>('/api/events'),
  /** Create a single event. */
  createEvent: (payload: CreateEventRequest) => http.post<Event>('/api/events', payload),
  /** Create an event with recurrence configuration. */
  createEventWithRecurrence: (payload: CreateEventRequest, recurrence: RecurrencePattern) =>
    apiService.createEventWithRecurrence(payload, recurrence),
  /** Update an existing event by id. */
  updateEvent: (eventId: number, payload: UpdateEventRequest) =>
    http.patch<Event>(`/api/events/${eventId}`, payload),
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
