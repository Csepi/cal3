/**
 * AdminNavigation component for admin panel tab navigation
 *
 * This component provides a clean, accessible navigation interface for switching
 * between different admin panel sections. It includes active state indicators,
 * icons, and responsive design for mobile devices.
 */

import React from 'react';
import { AdminTab } from './types';
import { getThemeConfig } from '../../constants';

export interface AdminNavigationProps {
  /** Currently active tab */
  activeTab: AdminTab;
  /** Callback when tab changes */
  onTabChange: (tab: AdminTab) => void;
  /** Current theme color for styling */
  themeColor?: string;
  /** Optional className for additional styling */
  className?: string;
}

/**
 * Tab configuration with icons and labels
 */
const TAB_CONFIG: Record<AdminTab, { label: string; icon: string; description: string }> = {
  stats: {
    label: 'Statistics',
    icon: '📊',
    description: 'Database metrics and overview'
  },
  users: {
    label: 'Users',
    icon: '👥',
    description: 'User management and profiles'
  },
  calendars: {
    label: 'Calendars',
    icon: '📅',
    description: 'Calendar management and settings'
  },
  events: {
    label: 'Events',
    icon: '📝',
    description: 'Event management and scheduling'
  },
  shares: {
    label: 'Shares',
    icon: '🤝',
    description: 'Calendar sharing and permissions'
  },
  reservations: {
    label: 'Reservations',
    icon: '🏢',
    description: 'Resource reservations and bookings'
  }
};

/**
 * Navigation component with tab switching and active state management
 */
export const AdminNavigation: React.FC<AdminNavigationProps> = ({
  activeTab,
  onTabChange,
  themeColor = '#3b82f6',
  className = ''
}) => {
  const themeConfig = getThemeConfig(themeColor);

  /**
   * Handle tab click with keyboard support
   */
  const handleTabClick = (tab: AdminTab) => {
    onTabChange(tab);
  };

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (e: React.KeyboardEvent, tab: AdminTab) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTabClick(tab);
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* Navigation Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-sm text-gray-500">System administration and management</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="p-2">
        <div className="space-y-1">
          {(Object.entries(TAB_CONFIG) as [AdminTab, typeof TAB_CONFIG[AdminTab]][]).map(([tab, config]) => {
            const isActive = activeTab === tab;

            return (
              <button
                key={tab}
                onClick={() => handleTabClick(tab)}
                onKeyDown={(e) => handleKeyDown(e, tab)}
                className={`
                  w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                  ${isActive
                    ? `bg-gradient-to-r ${themeConfig.gradientBg} text-gray-800 shadow-sm ring-1 ring-gray-200`
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
                aria-label={`Switch to ${config.label} tab`}
                role="tab"
                aria-selected={isActive}
              >
                {/* Tab Icon */}
                <span className="flex-shrink-0 text-xl mr-3">
                  {config.icon}
                </span>

                {/* Tab Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                      {config.label}
                    </span>
                    {isActive && (
                      <div className="flex-shrink-0 ml-2">
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${themeConfig.gradientFrom} ${themeConfig.gradientTo}`}></div>
                      </div>
                    )}
                  </div>
                  <p className={`text-xs mt-1 ${isActive ? 'text-gray-600' : 'text-gray-500'}`}>
                    {config.description}
                  </p>
                </div>

                {/* Active Indicator */}
                {isActive && (
                  <div className="flex-shrink-0 ml-3">
                    <svg
                      className={`w-4 h-4 ${themeConfig.textColor}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Quick Actions Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Current: <span className="font-medium text-gray-700">{TAB_CONFIG[activeTab].label}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
              title="Refresh current tab"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
              title="Settings"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};