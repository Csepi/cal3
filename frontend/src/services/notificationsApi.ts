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
  getNotifications: (params?: { unreadOnly?: boolean; archived?: boolean }): Promise<NotificationMessage[]> =>
    http.get<NotificationMessage[]>(`/api/notifications${params ? `?${new URLSearchParams({
      ...(params.unreadOnly !== undefined ? { unreadOnly: String(params.unreadOnly) } : {}),
      ...(params.archived !== undefined ? { archived: String(params.archived) } : {}),
    }).toString()}` : ''}`),
  markAsRead: (id: number): Promise<void> => http.patch<void>(`/api/notifications/${id}/read`),
  markAsUnread: (id: number): Promise<void> => apiService.markNotificationUnread(id),
  markAllRead: (): Promise<void> => apiService.markAllNotificationsRead(),
  getThreads: (): Promise<NotificationThreadSummary[]> => apiService.getNotificationThreads(),
  toggleThreadMute: (id: number, mute: boolean): Promise<void> => apiService.toggleThreadMute(id, mute),
  toggleThreadArchive: (id: number, archive: boolean): Promise<void> => apiService.toggleThreadArchive(id, archive),
  getPreferences: (): Promise<NotificationPreference[]> => apiService.getNotificationPreferences(),
  savePreferences: (preferences: NotificationPreference[]): Promise<NotificationPreference[]> =>
    apiService.updateNotificationPreferences(preferences),
  getFilters: (): Promise<NotificationFilter[]> => apiService.getNotificationFilters(),
  saveFilter: (filter: NotificationFilter): Promise<NotificationFilter> => apiService.saveNotificationFilter(filter),
  deleteFilter: (filterId: number): Promise<void> => apiService.deleteNotificationFilter(filterId),
  getCatalog: (): Promise<NotificationCatalog> => apiService.getNotificationCatalog(),
  getScopeOptions: (scopeType: string): Promise<NotificationScopeOption[]> =>
    apiService.getNotificationScopeOptions(scopeType).then((result) => {
      if (Array.isArray(result)) {
        return result as NotificationScopeOption[];
      }
      return result[scopeType] ?? [];
    }),
  getScopeMutes: (): Promise<NotificationScopeMute[]> => apiService.getNotificationScopeMutes(),
  setScopeMute: (scopeType: string, scopeId: string, isMuted: boolean): Promise<NotificationScopeMute | null> =>
    apiService.setNotificationScopeMute(scopeType, scopeId, isMuted),
  removeScopeMute: (scopeType: string, scopeId: string): Promise<void> =>
    apiService.removeNotificationScopeMute(scopeType, scopeId),
  getChannelsEnabled: (): Promise<Record<NotificationChannel, boolean>> =>
    apiService.getNotificationChannelsEnabled(),
  getAdminConfig: (): Promise<unknown> => apiService.getAdminNotificationConfig(),
  updateAdminConfig: (key: string, value: string | boolean | null): Promise<unknown> =>
    apiService.updateAdminNotificationConfig(key, value),
} as const;

