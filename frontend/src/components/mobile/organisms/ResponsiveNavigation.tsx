/**
 * ResponsiveNavigation - Adaptive Navigation System
 *
 * Renders:
 * - Desktop (≥1024px): Horizontal tab bar at top with Features dropdown
 * - Tablet (768-1023px): Compact horizontal tabs
 * - Mobile (<768px): Bottom tab bar
 *
 * Preserves ALL features, just changes layout
 * Features dropdown groups: Sync, Automation, Reservations
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useScreenSize } from '../../../hooks/useScreenSize';
import { BottomTabBar } from './BottomTabBar';
import type { TabId } from './BottomTabBar';

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
  const [showFeaturesDropdown, setShowFeaturesDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFeaturesDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Define all tabs with their visibility rules
  const tabs = [
    {
      id: 'calendar' as TabId,
      icon: '📅',
      label: 'Calendar',
      visible: true,
      isFeature: false,
    },
    {
      id: 'profile' as TabId,
      icon: '👤',
      label: 'Profile',
      visible: true,
      isFeature: false,
    },
    {
      id: 'sync' as TabId,
      icon: '🔄',
      label: 'Calendar Sync',
      shortLabel: 'Sync',
      visible: featureFlags.calendarSync,
      isFeature: true,
    },
    {
      id: 'automation' as TabId,
      icon: '🤖',
      label: 'Automation',
      shortLabel: 'Auto',
      visible: featureFlags.automation,
      isFeature: true,
    },
    {
      id: 'reservations' as TabId,
      icon: '📆',
      label: 'Reservations',
      shortLabel: 'Reserve',
      visible: featureFlags.reservations && canAccessReservations && !hideReservationsTab,
      isFeature: true,
    },
    {
      id: 'admin' as TabId,
      icon: '⚙️',
      label: 'Admin Panel',
      shortLabel: 'Admin',
      visible: userRole === 'admin',
      isFeature: false,
    },
  ].filter(tab => tab.visible);

  // Separate main tabs and feature tabs
  const mainTabs = tabs.filter(tab => !tab.isFeature);
  const featureTabs = tabs.filter(tab => tab.isFeature);
  const hasFeatures = featureTabs.length > 0;
  const isFeatureActive = featureTabs.some(tab => tab.id === activeTab);

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

  // Desktop/Tablet: Top Horizontal Bar with Features dropdown
  return (
    <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-[100000] shadow-sm overflow-visible">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex justify-between items-center overflow-visible">
        {/* User Information and Navigation */}
        <div className="flex items-center space-x-3 md:space-x-6 flex-1 overflow-x-auto overflow-y-visible">
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
          <div className={`flex space-x-1 bg-white/50 backdrop-blur-sm border-2 border-${themeConfig.border} rounded-2xl p-1 overflow-visible`}>
            {/* Main tabs (Calendar, Profile, Admin) */}
            {mainTabs.map((tab) => (
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
                <span className="hidden md:inline">
                  {isTablet && tab.shortLabel ? tab.shortLabel : tab.label}
                </span>
              </button>
            ))}

            {/* Features Dropdown (Sync, Automation, Reservations) */}
            {hasFeatures && (
              <>
                <button
                  ref={buttonRef}
                  onClick={() => {
                    if (buttonRef.current) {
                      const rect = buttonRef.current.getBoundingClientRect();
                      setDropdownPosition({
                        top: rect.bottom + 8,
                        left: rect.left
                      });
                    }
                    setShowFeaturesDropdown(!showFeaturesDropdown);
                  }}
                  className={`
                    px-3 md:px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap flex items-center gap-1
                    ${isFeatureActive
                      ? `${themeConfig.button} text-white shadow-lg`
                      : `text-${themeConfig.text} hover:bg-white/50`
                    }
                  `}
                >
                  <span className="mr-1">✨</span>
                  <span className="hidden md:inline">Features</span>
                  <span className="text-xs">▾</span>
                </button>

                {/* Dropdown Menu - Rendered via Portal */}
                {showFeaturesDropdown && createPortal(
                  <div
                    ref={dropdownRef}
                    className="fixed min-w-[200px] bg-white rounded-xl shadow-2xl border-2 border-gray-200 py-2 z-[999999]"
                    style={{
                      top: `${dropdownPosition.top}px`,
                      left: `${dropdownPosition.left}px`
                    }}
                  >
                    {featureTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          onTabChange(tab.id);
                          setShowFeaturesDropdown(false);
                        }}
                        className={`
                          w-full text-left px-4 py-2.5 text-sm font-medium transition-all duration-200 flex items-center gap-3
                          ${activeTab === tab.id
                            ? `${themeConfig.button} text-white`
                            : `text-gray-700 hover:bg-gray-100`
                          }
                        `}
                      >
                        <span className="text-lg">{tab.icon}</span>
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>,
                  document.body
                )}
              </>
            )}
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
