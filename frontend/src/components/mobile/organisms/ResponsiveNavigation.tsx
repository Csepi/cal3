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
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../hooks/useTheme';
import { usePermissions } from '../../../hooks/usePermissions';
import { useFeatureFlags } from '../../../hooks/useFeatureFlags';
import { useNotifications } from '../../../hooks/useNotifications';
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

const TasksIcon = (
  <svg viewBox="0 0 24 24" {...iconProps}>
    <path d="M4 7h16M4 12h16M4 17h10" />
    <circle cx="7" cy="17" r="1.5" />
    <circle cx="17" cy="7" r="1.5" />
    <circle cx="17" cy="12" r="1.5" />
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
  hideReservationsTab?: boolean;
}

export const ResponsiveNavigation: React.FC<ResponsiveNavigationProps> = React.memo(({
  activeTab,
  onTabChange,
  hideReservationsTab,
}) => {
  const { isMobile, isTablet } = useScreenSize();
  const { currentUser, logout } = useAuth();
  const { themeColor, themeConfig } = useTheme();
  const { canAccessReservations } = usePermissions();
  const { flags: featureFlags } = useFeatureFlags();
  const { unreadCount } = useNotifications();
  const userRole = currentUser?.role || 'user';
  const userName = currentUser?.username || '';
  const notificationsBadge = unreadCount ?? 0;
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
      id: 'tasks' as TabId,
      icon: TasksIcon,
      label: 'Tasks',
      visible: featureFlags.tasks,
      isFeature: false,
    },
    {
      id: 'notifications' as TabId,
      icon: BellIcon,
      label: 'Notifications',
      shortLabel: 'Alerts',
      visible: true,
      isFeature: true,
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
  const notificationsFeature = featureTabs.find((tab) => tab.id === 'notifications');
  const featureAlertBadge = notificationsFeature?.badge ?? 0;

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
    <nav className="sticky top-0 z-[100000] border-b border-gray-200 bg-white/85 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 md:px-6 md:py-4">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <img src="/primecal-icon.png" alt="PrimeCal logo" className="h-10 w-10" />
          <div className="leading-tight">
            <p className="text-lg font-semibold text-gray-900">PrimeCal</p>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Be in sync with reality</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-1 flex-col items-center gap-2 overflow-visible">
          <div
            className={`flex w-full items-center justify-center gap-2 overflow-x-auto rounded-2xl border-2 border-${themeConfig.border} bg-white/60 p-1 backdrop-blur-sm`}
            role="tablist"
            aria-label="Primary navigation"
          >
            {mainTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-all duration-300
                  ${activeTab === tab.id ? `${themeConfig.button} text-white shadow-lg` : `text-${themeConfig.text} hover:bg-white/70`}`}
                aria-label={tab.label}
                role="tab"
                aria-selected={activeTab === tab.id}
              >
                <span className="relative text-gray-600" aria-hidden="true">
                  {tab.icon}
                  {!!tab.badge && tab.badge > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-[1.1rem] rounded-full bg-red-500 px-1 py-0.5 text-[0.65rem] leading-none text-white">
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  )}
                </span>
                <span className="hidden md:inline">{isTablet && tab.shortLabel ? tab.shortLabel : tab.label}</span>
              </button>
            ))}

            {hasFeatures && (
              <>
                <button
                  ref={buttonRef}
                  type="button"
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
                  className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-all duration-300
                    ${isFeatureActive ? `${themeConfig.button} text-white shadow-lg` : `text-${themeConfig.text} hover:bg-white/70`}`}
                  aria-expanded={showFeaturesDropdown}
                  aria-controls="primecal-feature-menu"
                >
                  <span className="text-gray-600" aria-hidden="true">
                    {FeatureIcon}
                  </span>
                  <span className="hidden md:inline">Features</span>
                  {featureAlertBadge > 0 && (
                    <span className="ml-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[0.65rem] font-semibold leading-none text-white">
                      {featureAlertBadge > 99 ? '99+' : featureAlertBadge}
                    </span>
                  )}
                  <span className="text-xs text-gray-400" aria-hidden="true">
                    ▾
                  </span>
                </button>

                {showFeaturesDropdown &&
                  createPortal(
                    <div
                      ref={dropdownRef}
                      id="primecal-feature-menu"
                      className="fixed z-[999999] min-w-[220px] rounded-xl border border-gray-200 bg-white py-2 shadow-2xl"
                      style={{
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`,
                      }}
                      role="menu"
                      aria-label="Feature navigation"
                    >
                      {featureTabs.map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            onTabChange(tab.id);
                            setShowFeaturesDropdown(false);
                          }}
                          className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-200
                            ${activeTab === tab.id ? `${themeConfig.button} text-white` : 'text-gray-700 hover:bg-gray-100'}`}
                          role="menuitem"
                        >
                          <span className="text-gray-600" aria-hidden="true">
                            {tab.icon}
                          </span>
                          <span className="flex-1">{tab.label}</span>
                          {!!tab.badge && tab.badge > 0 && (
                            <span className="inline-flex min-w-[1.8rem] items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-[0.65rem] font-semibold leading-none text-white">
                              {tab.badge > 99 ? '99+' : tab.badge}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>,
                    document.body,
                  )}
              </>
            )}
          </div>
        </div>

        {/* User summary + sign out */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Profile</span>
            <span className="text-sm font-semibold text-gray-900">{userName}</span>
            {userRole === 'admin' && (
              <span className="mt-1 inline-flex items-center justify-end gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                Admin
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-xl border border-red-400 bg-red-500 px-3 py-2 text-sm font-medium text-white shadow-md transition-all duration-300 hover:scale-105 hover:bg-red-600 md:px-4 md:text-base"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
});
