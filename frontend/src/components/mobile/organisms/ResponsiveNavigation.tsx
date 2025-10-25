/**
 * ResponsiveNavigation - Adaptive Navigation System
 *
 * Renders:
 * - Desktop (≥1024px): Horizontal tab bar at top
 * - Tablet (768-1023px): Compact horizontal tabs
 * - Mobile (<768px): Bottom tab bar
 *
 * Preserves ALL features, just changes layout
 */

import React from 'react';
import { useScreenSize } from '../../../hooks/useScreenSize';
import { BottomTabBar, TabId } from './BottomTabBar';

interface ResponsiveNavigationProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  themeColor: string;
  userRole: string;
  userName: string;
  onLogout: () => void;
  featureFlags: {
    calendarSync: boolean;
    reservations: boolean;
    automation: boolean;
  };
  canAccessReservations: boolean;
  hideReservationsTab?: boolean;
  themeConfig: any;
}

export const ResponsiveNavigation: React.FC<ResponsiveNavigationProps> = ({
  activeTab,
  onTabChange,
  themeColor,
  userRole,
  userName,
  onLogout,
  featureFlags,
  canAccessReservations,
  hideReservationsTab,
  themeConfig,
}) => {
  const { isMobile, isTablet, isDesktop } = useScreenSize();

  // Define all tabs with their visibility rules
  const tabs = [
    {
      id: 'calendar' as TabId,
      icon: '📅',
      label: 'Calendar',
      visible: true,
    },
    {
      id: 'profile' as TabId,
      icon: '👤',
      label: 'Profile',
      visible: true,
    },
    {
      id: 'sync' as TabId,
      icon: '🔄',
      label: 'Calendar Sync',
      shortLabel: 'Sync',
      visible: featureFlags.calendarSync,
    },
    {
      id: 'automation' as TabId,
      icon: '🤖',
      label: 'Automation',
      shortLabel: 'Auto',
      visible: featureFlags.automation,
    },
    {
      id: 'reservations' as TabId,
      icon: '📆',
      label: 'Reservations',
      shortLabel: 'Reserve',
      visible: featureFlags.reservations && canAccessReservations && !hideReservationsTab,
    },
    {
      id: 'admin' as TabId,
      icon: '⚙️',
      label: 'Admin Panel',
      shortLabel: 'Admin',
      visible: userRole === 'admin',
    },
  ].filter(tab => tab.visible);

  // Mobile: Bottom Tab Bar
  if (isMobile) {
    return (
      <BottomTabBar
        activeTab={activeTab}
        onTabChange={onTabChange}
        themeColor={themeColor}
        userRole={userRole}
        featureFlags={featureFlags}
        canAccessReservations={canAccessReservations}
        hideReservationsTab={hideReservationsTab}
      />
    );
  }

  // Desktop/Tablet: Top Horizontal Bar (existing design)
  return (
    <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
        {/* User Information and Navigation */}
        <div className="flex items-center space-x-3 md:space-x-6 flex-1 overflow-x-auto">
          {/* User Welcome - Hide on smaller screens */}
          <div className="text-gray-800 hidden lg:block shrink-0">
            <span className="text-sm text-gray-600">Welcome,</span>
            <span className={`ml-2 text-lg font-medium text-${themeConfig.text}`}>{userName}</span>
            {userRole === 'admin' && (
              <span className="ml-3 px-3 py-1 bg-red-100 border border-red-300 text-red-700 text-xs rounded-full font-medium">
                🔥 Admin
              </span>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className={`flex space-x-1 bg-white/50 backdrop-blur-sm border-2 border-${themeConfig.border} rounded-2xl p-1`}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  px-3 md:px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap
                  ${activeTab === tab.id
                    ? `${themeConfig.button} text-white shadow-lg`
                    : `text-${themeConfig.text} hover:bg-white/50`
                  }
                `}
              >
                <span className="mr-1">{tab.icon}</span>
                {/* Show short label on tablet, full label on desktop */}
                <span className="hidden md:inline">
                  {isTablet && tab.shortLabel ? tab.shortLabel : tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="ml-4 px-3 md:px-4 py-2 bg-red-500 border border-red-400 text-white rounded-2xl hover:bg-red-600 font-medium transition-all duration-300 hover:scale-105 shadow-md text-sm md:text-base shrink-0"
        >
          <span className="hidden md:inline">🚀 Sign Out</span>
          <span className="md:hidden">Exit</span>
        </button>
      </div>
    </div>
  );
};
