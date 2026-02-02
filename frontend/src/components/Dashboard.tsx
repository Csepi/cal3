/**
 * Dashboard Component
 *
 * Main application dashboard that serves as the primary layout container for the calendar application.
 * Handles user authentication, navigation between different views, and provides a consistent header/navigation bar.
 *
 * Features:
 * - User authentication state management
 * - Theme color personalization with real-time updates
 * - Role-based access control (admin/user)
 * - Persistent session management via localStorage
 * - Responsive navigation between application views (Calendar, Profile, Sync, Reservations, Admin)
 * - Gradient backgrounds with theme-based styling
 *
 * @component
 */

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Login } from './auth';
import Calendar from './Calendar';
import AdminPanel from './AdminPanel';
import AgentSettingsPage from './agent/AgentSettingsPage';
import UserProfile from './UserProfile';
import CalendarSync from './sync/CalendarSync';
import ReservationsPanel from './ReservationsPanel';
import { AutomationPanel } from './automation/AutomationPanel';
import { apiService } from '../services/api';
import { sessionManager } from '../services/sessionManager';
import { THEME_COLORS } from '../constants/theme';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { usePermissions } from '../hooks/usePermissions';
import { ResponsiveNavigation } from './mobile/organisms/ResponsiveNavigation';
import { FloatingActionButton } from './mobile/organisms/FloatingActionButton';
import { MobileLayout } from './mobile/templates/MobileLayout';
import { useScreenSize } from '../hooks/useScreenSize';
import type { TabId } from './mobile/organisms/BottomTabBar';
import { NotificationCenter, NotificationSettingsPanel } from './notifications';
import { TasksWorkspace, type TasksWorkspaceHandle } from './tasks/TasksWorkspace';
import { clientLogger } from '../utils/clientLogger';

/**
 * View types for the main navigation
 */
type DashboardView =
  | 'calendar'
  | 'tasks'
  | 'admin'
  | 'profile'
  | 'sync'
  | 'reservations'
  | 'automation'
  | 'agent'
  | 'notifications'
  | 'notification-settings';

interface DashboardProps {
  initialView?: DashboardView;
}

