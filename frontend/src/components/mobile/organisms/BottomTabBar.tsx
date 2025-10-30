/**
 * BottomTabBar - Organism Component
 *
 * Main navigation bar for mobile
 * Combines multiple TabBarItems
 * Adapts to user role and feature flags
 */

import React from 'react';
import { TabBarItem } from '../molecules/TabBarItem';

export type TabId = 'calendar' | 'profile' | 'sync' | 'reservations' | 'automation' | 'agent' | 'admin';

interface Tab {
  id: TabId;
  icon: string;
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
  };
  canAccessReservations: boolean;
  hideReservationsTab?: boolean;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabChange,
  themeColor,
  userRole,
  featureFlags,
  canAccessReservations,
  hideReservationsTab = false,
}) => {
  // Define all possible tabs with simple text icons for consistency in the CLI preview.
  const allTabs: Tab[] = [
    {
      id: 'calendar',
      icon: '[CAL]',
      label: 'Calendar',
      visible: true, // Always visible
    },
    {
      id: 'profile',
      icon: '[PRO]',
      label: 'Profile',
      visible: true, // Always visible
    },
    {
      id: 'agent',
      icon: '[AGT]',
      label: 'Agents',
      visible: featureFlags.agents,
    },
    {
      id: 'sync',
      icon: '[SYN]',
      label: 'Sync',
      visible: featureFlags.calendarSync,
    },
    {
      id: 'automation',
      icon: '[AUT]',
      label: 'Auto',
      visible: featureFlags.automation,
    },
    {
      id: 'reservations',
      icon: '[RES]',
      label: 'Reserve',
      visible: featureFlags.reservations && canAccessReservations && !hideReservationsTab,
    },
    {
      id: 'admin',
      icon: '[ADM]',
      label: 'Admin',
      visible: userRole === 'admin',
    },
  ];

  const tabPriority: Record<TabId, number> = {
    calendar: 0,
    profile: 1,
    agent: 2,
    sync: 3,
    automation: 4,
    reservations: 5,
    admin: 6,
  };

  const visibleTabs = allTabs
    .filter((tab) => tab.visible)
    .sort((a, b) => tabPriority[a.id] - tabPriority[b.id]);

  const displayedTabs = visibleTabs.slice(0, 5);
  const hasMoreTabs = visibleTabs.length > displayedTabs.length;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex items-stretch h-16">
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
            icon="[MORE]"
            label="More"
            isActive={false}
            onClick={() => {
              // Placeholder for future overflow menu.
            }}
            themeColor={themeColor}
          />
        )}
      </div>

      {/* Safe area for devices with home indicator */}
      <div className="h-[env(safe-area-inset-bottom)] bg-white" />
    </div>
  );
};

