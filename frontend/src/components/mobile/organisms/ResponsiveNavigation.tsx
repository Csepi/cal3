/**
 * ResponsiveNavigation - Adaptive Navigation System
 *
 * Renders:
 * - Desktop (>= 1024px): Horizontal tab bar at top with Features dropdown
 * - Tablet (768-1023px): Compact horizontal tabs
 * - Mobile (< 768px): Bottom tab bar
 *
 * Preserves all features; only the layout changes with the breakpoint.
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useScreenSize } from '../../../hooks/useScreenSize';
import { BottomTabBar } from './BottomTabBar';
import type { TabId } from './BottomTabBar';

const iconProps = {
  className: 'h-4 w-4',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const CalendarIcon = (
  <svg viewBox="0 0 24 24" {...iconProps}>
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M8 3v4" />
    <path d="M16 3v4" />
    <path d="M3.5 11h17" />
  </svg>
);

const ProfileIcon = (
  <svg viewBox="0 0 24 24" {...iconProps}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
  </svg>
);

const SyncIcon = (
  <svg viewBox="0 0 24 24" {...iconProps}>
    <path d="M21 12a9 9 0 0 0-15-6.7V3L3 6l3 3V6.7A7 7 0 1 1 12 19a6.9 6.9 0 0 1-4.9-2" />
    <path d="M3 12h5" />
  </svg>
);

const AutomationIcon = (
  <svg viewBox="0 0 24 24" {...iconProps}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H10a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V10a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const ReservationsIcon = (
  <svg viewBox="0 0 24 24" {...iconProps}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M16 3v4" />
    <path d="M8 3v4" />
    <path d="M3 11h18" />
    <path d="M8 15h2" />
    <path d="M12 15h4" />
  </svg>
);

const AdminIcon = (
  <svg viewBox="0 0 24 24" {...iconProps}>
    <circle cx="8" cy="13" r="4" />
    <path d="M12 13h2a4 4 0 0 1 4 4v3" />
    <path d="M6 18a8 8 0 0 1 12-6" />
    <path d="m16 3 5 3-5 3V3z" />
  </svg>
);

const FeatureIcon = (
  <svg viewBox="0 0 24 24" {...iconProps}>
    <path d="m12 3 2.09 6.26H20l-5.17 3.76L16.91 19 12 14.97 7.09 19l1.08-5.98L3 9.26h5.91z" />
  </svg>
);

const AgentIcon = (
  <svg viewBox="0 0 24 24" {...iconProps}>
    <rect x="7" y="2" width="10" height="6" rx="3" />
    <path d="M5 10h14a3 3 0 0 1 0 6h-1.2A3.8 3.8 0 0 1 14 21h-4a3.8 3.8 0 0 1-3.8-5H5a3 3 0 0 1 0-6z" />
    <circle cx="10" cy="12" r="1" />
    <circle cx="14" cy="12" r="1" />
  </svg>
);

const BellIcon = (
  <svg viewBox="0 0 24 24" {...iconProps}>
    <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 13.8V11a6 6 0 0 0-12 0v2.8a2 2 0 0 1-.6 1.4L4 17h5" />
    <path d="M9 21a3 3 0 0 0 6 0" />
  </svg>
);

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
    agents: boolean;
  };
  canAccessReservations: boolean;
  hideReservationsTab?: boolean;
  themeConfig: any;
  notificationsBadge?: number;
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
  notificationsBadge = 0,
}) => {
  const { isMobile, isTablet } = useScreenSize();
  const [showFeaturesDropdown, setShowFeaturesDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        (!buttonRef.current || !buttonRef.current.contains(target))
      ) {
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
      icon: CalendarIcon,
      label: 'Calendar',
      visible: true,
      isFeature: false,
    },
    {
      id: 'notifications' as TabId,
      icon: BellIcon,
      label: 'Notifications',
      shortLabel: 'Alerts',
      visible: true,
      isFeature: false,
      badge: notificationsBadge,
    },
    {
      id: 'profile' as TabId,
      icon: ProfileIcon,
      label: 'Profile',
      visible: true,
      isFeature: false,
    },
    {
      id: 'sync' as TabId,
      icon: SyncIcon,
      label: 'Calendar Sync',
      shortLabel: 'Sync',
      visible: featureFlags.calendarSync,
      isFeature: true,
    },
    {
      id: 'automation' as TabId,
      icon: AutomationIcon,
      label: 'Automation',
      shortLabel: 'Auto',
      visible: featureFlags.automation,
      isFeature: true,
    },
    {
      id: 'agent' as TabId,
      icon: AgentIcon,
      label: 'Agent settings',
      shortLabel: 'Agents',
      visible: featureFlags.agents,
      isFeature: true,
    },
    {
      id: 'reservations' as TabId,
      icon: ReservationsIcon,
      label: 'Reservations',
      shortLabel: 'Reserve',
      visible: featureFlags.reservations && canAccessReservations && !hideReservationsTab,
      isFeature: true,
    },
    {
      id: 'admin' as TabId,
      icon: AdminIcon,
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
        notificationsBadge={notificationsBadge}
      />
    );
  }

  // Desktop/Tablet: Top Horizontal Bar with Features dropdown
  return (
    <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-[100000] shadow-sm overflow-visible">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex justify-between items-center overflow-visible">
        {/* Brand and Navigation */}
        <div className="flex items-center space-x-4 md:space-x-6 flex-1 overflow-x-auto overflow-y-visible">
          <div className="flex items-center gap-3 pr-4 md:pr-6 border-r border-gray-200 shrink-0">
            <img src="/primecal-icon.svg" alt="PrimeCal logo" className="h-10 w-10" />
            <div className="leading-tight">
              <p className="text-lg font-semibold text-gray-900">PrimeCal</p>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Be in sync with Reality</p>
            </div>
          </div>

          {/* User Welcome - Hide on smaller screens */}
          <div className="text-gray-800 hidden lg:block shrink-0">
            <span className="text-sm text-gray-600">Welcome,</span>
            <span className={`ml-2 text-lg font-medium text-${themeConfig.text}`}>{userName}</span>
            {userRole === 'admin' && (
              <span className="ml-3 px-3 py-1 bg-red-100 border border-red-300 text-red-700 text-xs rounded-full font-medium">
                Admin
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
                  px-3 md:px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap flex items-center gap-2
                  ${activeTab === tab.id
                    ? `${themeConfig.button} text-white shadow-lg`
                    : `text-${themeConfig.text} hover:bg-white/50`
                  }
                `}
                aria-label={tab.label}
              >
                <span className="relative text-gray-600" aria-hidden="true">
                  {tab.icon}
                  {!!tab.badge && tab.badge > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-[1.1rem] px-1 py-0.5 rounded-full bg-red-500 text-white text-[0.65rem] leading-none text-center">
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  )}
                </span>
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
                        left: rect.left,
                      });
                    }
                    setShowFeaturesDropdown(!showFeaturesDropdown);
                  }}
                  className={`
                    px-3 md:px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap flex items-center gap-2
                    ${isFeatureActive
                      ? `${themeConfig.button} text-white shadow-lg`
                      : `text-${themeConfig.text} hover:bg-white/50`
                    }
                  `}
                  aria-expanded={showFeaturesDropdown}
                  aria-controls="primecal-feature-menu"
                >
                  <span className="text-gray-600" aria-hidden="true">
                    {FeatureIcon}
                  </span>
                  <span className="hidden md:inline">Features</span>
                  <span className="text-xs">v</span>
                </button>

                {/* Dropdown Menu - Rendered via Portal */}
                {showFeaturesDropdown && createPortal(
                  <div
                    ref={dropdownRef}
                    id="primecal-feature-menu"
                    className="fixed min-w-[200px] bg-white rounded-xl shadow-2xl border-2 border-gray-200 py-2 z-[999999]"
                    style={{
                      top: `${dropdownPosition.top}px`,
                      left: `${dropdownPosition.left}px`,
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
                            : 'text-gray-700 hover:bg-gray-100'
                          }
                        `}
                      >
                        <span className="text-gray-600" aria-hidden="true">
                          {tab.icon}
                        </span>
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>,
                  document.body,
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
          <span className="hidden md:inline">Sign Out</span>
          <span className="md:hidden">Exit</span>
        </button>
      </div>
    </div>
  );
};