interface DashboardUserProfile {
  id: number;
  name?: string;
  fullName?: string;
  timezone?: string;
  timeFormat?: string;
  language?: string;
  themeColor?: string;
  hideReservationsTab?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ initialView = 'calendar' }) => {
  // Hooks
  const { i18n } = useTranslation();
  const { flags: featureFlags, loading: featureFlagsLoading } = useFeatureFlags();
  const { isMobile } = useScreenSize();
  const { currentUser, isAuthenticated, logout: authLogout } = useAuth();
  const { themeColor, themeConfig, setThemeColor } = useTheme();
  const {
    canAccessReservations,
    loading: permissionsLoading,
    refreshPermissions,
    resetPermissions,
  } = usePermissions();

  // Authentication and user state
  // UI state management
  const [currentView, setCurrentView] = useState<DashboardView>(initialView);
  const [userProfile, setUserProfile] = useState<DashboardUserProfile | null>(null);

  const tasksWorkspaceRef = useRef<TasksWorkspaceHandle | null>(null);

  /**
   * Handles user logout and clears all session data
   * Resets component state to default values and clears localStorage
   */
  const handleLogout = async () => {
    // Reset component state to defaults
    setCurrentView('calendar');
    setUserProfile(null);

    // Reset permissions state
    resetPermissions();

    // Notify API service to clear any cached tokens
    try {
      await authLogout();
    } catch (error) {
      clientLogger.warn('dashboard', 'logout request failed', error);
    }
    setThemeColor(THEME_COLORS.BLUE);
  };

  /**
   * Loads user profile from the server and applies theme preferences
   * Called after login and when user updates their profile
   */
  const loadUserProfile = async () => {
    try {
      const profile = await apiService.getUserProfile() as DashboardUserProfile;
      setUserProfile(profile);

      // Apply user's saved theme preference
      if (profile.themeColor) {
        setThemeColor(profile.themeColor);
      }

      // Apply user's saved language preference
      if (profile.language) {
        i18n.changeLanguage(profile.language);
      }
    } catch (err) {
      clientLogger.warn('dashboard', 'failed to load user profile', err);
    }
  };

  /**
   * Handles theme color changes from UserProfile component
   *
   * @param newTheme - The new theme color hex value
   */
  const handleThemeChange = (newTheme: string) => {
    setThemeColor(newTheme);
    localStorage.setItem('themeColor', newTheme);
  };

  // Initialize authentication state from localStorage on component mount
  useEffect(() => {
    if (!sessionManager.hasActiveSession()) {
      sessionManager.refreshAccessToken().catch(() => null);
    }
  }, []);

  // Load user profile and permissions on component mount if logged in
  useEffect(() => {
    if (!currentUser?.username) {
      return;
    }

    const initialise = async () => {
      if (!apiService.isAuthenticated()) {
        const refreshed = await sessionManager.refreshAccessToken();
        if (!refreshed) {
          await handleLogout();
          return;
        }
      }
      await loadUserProfile();
      await refreshPermissions();
    };

    void initialise();
  }, [currentUser?.username]);

  // Redirect to calendar if user loses access to current view
  useEffect(() => {
    if (featureFlagsLoading || permissionsLoading) return;

    // Redirect if current view's feature is disabled
    if (currentView === 'sync' && !featureFlags.calendarSync) {
      setCurrentView('calendar');
    } else if (currentView === 'automation' && !featureFlags.automation) {
      setCurrentView('calendar');
    } else if (currentView === 'reservations' && (!featureFlags.reservations || !canAccessReservations)) {
      setCurrentView('calendar');
    } else if (currentView === 'tasks' && !featureFlags.tasks) {
      setCurrentView('calendar');
    }
  }, [featureFlagsLoading, permissionsLoading, currentView, featureFlags, canAccessReservations]);

  // Get centralized theme configuration
  if (!isAuthenticated || !currentUser?.username) {
    return <Login />;
  }

  // Handle tab change (works for both mobile and desktop)
  const handleTabChange = (tabId: TabId) => {
    setCurrentView(tabId as DashboardView);
  };

  const handleCreateEvent = () => {
    clientLogger.debug('dashboard', 'floating action button pressed', {
      action: 'create-event',
    });
  };
  const handleCreateTask = () => {
    tasksWorkspaceRef.current?.openComposer();
  };

  // Refresh handler for pull-to-refresh
  const handleRefresh = async () => {
    await loadUserProfile();
    await refreshPermissions();
  };

  const activeNavigationView: TabId = (currentView === 'notification-settings'
    ? 'notifications'
    : currentView) as TabId;

  const displayName = userProfile?.name || userProfile?.fullName || currentUser?.username || '';
  const mobileSurfaceLabel = (() => {
    switch (currentView) {
      case 'calendar':
        return 'Timeline';
      case 'tasks':
        return 'Tasks';
      case 'reservations':
        return 'Bookings';
      case 'automation':
        return 'Automation';
      case 'agent':
        return 'Agents';
      case 'sync':
        return 'Sync';
      case 'admin':
        return 'Admin';
      case 'notifications':
      case 'notification-settings':
        return 'Notifications';
      default:
        return 'Profile';
    }
  })();

  return (
    <div className={`min-h-screen ${isMobile ? 'bg-white' : `bg-gradient-to-br ${themeConfig.gradient.background}`}`}>
      {/* Responsive Navigation - Adapts to screen size */}
      <ResponsiveNavigation
        activeTab={activeNavigationView}
        onTabChange={handleTabChange}
        hideReservationsTab={userProfile?.hideReservationsTab}
      />

      {/* Main Content Area with Mobile Layout Wrapper */}
      <MobileLayout
        showBottomNav={isMobile}
        onRefresh={handleRefresh}
        noPadding={currentView === 'calendar'}
        themeColor={themeColor}
        surfaceLabel={mobileSurfaceLabel}
        userName={displayName}
      >
        <div className={isMobile ? '' : 'relative'}>
          {currentView === 'calendar' && (
            <Calendar
              themeColor={themeColor}
              timeFormat={userProfile?.timeFormat || '12h'}
              timezone={userProfile?.timezone}
            />
          )}
          {currentView === 'tasks' && featureFlags.tasks && (
            <TasksWorkspace
              ref={tasksWorkspaceRef}
              themeColor={themeColor}
              timeFormat={userProfile?.timeFormat}
              timezone={userProfile?.timezone}
              locale={userProfile?.language}
            />
          )}
          {currentView === 'profile' && (
            <UserProfile
              onThemeChange={handleThemeChange}
              currentTheme={themeColor}
            />
          )}
          {currentView === 'sync' && featureFlags.calendarSync && (
            <CalendarSync themeColor={themeColor} />
          )}
          {currentView === 'automation' && featureFlags.automation && (
            <AutomationPanel themeColor={themeColor} />
          )}
          {currentView === 'agent' && featureFlags.agents && (
            <AgentSettingsPage themeColor={themeColor} />
          )}
          {currentView === 'reservations' && featureFlags.reservations && canAccessReservations && !userProfile?.hideReservationsTab && (
            <ReservationsPanel themeColor={themeColor} />
          )}
          {currentView === 'notifications' && (
            <NotificationCenter onOpenSettings={() => setCurrentView('notification-settings')} />
          )}
          {currentView === 'notification-settings' && (
            <NotificationSettingsPanel onBack={() => setCurrentView('notifications')} />
          )}
          {/* Admin Panel - Only accessible to admin users */}
          {currentView === 'admin' && (currentUser?.role || 'user') === 'admin' && (
            <AdminPanel themeColor={themeColor} />
          )}
        </div>
      </MobileLayout>

      {/* FAB quick actions */}
      {currentView === 'calendar' && (
        <FloatingActionButton
          primaryAction={{
            icon: '+',
            label: 'New Event',
            onClick: handleCreateEvent,
          }}
          themeColor={themeColor}
        />
      )}
      {currentView === 'tasks' && featureFlags.tasks && (
        <FloatingActionButton
          primaryAction={{
            icon: '+',
            label: 'New Task',
            onClick: handleCreateTask,
          }}
          themeColor={themeColor}
        />
      )}
    </div>
  );
};

export default Dashboard;



