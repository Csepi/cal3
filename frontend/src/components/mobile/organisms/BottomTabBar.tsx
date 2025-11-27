/**
 * BottomTabBar - Organism Component
 *
 * Main navigation bar for mobile
 * Combines multiple TabBarItems
 * Adapts to user role and feature flags
 */

import React from 'react';
import { TabBarItem } from '../molecules/TabBarItem';

export type TabId =
  | 'calendar'
  | 'tasks'
  | 'profile'
  | 'sync'
  | 'reservations'
  | 'automation'
  | 'agent'
  | 'admin'
  | 'notifications';

interface Tab {
  id: TabId;
  icon: React.ReactNode;
  label: string;
  badge?: number | string;
  showDot?: boolean;
  visible: boolean;
}

interface BottomTabBarProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  themeColor: string;
  userRole: string;
  featureFlags: {
    calendarSync: boolean;
    reservations: boolean;
    automation: boolean;
    agents: boolean;
    tasks: boolean;
  };
  canAccessReservations: boolean;
  hideReservationsTab?: boolean;
  notificationsBadge?: number;
}

const iconProps = {
  className: 'w-5 h-5',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const icons = {
  timeline: (
    <svg viewBox="0 0 24 24" {...iconProps}>
      <rect x="4" y="5" width="16" height="15" rx="3" />
      <path d="M9 3v4" />
      <path d="M15 3v4" />
      <path d="M4 10h16" />
      <path d="M9 14h6" />
    </svg>
  ),
  tasks: (
    <svg viewBox="0 0 24 24" {...iconProps}>
      <path d="M4 7h10" />
      <path d="M4 12h10" />
      <path d="M4 17h6" />
      <path d="m15 7 2 2 4-4" />
      <path d="m15 12 2 2 4-4" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" {...iconProps}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
    </svg>
  ),
  agent: (
    <svg viewBox="0 0 24 24" {...iconProps}>
      <rect x="7" y="2" width="10" height="6" rx="3" />
      <path d="M5 10h14a3 3 0 0 1 0 6h-1.1A3.9 3.9 0 0 1 14 21h-4a3.9 3.9 0 0 1-3.9-5H5a3 3 0 1 1 0-6z" />
      <circle cx="10" cy="12" r="1" />
      <circle cx="14" cy="12" r="1" />
    </svg>
  ),
  sync: (
    <svg viewBox="0 0 24 24" {...iconProps}>
      <path d="M21 12A9 9 0 0 0 6 5.3V3L3 6l3 3V7.2A7 7 0 1 1 12 19a6.8 6.8 0 0 1-4.8-2" />
      <path d="M3 12h5" />
    </svg>
  ),
  automation: (
    <svg viewBox="0 0 24 24" {...iconProps}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H10a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V10a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  ),
  reservations: (
    <svg viewBox="0 0 24 24" {...iconProps}>
      <rect x="4" y="5" width="16" height="14" rx="3" />
      <path d="M16 3v4" />
      <path d="M8 3v4" />
      <path d="M4 11h16" />
      <path d="M9 15h2.5" />
      <path d="M13.5 15H16" />
    </svg>
  ),
  notifications: (
    <svg viewBox="0 0 24 24" {...iconProps}>
      <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 13.8V11a6 6 0 0 0-12 0v2.8a2 2 0 0 1-.6 1.4L4 17h5" />
      <path d="M9 21a3 3 0 0 0 6 0" />
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 24 24" {...iconProps}>
      <circle cx="8" cy="13" r="4" />
      <path d="M12 13h2a4 4 0 0 1 4 4v3" />
      <path d="M6 18a8 8 0 0 1 12-6" />
      <path d="m16 3 5 3-5 3V3z" />
    </svg>
  ),
};

const withAlpha = (color: string, alpha: number) => {
  if (!color.startsWith('#')) return color;
  const hex = color.replace('#', '');
  const normalized = hex.length === 3
    ? hex.split('').map((char) => char + char).join('')
    : hex;
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabChange,
  themeColor,
  userRole,
  featureFlags,
  canAccessReservations,
  hideReservationsTab = false,
  notificationsBadge = 0,
}) => {
  // Define all possible tabs with simple text icons for consistency in the CLI preview.
  const allTabs: Tab[] = [
    {
      id: 'calendar',
      icon: icons.timeline,
      label: 'Timeline',
      visible: true, // Always visible
    },
    {
      id: 'tasks',
      icon: icons.tasks,
      label: 'Tasks',
      visible: featureFlags.tasks,
    },
    {
      id: 'profile',
      icon: icons.profile,
      label: 'Me',
      visible: true, // Always visible
    },
    {
      id: 'agent',
      icon: icons.agent,
      label: 'Agents',
      visible: featureFlags.agents,
    },
    {
      id: 'sync',
      icon: icons.sync,
      label: 'Sync',
      visible: featureFlags.calendarSync,
    },
    {
      id: 'automation',
      icon: icons.automation,
      label: 'Automate',
      visible: featureFlags.automation,
    },
    {
      id: 'reservations',
      icon: icons.reservations,
      label: 'Book',
      visible: featureFlags.reservations && canAccessReservations && !hideReservationsTab,
    },
    {
      id: 'notifications',
      icon: icons.notifications,
      label: 'Alerts',
      visible: true,
      badge: notificationsBadge,
    },
    {
      id: 'admin',
      icon: icons.admin,
      label: 'Admin',
      visible: userRole === 'admin',
    },
  ];

  const tabPriority: Record<TabId, number> = {
    calendar: 0,
    tasks: 1,
    reservations: 2,
    notifications: 3,
    profile: 4,
    automation: 5,
    agent: 6,
    sync: 7,
    admin: 8,
  };

  const visibleTabs = allTabs
    .filter((tab) => tab.visible)
    .sort((a, b) => tabPriority[a.id] - tabPriority[b.id]);

  const displayedTabs = visibleTabs.slice(0, 5);
  const hasMoreTabs = visibleTabs.length > displayedTabs.length;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2">
        <div
          className="pointer-events-auto flex items-stretch gap-1 rounded-2xl border bg-white/95 backdrop-blur-xl shadow-[0_-6px_32px_rgba(15,23,42,0.12)]"
          style={{
            borderColor: withAlpha(themeColor, 0.18),
            boxShadow: `0 10px 28px ${withAlpha(themeColor, 0.12)}`,
          }}
        >
          {displayedTabs.map((tab) => (
            <TabBarItem
              key={tab.id}
              icon={tab.icon}
              label={tab.label}
              isActive={activeTab === tab.id}
              badge={tab.badge}
              showDot={tab.showDot}
              onClick={() => onTabChange(tab.id)}
              themeColor={themeColor}
            />
          ))}

          {/* "More" button if needed (future enhancement) */}
          {hasMoreTabs && (
            <TabBarItem
              icon={(
                <svg viewBox="0 0 24 24" {...iconProps}>
                  <circle cx="5" cy="12" r="1.4" />
                  <circle cx="12" cy="12" r="1.4" />
                  <circle cx="19" cy="12" r="1.4" />
                </svg>
              )}
              label="More"
              isActive={false}
              onClick={() => {
                // Placeholder for future overflow menu.
              }}
              themeColor={themeColor}
            />
          )}
        </div>
      </div>
    </div>
  );
};
