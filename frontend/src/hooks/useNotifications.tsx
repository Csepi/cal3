import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { BASE_URL } from '../config/apiConfig';
import { apiService } from '../services/api';
import { sessionManager } from '../services/sessionManager';
import type {
  NotificationMessage,
  NotificationThreadSummary,
  NotificationPreference,
  NotificationFilter,
  NotificationCatalog,
  NotificationScopeMute,
} from '../types/Notification';

interface NotificationsContextValue {
  notifications: NotificationMessage[];
  threads: NotificationThreadSummary[];
  preferences: NotificationPreference[];
  filters: NotificationFilter[];
  catalog: NotificationCatalog | null;
  scopeMutes: NotificationScopeMute[];
  unreadCount: number;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  refreshThreads: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markUnread: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  toggleThreadMute: (id: number, mute: boolean) => Promise<void>;
  toggleThreadArchive: (id: number, archive: boolean) => Promise<void>;
  refreshPreferences: () => Promise<void>;
  savePreferences: (preferences: NotificationPreference[]) => Promise<void>;
  refreshFilters: () => Promise<void>;
  saveFilter: (filter: NotificationFilter) => Promise<NotificationFilter>;
  deleteFilter: (filterId: number) => Promise<void>;
  refreshCatalog: () => Promise<void>;
  refreshScopeMutes: () => Promise<void>;
  setScopeMute: (scopeType: string, scopeId: string, isMuted: boolean) => Promise<void>;
  removeScopeMute: (scopeType: string, scopeId: string) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const buildSocketUrl = (): string => {
  try {
    const base = new URL(BASE_URL);
    base.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
    base.pathname = base.pathname.replace(/\/$/, '') + '/ws/notifications';
    return base.toString();
  } catch (error) {
    console.warn('Failed to build notifications websocket URL, falling back to relative path.', error);
    return '/ws/notifications';
  }
};

const SOCKET_IO_PATH = '/socket.io';

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [threads, setThreads] = useState<NotificationThreadSummary[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [filters, setFilters] = useState<NotificationFilter[]>([]);
  const [catalog, setCatalog] = useState<NotificationCatalog | null>(null);
  const [scopeMutes, setScopeMutes] = useState<NotificationScopeMute[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  const computeUnread = useCallback((list: NotificationMessage[]) => {
    return list.filter((notification) => !notification.isRead && !notification.archived).length;
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const list = await apiService.getNotifications({ unreadOnly: false, archived: false });
      setNotifications(list);
      setUnreadCount(computeUnread(list));
    } catch (error) {
      console.warn('Failed to refresh notifications', error);
    }
  }, [computeUnread]);

  const refreshThreads = useCallback(async () => {
    try {
      const data = await apiService.getNotificationThreads();
      setThreads(data);
    } catch (error) {
      console.warn('Failed to refresh notification threads', error);
    }
  }, []);

  const refreshPreferences = useCallback(async () => {
    try {
      const prefs = await apiService.getNotificationPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.warn('Failed to load notification preferences', error);
    }
  }, []);

  const refreshFilters = useCallback(async () => {
    try {
      const data = await apiService.getNotificationFilters();
      setFilters(data);
    } catch (error) {
      console.warn('Failed to load notification filters', error);
    }
  }, []);

  const refreshCatalog = useCallback(async () => {
    try {
      const data = await apiService.getNotificationCatalog();
      setCatalog(data);
    } catch (error) {
      console.warn('Failed to load notification catalog', error);
    }
  }, []);

  const refreshScopeMutes = useCallback(async () => {
    try {
      const mutes = await apiService.getNotificationScopeMutes();
      setScopeMutes(mutes);
    } catch (error) {
      console.warn('Failed to load notification scope mutes', error);
    }
  }, []);

  const markRead = useCallback(async (id: number) => {
    await apiService.markNotificationRead(id);
    setNotifications((prev) => prev.map((notification) =>
      notification.id === id ? { ...notification, isRead: true } : notification,
    ));
    setUnreadCount((count) => Math.max(0, count - 1));
  }, []);

  const markUnread = useCallback(async (id: number) => {
    await apiService.markNotificationUnread(id);
    setNotifications((prev) => prev.map((notification) =>
      notification.id === id ? { ...notification, isRead: false } : notification,
    ));
    setUnreadCount((count) => count + 1);
  }, []);

  const markAllRead = useCallback(async () => {
    await apiService.markAllNotificationsRead();
    setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
    setUnreadCount(0);
  }, []);

  const toggleThreadMute = useCallback(async (id: number, mute: boolean) => {
    await apiService.toggleThreadMute(id, mute);
    setThreads((prev) => prev.map((thread) =>
      thread.id === id ? { ...thread, isMuted: mute } : thread,
    ));
  }, []);

  const toggleThreadArchive = useCallback(async (id: number, archive: boolean) => {
    await apiService.toggleThreadArchive(id, archive);
    setThreads((prev) => prev.map((thread) =>
      thread.id === id ? { ...thread, isArchived: archive } : thread,
    ));
  }, []);

  const removeScopeMute = useCallback(async (scopeType: string, scopeId: string) => {
    await apiService.removeNotificationScopeMute(scopeType, scopeId);
    setScopeMutes((prev) =>
      prev.filter(
        (mute) => !(mute.scopeType === scopeType && mute.scopeId === String(scopeId)),
      ),
    );
  }, []);

  const setScopeMute = useCallback(
    async (scopeType: string, scopeId: string, isMuted: boolean) => {
      const identifier = String(scopeId);
      if (isMuted) {
        const mute = await apiService.setNotificationScopeMute(scopeType, identifier, true);
        setScopeMutes((prev) => {
          const filtered = prev.filter(
            (item) => !(item.scopeType === scopeType && item.scopeId === identifier),
          );
          return mute ? [...filtered, mute] : filtered;
        });
        return;
      }

      await removeScopeMute(scopeType, identifier);
    },
    [removeScopeMute],
  );

  const savePreferences = useCallback(async (updated: NotificationPreference[]) => {
    const saved = await apiService.updateNotificationPreferences(updated);
    setPreferences(saved);
  }, []);

  const saveFilter = useCallback(async (filter: NotificationFilter) => {
    const saved = await apiService.saveNotificationFilter(filter);
    setFilters((prev) => {
      const without = prev.filter((item) => item.id !== saved.id);
      return [...without, saved].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    });
    return saved;
  }, []);

  const deleteFilter = useCallback(async (filterId: number) => {
    await apiService.deleteNotificationFilter(filterId);
    setFilters((prev) => prev.filter((rule) => rule.id !== filterId));
  }, []);

  const connectSocket = useCallback(() => {
    if (socketRef.current || !apiService.isAuthenticated()) {
      return;
    }

    const establishConnection = async () => {
      const token = await sessionManager.getAccessToken();
      if (!token) {
        return;
      }

      const socketNamespaceUrl = buildSocketUrl();
      const socket = io(socketNamespaceUrl, {
        transports: ['websocket'],
        path: SOCKET_IO_PATH,
        auth: { token },
      });

      socket.on('connect', () => {
        socket.emit('ping', { ts: Date.now() });
      });

      socket.on('notification:new', () => refreshNotifications());
      socket.on('notification:unreadCount', (payload: { count: number }) => {
        if (typeof payload?.count === 'number') {
          setUnreadCount(payload.count);
        }
      });
      socket.on('thread:state', () => refreshThreads());

      socket.on('disconnect', () => {
        socketRef.current = null;
      });

      socketRef.current = socket;
    };

    void establishConnection();
  }, [refreshNotifications, refreshThreads]);

  useEffect(() => {
    let cancelled = false;
    const initialise = async () => {
      if (!apiService.isAuthenticated()) {
        setLoading(false);
        return;
      }

      setLoading(true);
      await Promise.all([
        refreshNotifications(),
        refreshThreads(),
        refreshPreferences(),
        refreshFilters(),
        refreshCatalog(),
        refreshScopeMutes(),
      ]);
      if (!cancelled) {
        setLoading(false);
      }
      connectSocket();
    };

    initialise();

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [
    refreshNotifications,
    refreshThreads,
    refreshPreferences,
    refreshFilters,
    refreshCatalog,
    refreshScopeMutes,
    connectSocket,
  ]);

  const contextValue = useMemo<NotificationsContextValue>(() => ({
    notifications,
    threads,
    preferences,
    filters,
    catalog,
    scopeMutes,
    unreadCount,
    loading,
    refreshNotifications,
    refreshThreads,
    markRead,
    markUnread,
    markAllRead,
    toggleThreadMute,
    toggleThreadArchive,
    refreshPreferences,
    savePreferences,
    refreshFilters,
    saveFilter,
    deleteFilter,
    refreshCatalog,
    refreshScopeMutes,
    setScopeMute,
    removeScopeMute,
  }), [
    notifications,
    threads,
    preferences,
    filters,
    catalog,
    scopeMutes,
    unreadCount,
    loading,
    refreshNotifications,
    refreshThreads,
    markRead,
    markUnread,
    markAllRead,
    toggleThreadMute,
    toggleThreadArchive,
    refreshPreferences,
    savePreferences,
    refreshFilters,
    saveFilter,
    deleteFilter,
    refreshCatalog,
    refreshScopeMutes,
    setScopeMute,
    removeScopeMute,
  ]);

  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = (): NotificationsContextValue => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
