import { useMemo } from 'react';
import type { ReactNode } from 'react';

import { useAppTranslation } from '../../i18n/useAppTranslation';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import { useNotifications } from '../../hooks/useNotifications';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../hooks/useAuth';
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
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H10a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V10a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
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

export const useNavigation = ({ activeTab, hideReservationsTab = false }: UseNavigationOptions) => {
  const { t } = useAppTranslation('common');
  const { flags } = useFeatureFlags();
  const { unreadCount } = useNotifications();
  const { canAccessReservations } = usePermissions();
  const { currentUser } = useAuth();

  const userRole = currentUser?.role ?? 'user';

  const allItems = useMemo<NavigationItem[]>(() => {
    const items: NavigationItem[] = [
      {
        key: 'calendar',
        tabId: 'calendar',
        label: t('navigation.calendar'),
        icon: CalendarIcon,
      },
      {
        key: 'tasks',
        tabId: 'tasks',
        label: t('navigation.tasks', { defaultValue: 'Tasks' }),
        icon: TasksIcon,
      },
      {
        key: 'groups',
        tabId: 'calendar',
        label: t('navigation.groups', { defaultValue: 'Groups' }),
        icon: GroupsIcon,
        intent: 'groups',
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
    ];

    if (flags.reservations && canAccessReservations && !hideReservationsTab) {
      items.push({
        key: 'reservations',
        tabId: 'reservations',
        label: t('navigation.reservations'),
        icon: GroupsIcon,
      });
    }

    if (flags.automation) {
      items.push({
        key: 'automation',
        tabId: 'automation',
        label: t('navigation.automation'),
        icon: SettingsIcon,
      });
    }

    if (flags.agents) {
      items.push({
        key: 'agent',
        tabId: 'agent',
        label: t('navigation.agentSettings', { defaultValue: 'Agent settings' }),
        icon: AdminIcon,
      });
    }

    if (flags.calendarSync) {
      items.push({
        key: 'sync',
        tabId: 'sync',
        label: t('navigation.sync'),
        icon: CalendarIcon,
      });
    }

    if (userRole === 'admin') {
      items.push({
        key: 'admin',
        tabId: 'admin',
        label: t('navigation.admin'),
        icon: AdminIcon,
      });
    }

    return items;
  }, [canAccessReservations, flags.agents, flags.automation, flags.calendarSync, flags.reservations, hideReservationsTab, t, unreadCount, userRole]);

  const desktopPrimaryItems = allItems.filter((item) =>
    ['calendar', 'tasks', 'groups', 'settings', 'profile'].includes(item.key),
  );

  const desktopSecondaryItems = allItems.filter((item) => !desktopPrimaryItems.some((primary) => primary.key === item.key));

  const mobileItems = allItems.filter((item) =>
    ['calendar', 'groups', 'tasks', 'settings', 'profile'].includes(item.key),
  );

  const breadcrumbTrail = useMemo(
    () => [
      t('app.title'),
      breadcrumbLabel(activeTab, t),
    ],
    [activeTab, t],
  );

  return {
    desktopPrimaryItems,
    desktopSecondaryItems,
    mobileItems,
    breadcrumbTrail,
    activeTab,
  };
};
