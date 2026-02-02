// @ts-nocheck
import { useCallback, useMemo, useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import type {
  NotificationMessage,
  NotificationThreadSummary,
} from '../../types/Notification';

const formatTimestamp = (iso: string): string => {
  try {
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) {
      return iso;
    }
    return dt.toLocaleString();
  } catch {
    return iso;
  }
};

const groupNotifications = (notifications: NotificationMessage[]) => {
  const groups: Record<string, NotificationMessage[]> = {};
  notifications.forEach((notification) => {
    const created = new Date(notification.createdAt);
    const key = created.toDateString();
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(notification);
  });
  return Object.entries(groups)
    .map(([date, items]) => ({
      date,
      items: items.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1)),
    }))
    .sort((a, b) => (new Date(a.date) > new Date(b.date) ? -1 : 1));
};

const buildThreadLabel = (thread: NotificationThreadSummary): string => {
  if (thread.contextType && thread.contextId) {
    const label = thread.contextType.replace(/_/g, ' ');
    return `${label.charAt(0).toUpperCase()}${label.slice(1)} ${thread.contextId}`;
  }
  if (thread.threadKey) {
    return thread.threadKey;
  }
  return `Thread #${thread.id}`;
};

interface NotificationCenterProps {
  onOpenSettings: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onOpenSettings }) => {
  const {
    notifications,
    threads,
    scopeMutes,
    unreadCount,
    loading,
    markRead,
    markUnread,
    markAllRead,
    refreshNotifications,
    refreshThreads,
    toggleThreadMute,
    toggleThreadArchive,
    setScopeMute,
  } = useNotifications();

  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);

  const threadMap = useMemo(() => {
    const map = new Map<number, NotificationThreadSummary>();
    threads.forEach((thread) => map.set(thread.id, thread));
    return map;
  }, [threads]);

  const sortedThreads = useMemo(
    () =>
      threads
        .slice()
        .sort((a, b) => {
          const aDate = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const bDate = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return bDate - aDate;
        }),
    [threads],
  );

  const isScopeMuted = useCallback(
    (scopeType: string, scopeId: string | number) =>
      scopeMutes.some(
        (mute) => mute.scopeType === scopeType && mute.scopeId === String(scopeId),
      ),
    [scopeMutes],
  );

  const filteredNotifications = useMemo(
    () =>
      notifications
        .filter((notification) => (showUnreadOnly ? !notification.isRead : true))
        .filter((notification) =>
          searchTerm.trim().length === 0
            ? true
            : (notification.title ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
              notification.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
              notification.eventType.toLowerCase().includes(searchTerm.toLowerCase()),
        )
        .filter((notification) =>
          selectedThreadId ? notification.threadId === selectedThreadId : true,
        ),
    [notifications, showUnreadOnly, searchTerm, selectedThreadId],
  );

  const groupedNotifications = useMemo(
    () => groupNotifications(filteredNotifications),
    [filteredNotifications],
  );

  const handleRefresh = useCallback(async () => {
    await Promise.all([refreshNotifications(), refreshThreads()]);
  }, [refreshNotifications, refreshThreads]);

  const handleScopeMuteToggle = useCallback(
    async (scopeType: string, scopeId: string | number, shouldMute: boolean) => {
      await setScopeMute(scopeType, String(scopeId), shouldMute);
    },
    [setScopeMute],
  );

  const deriveScopeOptions = useCallback(
    (notification: NotificationMessage) => {
      const options: Array<{ key: string; type: string; id: string | number; label: string }> = [];
      const seen = new Set<string>();
      const append = (type: string, id?: string | number | null) => {
        if (id === null || id === undefined) {
          return;
        }
        const normalized = String(id);
        if (!normalized) {
          return;
        }
        const key = `${type}:${normalized}`;
        if (seen.has(key)) {
          return;
        }
        seen.add(key);
        const label = `${type.charAt(0).toUpperCase()}${type.slice(1)} ${normalized}`;
        options.push({ key, type, id: normalized, label });
      };

      append('calendar', notification.data?.calendarId);
      append('reservation', notification.data?.reservationId);
      append('organisation', notification.data?.organisationId);
      append('resource', notification.data?.resourceId);

      const thread = notification.threadId ? threadMap.get(notification.threadId) : undefined;
      if (thread?.threadKey) {
        append('thread', thread.threadKey);
      }
      if (thread?.contextType) {
        append(thread.contextType, thread.contextId);
      }

      return options;
    },
    [threadMap],
  );

  const renderNotificationActions = (notification: NotificationMessage) => {
    const thread = notification.threadId ? threadMap.get(notification.threadId) : undefined;
    const threadMuted = thread?.isMuted ?? false;
    const threadArchived = thread?.isArchived ?? false;
    const scopeOptions = deriveScopeOptions(notification).filter((option) =>
      ['calendar', 'reservation', 'organisation', 'resource', 'thread'].includes(option.type),
    );

    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {notification.isRead ? (
          <button
            type="button"
            onClick={() => markUnread(notification.id)}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
          >
            Mark as unread
          </button>
        ) : (
          <button
            type="button"
            onClick={() => markRead(notification.id)}
            className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Mark as read
          </button>
        )}

        {thread && (
          <>
            <button
              type="button"
              onClick={() => toggleThreadMute(thread.id, !threadMuted)}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
            >
              {threadMuted ? 'Unmute thread' : 'Mute thread'}
            </button>
            <button
              type="button"
              onClick={() => toggleThreadArchive(thread.id, !threadArchived)}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
            >
              {threadArchived ? 'Restore thread' : 'Archive thread'}
            </button>
          </>
        )}

        {scopeOptions.map((option) => {
          const muted = isScopeMuted(option.type, option.id);
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => handleScopeMuteToggle(option.type, option.id, !muted)}
              className={`px-3 py-1.5 text-sm rounded-lg border ${
                muted
                  ? 'border-green-400 text-green-600 hover:bg-green-50'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {muted ? `Unmute ${option.label}` : `Mute ${option.label}`}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Notification Center</h1>
          <p className="text-sm text-gray-500">
            Stay on top of updates across calendars, reservations, organisations, and automation.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onOpenSettings}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Settings
          </button>
          <button
            type="button"
            onClick={async () => {
              await markAllRead();
              await refreshThreads();
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={unreadCount === 0}
          >
            Mark all read
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={showUnreadOnly}
              onChange={(event) => setShowUnreadOnly(event.target.checked)}
            />
            Show unread only ({unreadCount})
          </label>
          <button
            type="button"
            className="text-sm text-blue-600 hover:text-blue-700"
            onClick={handleRefresh}
          >
            Refresh
          </button>
        </div>
        <div className="md:w-80">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search notifications"
            className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Conversations
            </h2>
            <p className="text-xs text-gray-500">
              Threads group related notifications. Mute or archive them to keep focus.
            </p>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => setSelectedThreadId(null)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setSelectedThreadId(null);
              }
            }}
            className={`rounded-2xl border px-4 py-3 transition ${
              selectedThreadId === null
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">All notifications</span>
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                {unreadCount}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              View everything across calendars, reservations, organisations, and more.
            </p>
          </div>

          <div className="space-y-3">
            {sortedThreads.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-6 text-center text-xs text-gray-500">
                Threads appear automatically as new activity arrives.
              </div>
            ) : (
              sortedThreads.map((thread) => {
                const scopedMute =
                  thread.contextType && thread.contextId
                    ? isScopeMuted(thread.contextType, thread.contextId)
                    : false;
                return (
                  <div
                    key={thread.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedThreadId(thread.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedThreadId(thread.id);
                      }
                    }}
                    className={`rounded-2xl border px-4 py-3 transition ${
                      selectedThreadId === thread.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{buildThreadLabel(thread)}</p>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                          {thread.contextType && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5">
                              {thread.contextType}
                            </span>
                          )}
                          {thread.isMuted && (
                            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-yellow-700">
                              Thread muted
                            </span>
                          )}
                          {thread.isArchived && (
                            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-purple-700">
                              Archived
                            </span>
                          )}
                          {scopedMute && (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700">
                              Scope muted
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`mt-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        (thread.unreadCount ?? 0) > 0
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {thread.unreadCount ?? 0}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleThreadMute(thread.id, !thread.isMuted);
                        }}
                        className="rounded-lg border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-100"
                      >
                        {thread.isMuted ? 'Unmute' : 'Mute'}
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleThreadArchive(thread.id, !thread.isArchived);
                        }}
                        className="rounded-lg border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-100"
                      >
                        {thread.isArchived ? 'Restore' : 'Archive'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        <section>
          {loading ? (
            <div className="py-24 text-center text-gray-500">Loading notifications...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-24 text-center text-gray-500">
              {selectedThreadId
                ? 'No notifications found for this conversation.'
                : 'No notifications to display.'}
            </div>
          ) : (
            <div className="space-y-6">
              {groupedNotifications.map(({ date, items }) => (
                <section key={date}>
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    {date}
                  </h2>
                  <div className="space-y-2">
                    {items.map((notification) => {
                      const evaluationMeta = notification.metadata?.evaluation ?? {};
                      return (
                        <article
                          key={notification.id}
                          className={`border rounded-xl p-4 transition ${
                            notification.isRead
                              ? 'bg-white border-gray-200'
                              : 'bg-blue-50 border-blue-200 shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-xs uppercase tracking-wide text-gray-500">
                                  {notification.eventType}
                                </p>
                                {evaluationMeta.scopeMuted && (
                                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700">
                                    Scope muted
                                  </span>
                                )}
                                {evaluationMeta.notes && Array.isArray(evaluationMeta.notes) && evaluationMeta.notes.length > 0 && (
                                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                                    {evaluationMeta.notes.join(', ')}
                                  </span>
                                )}
                              </div>
                              <h3 className="mt-1 text-lg font-medium text-gray-900">
                                {notification.title ?? 'Notification'}
                              </h3>
                            </div>
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {formatTimestamp(notification.createdAt)}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">
                            {notification.body}
                          </p>

                          {notification.data && Object.keys(notification.data).length > 0 && (
                            <details className="mt-3 bg-white/70 rounded-lg border border-dashed border-gray-300 p-3 text-xs text-gray-600">
                              <summary className="cursor-pointer font-medium text-gray-500">
                                Details
                              </summary>
                              <pre className="mt-2 whitespace-pre-wrap break-words">
                                {JSON.stringify(notification.data, null, 2)}
                              </pre>
                            </details>
                          )}

                          {renderNotificationActions(notification)}
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default NotificationCenter;

