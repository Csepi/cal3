import { apiService } from './api';
import { http } from '../lib/http';
import type {
  NotificationMessage,
  NotificationThreadSummary,
  NotificationPreference,
  NotificationFilter,
  NotificationCatalog,
  NotificationScopeMute,
  NotificationChannel,
  NotificationScopeOption,
} from '../types/Notification';

export const notificationsApi = {
  /** List user notifications with optional filters. */
  getNotifications: (params?: { unreadOnly?: boolean; archived?: boolean }): Promise<NotificationMessage[]> =>
    http.get<NotificationMessage[]>(`/api/notifications${params ? `?${new URLSearchParams({
      ...(params.unreadOnly !== undefined ? { unreadOnly: String(params.unreadOnly) } : {}),
      ...(params.archived !== undefined ? { archived: String(params.archived) } : {}),
    }).toString()}` : ''}`),
  /** Mark one notification as read. */
  markAsRead: (id: number): Promise<void> => http.patch<void>(`/api/notifications/${id}/read`),
  /** Mark one notification as unread. */
  markAsUnread: (id: number): Promise<void> => apiService.markNotificationUnread(id),
  /** Mark all notifications as read. */
  markAllRead: (): Promise<void> => apiService.markAllNotificationsRead(),
  /** Fetch conversation-style notification threads. */
  getThreads: (): Promise<NotificationThreadSummary[]> => apiService.getNotificationThreads(),
  /** Toggle mute state for a thread. */
  toggleThreadMute: (id: number, mute: boolean): Promise<void> => apiService.toggleThreadMute(id, mute),
  /** Toggle archive state for a thread. */
  toggleThreadArchive: (id: number, archive: boolean): Promise<void> => apiService.toggleThreadArchive(id, archive),
  /** Retrieve per-event notification preferences. */
  getPreferences: (): Promise<NotificationPreference[]> => apiService.getNotificationPreferences(),
  /** Persist per-event notification preferences. */
  savePreferences: (preferences: NotificationPreference[]): Promise<NotificationPreference[]> =>
    apiService.updateNotificationPreferences(preferences),
  /** List inbox rule filters. */
  getFilters: (): Promise<NotificationFilter[]> => apiService.getNotificationFilters(),
  /** Create or update a notification filter rule. */
  saveFilter: (filter: NotificationFilter): Promise<NotificationFilter> => apiService.saveNotificationFilter(filter),
  /** Delete a notification filter rule. */
  deleteFilter: (filterId: number): Promise<void> => apiService.deleteNotificationFilter(filterId),
  /** Get event/channel/scope catalog for notifications UI. */
  getCatalog: (): Promise<NotificationCatalog> => apiService.getNotificationCatalog(),
  /** Resolve available scope values for rule creation forms. */
  getScopeOptions: (scopeType: string): Promise<NotificationScopeOption[]> =>
    apiService.getNotificationScopeOptions(scopeType).then((result) => {
      if (Array.isArray(result)) {
        return result as NotificationScopeOption[];
      }
      return result[scopeType] ?? [];
    }),
  /** List current scope mute entries. */
  getScopeMutes: (): Promise<NotificationScopeMute[]> => apiService.getNotificationScopeMutes(),
  /** Upsert scope mute state. */
  setScopeMute: (scopeType: string, scopeId: string, isMuted: boolean): Promise<NotificationScopeMute | null> =>
    apiService.setNotificationScopeMute(scopeType, scopeId, isMuted),
  /** Delete a scope mute entry. */
  removeScopeMute: (scopeType: string, scopeId: string): Promise<void> =>
    apiService.removeNotificationScopeMute(scopeType, scopeId),
  /** Get enabled/disabled channel map for the current account. */
  getChannelsEnabled: (): Promise<Record<NotificationChannel, boolean>> =>
    apiService.getNotificationChannelsEnabled(),
  /** Read admin-level notification configuration. */
  getAdminConfig: (): Promise<unknown> => apiService.getAdminNotificationConfig(),
  /** Update one admin notification config key. */
  updateAdminConfig: (key: string, value: string | boolean | null): Promise<unknown> =>
    apiService.updateAdminNotificationConfig(key, value),
} as const;

