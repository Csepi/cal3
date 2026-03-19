import { useMemo } from 'react';
import type { ReactNode } from 'react';

import { useAuth } from '../../hooks/useAuth';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import { useNotifications } from '../../hooks/useNotifications';
import { usePermissions } from '../../hooks/usePermissions';
import { useAppTranslation } from '../../i18n/useAppTranslation';
import type { TabId } from '../mobile/organisms/BottomTabBar';

export type NavigationIntent = 'default' | 'groups' | 'settings';

export interface NavigationItem {
  key: string;
  tabId: TabId;
  label: string;
  shortLabel?: string;
  icon: ReactNode;
  badge?: number;
  intent?: NavigationIntent;
}

interface UseNavigationOptions {
  activeTab: TabId;
  hideReservationsTab?: boolean;
}

const iconClassName = 'h-4 w-4';

const CalendarIcon = (
  <svg viewBox="0 0 24 24" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M8 3v4M16 3v4M3.5 11h17" />
  </svg>
);
const TasksIcon = (
  <svg viewBox="0 0 24 24" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 7h16M4 12h16M4 17h10" />
    <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
    <circle cx="17" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="7" cy="17" r="1" fill="currentColor" stroke="none" />
  </svg>
);
const GroupsIcon = (
  <svg viewBox="0 0 24 24" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="4" width="8" height="6" rx="1.5" />
    <rect x="13" y="4" width="8" height="6" rx="1.5" />
    <rect x="3" y="14" width="8" height="6" rx="1.5" />
    <rect x="13" y="14" width="8" height="6" rx="1.5" />
  </svg>
);
const BellIcon = (
  <svg viewBox="0 0 24 24" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 13.8V11a6 6 0 0 0-12 0v2.8a2 2 0 0 1-.6 1.4L4 17h5" />
    <path d="M9 21a3 3 0 0 0 6 0" />
  </svg>
);
const ProfileIcon = (
  <svg viewBox="0 0 24 24" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
  </svg>
);
const SettingsIcon = (
  <svg viewBox="0 0 24 24" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H10a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V10a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);
const SyncIcon = (
  <svg viewBox="0 0 24 24" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 12A9 9 0 0 0 6 5.3V3L3 6l3 3V7.2A7 7 0 1 1 12 19a6.8 6.8 0 0 1-4.8-2" />
    <path d="M3 12h5" />
  </svg>
);
const AutomationIcon = (
  <svg viewBox="0 0 24 24" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H10a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V10a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);
const LogsIcon = (
  <svg viewBox="0 0 24 24" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M6 3h9l4 4v14H6z" />
    <path d="M15 3v4h4" />
    <path d="M9 12h6M9 16h6M9 8h3" />
  </svg>
);
const AdminIcon = (
  <svg viewBox="0 0 24 24" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 3 4 7v6c0 4 2.6 6.8 8 8 5.4-1.2 8-4 8-8V7z" />
    <path d="M9.5 12.5 11 14l3.5-3.5" />
  </svg>
);

const breadcrumbLabel = (tabId: TabId, t: ReturnType<typeof useAppTranslation>['t']): string => {
  switch (tabId) {
    case 'calendar':
      return t('navigation.calendar');
    case 'tasks':
      return t('navigation.tasks', { defaultValue: 'Tasks' });
    case 'notifications':
      return t('navigation.notifications', { defaultValue: 'Notifications' });
    case 'profile':
      return t('navigation.profile');
    case 'personal-logs':
      return t('navigation.personalLogs', { defaultValue: 'Personal Logs' });
    case 'sync':
      return t('navigation.sync');
    case 'automation':
      return t('navigation.automation');
    case 'agent':
      return t('navigation.agentSettings', { defaultValue: 'Agent settings' });
    case 'reservations':
      return t('navigation.reservations');
    case 'admin':
      return t('navigation.admin');
    default:
      return t('navigation.calendar');
  }
};

const sortByRank = (items: NavigationItem[]): NavigationItem[] => {
  const rank: Record<string, number> = {
    calendar: 0,
    groups: 1,
    tasks: 2,
    notifications: 3,
    settings: 4,
    profile: 5,
    'personal-logs': 6,
    reservations: 7,
    automation: 8,
    agent: 9,
    sync: 10,
    admin: 11,
  };

  return [...items].sort((left, right) => (rank[left.key] ?? 99) - (rank[right.key] ?? 99));
};

