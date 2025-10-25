/**
 * BottomTabBar - Organism Component
 *
 * Main navigation bar for mobile
 * Combines multiple TabBarItems
 * Adapts to user role and feature flags
 */

import React from 'react';
import { TabBarItem } from '../molecules/TabBarItem';

export type TabId = 'calendar' | 'profile' | 'sync' | 'reservations' | 'automation' | 'admin';

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
  // Define all possible tabs
  const allTabs: Tab[] = [
    {
      id: 'calendar',
      icon: '📅',
      label: 'Calendar',
      visible: true, // Always visible
    },
    {
      id: 'profile',
      icon: '👤',
      label: 'Profile',
      visible: true, // Always visible
    },
    {
      id: 'sync',
      icon: '🔄',
      label: 'Sync',
      visible: featureFlags.calendarSync,
    },
    {
      id: 'reservations',
      icon: '📆',
      label: 'Reserve',
      visible: featureFlags.reservations && canAccessReservations && !hideReservationsTab,
    },
    {
      id: 'automation',
      icon: '🤖',
      label: 'Auto',
      visible: featureFlags.automation,
    },
    {
      id: 'admin',
      icon: '⚙️',
      label: 'Admin',
      visible: userRole === 'admin',
    },
  ];

  // Filter to only visible tabs (max 5 for mobile)
  const visibleTabs = allTabs.filter(tab => tab.visible).slice(0, 5);

  // If we have more than 5 features, we need a "More" menu
  // For now, we'll just show first 5
  const hasMoreTabs = allTabs.filter(tab => tab.visible).length > 5;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex items-stretch h-16">
        {visibleTabs.map((tab) => (
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
            icon="⋯"
            label="More"
            isActive={false}
            onClick={() => {
              // Show more menu
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
