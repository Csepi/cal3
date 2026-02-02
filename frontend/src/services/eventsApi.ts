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
  getEvents: () => http.get<Event[]>('/api/events'),
  createEvent: (payload: CreateEventRequest) => http.post<Event>('/api/events', payload),
  createEventWithRecurrence: (payload: CreateEventRequest, recurrence: RecurrencePattern) =>
    apiService.createEventWithRecurrence(payload, recurrence),
  updateEvent: (eventId: number, payload: UpdateEventRequest) =>
    http.patch<Event>(`/api/events/${eventId}`, payload),
  updateRecurringEvent: (eventId: number, payload: UpdateRecurringEventRequest) =>
    apiService.updateRecurringEvent(eventId, payload),
  deleteEvent: (eventId: number, scope: 'this' | 'future' | 'all' = 'this') =>
    http.delete<void>(`/api/events/${eventId}?scope=${scope}`),
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
    isFlagged: boolean,
  ): Promise<EventComment> => apiService.flagEventComment(eventId, commentId, isFlagged),
  trackEventOpen: (eventId: number, note?: string): Promise<EventComment | null> =>
    apiService.trackEventOpen(eventId, note),
} as const;