export const useNavigation = ({ activeTab, hideReservationsTab = false }: UseNavigationOptions) => {
  const { t } = useAppTranslation('common');
  const { flags } = useFeatureFlags();
  const { unreadCount } = useNotifications();
  const { canAccessReservations } = usePermissions();
  const { currentUser } = useAuth();

  const userRole = currentUser?.role ?? 'user';

  const baseItems = useMemo<NavigationItem[]>(() => {
    const items: NavigationItem[] = [
      {
        key: 'calendar',
        tabId: 'calendar',
        label: t('navigation.calendar'),
        icon: CalendarIcon,
      },
      {
        key: 'groups',
        tabId: 'calendar',
        label: t('navigation.groups', { defaultValue: 'Groups' }),
        icon: GroupsIcon,
        intent: 'groups',
      },
      {
        key: 'tasks',
        tabId: 'tasks',
        label: t('navigation.tasks', { defaultValue: 'Tasks' }),
        icon: TasksIcon,
      },
      {
        key: 'notifications',
        tabId: 'notifications',
        label: t('navigation.notifications', { defaultValue: 'Notifications' }),
        shortLabel: t('navigation.notificationsShort', { defaultValue: 'Alerts' }),
        icon: BellIcon,
        badge: unreadCount ?? 0,
      },
      {
        key: 'settings',
        tabId: 'notifications',
        label: t('navigation.settings', { defaultValue: 'Settings' }),
        icon: SettingsIcon,
        intent: 'settings',
      },
      {
        key: 'profile',
        tabId: 'profile',
        label: t('navigation.profile'),
        icon: ProfileIcon,
      },
      {
        key: 'personal-logs',
        tabId: 'personal-logs',
        label: t('navigation.personalLogs', { defaultValue: 'Personal Logs' }),
        shortLabel: t('navigation.logsShort', { defaultValue: 'Logs' }),
        icon: LogsIcon,
      },
    ];

    if (flags.reservations && canAccessReservations && !hideReservationsTab) {
      items.push({
        key: 'reservations',
        tabId: 'reservations',
        label: t('navigation.reservations'),
        shortLabel: t('navigation.reservationsShort'),
        icon: GroupsIcon,
      });
    }

    if (flags.automation) {
      items.push({
        key: 'automation',
        tabId: 'automation',
        label: t('navigation.automation'),
        shortLabel: t('navigation.automationShort'),
        icon: AutomationIcon,
      });
    }

    if (flags.agents) {
      items.push({
        key: 'agent',
        tabId: 'agent',
        label: t('navigation.agentSettings', { defaultValue: 'Agent settings' }),
        shortLabel: t('navigation.agentsShort', { defaultValue: 'Agents' }),
        icon: AdminIcon,
      });
    }

    if (flags.calendarSync) {
      items.push({
        key: 'sync',
        tabId: 'sync',
        label: t('navigation.sync'),
        shortLabel: t('navigation.syncShort'),
        icon: SyncIcon,
      });
    }

    if (userRole === 'admin') {
      items.push({
        key: 'admin',
        tabId: 'admin',
        label: t('navigation.admin'),
        shortLabel: t('navigation.adminShort'),
        icon: AdminIcon,
      });
    }

    return sortByRank(items);
  }, [
    canAccessReservations,
    flags.agents,
    flags.automation,
    flags.calendarSync,
    flags.reservations,
    hideReservationsTab,
    t,
    unreadCount,
    userRole,
  ]);

  const desktopPrimaryItems = baseItems.filter((item) =>
    ['calendar', 'tasks'].includes(item.key),
  );

  const notificationItem = baseItems.find((item) => item.key === 'notifications') ?? null;

  const desktopSecondaryItems = baseItems.filter(
    (item) =>
      item.key !== 'notifications'
      && !desktopPrimaryItems.some((primary) => primary.key === item.key),
  );

  const mobileItems = baseItems;

  const breadcrumbTrail = useMemo(
    () => [t('app.title'), breadcrumbLabel(activeTab, t)],
    [activeTab, t],
  );

  return {
    allItems: baseItems,
    desktopPrimaryItems,
    desktopSecondaryItems,
    notificationItem,
    mobileItems,
    breadcrumbTrail,
    activeTab,
  };
};
