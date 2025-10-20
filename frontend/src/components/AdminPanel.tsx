/**
 * AdminPanel component - Refactored modular admin interface
 *
 * This component has been completely refactored from a monolithic 1695-line component
 * into a clean orchestrator that uses specialized, reusable components. It follows
 * React best practices with proper separation of concerns and "Lego-like" composition.
 *
 * Key improvements:
 * - Extracted theme colors to centralized constants
 * - Created reusable admin components (AdminStatsPanel, AdminUserPanel, etc.)
 * - Separated concerns (navigation, data management, UI)
 * - Reduced complexity from 1695 lines to ~150 lines
 * - Improved maintainability and testability
 */

import React, { useState } from 'react';
import { LoadingScreen } from './common';
import { useLoadingProgress } from '../hooks/useLoadingProgress';
import {
  AdminNavigation,
  AdminStatsPanel,
  AdminUserPanel,
  AdminOrganisationPanel,
  AdminCalendarPanel,
  AdminEventPanel,
  AdminSharePanel,
  AdminReservationPanel,
  type AdminTab
} from './admin';
import SystemInfoPage from './admin/SystemInfoPage';

interface AdminPanelProps {
  /** Current theme color for styling */
  themeColor?: string;
}

/**
 * Refactored AdminPanel using modular components for better maintainability
 * and code reusability following React best practices.
 */
const AdminPanel: React.FC<AdminPanelProps> = ({ themeColor = '#3b82f6' }) => {
  // Simplified state management - only what the orchestrator needs
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const { loadingState } = useLoadingProgress();

  /**
   * Handle tab navigation - clears component-specific state when switching
   */
  const handleTabChange = (newTab: AdminTab) => {
    setActiveTab(newTab);
  };

  /**
   * Render the appropriate panel component based on active tab
   */
  const renderActivePanel = () => {
    const panelProps = {
      themeColor,
      isActive: true
    };

    switch (activeTab) {
      case 'stats':
        return <AdminStatsPanel {...panelProps} />;

      case 'users':
        return <AdminUserPanel {...panelProps} />;

      case 'organizations':
        return <AdminOrganisationPanel {...panelProps} />;

      case 'calendars':
        return <AdminCalendarPanel {...panelProps} />;
      case 'events':
        return <AdminEventPanel {...panelProps} />;
      case 'shares':
        return <AdminSharePanel {...panelProps} />;
      case 'reservations':
        return <AdminReservationPanel {...panelProps} />;
      case 'system-info':
        return <SystemInfoPage />;

      default:
        return (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">❓</div>
            <p className="text-gray-600">Unknown panel</p>
          </div>
        );
    }
  };

  // Show loading screen during initial authentication or heavy operations
  if (loadingState.isLoading && loadingState.progress < 100) {
    return (
      <LoadingScreen
        progress={loadingState.progress}
        message={loadingState.message}
        themeColor={themeColor}
        overlay={true}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-300 to-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-indigo-300 to-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-r from-purple-300 to-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 backdrop-blur-sm bg-white/60 border-b border-blue-200 text-gray-800 py-6">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-semibold text-blue-900">
              🔧 Admin Dashboard
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto p-6 mt-6">
        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <AdminNavigation
              activeTab={activeTab}
              onTabChange={handleTabChange}
              themeColor={themeColor}
            />
          </div>

          {/* Main Content Panel */}
          <div className="lg:col-span-3">
            {renderActivePanel()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;