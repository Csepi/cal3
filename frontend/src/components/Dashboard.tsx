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
import { UserPermissionsService } from '../services/userPermissions';
import { THEME_COLORS, getThemeConfig } from '../constants/theme';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import { ResponsiveNavigation } from './mobile/organisms/ResponsiveNavigation';
import { FloatingActionButton } from './mobile/organisms/FloatingActionButton';
import { MobileLayout } from './mobile/templates/MobileLayout';
import { useScreenSize } from '../hooks/useScreenSize';
import type { TabId } from './mobile/organisms/BottomTabBar';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationCenter, NotificationSettingsPanel } from './notifications';
import { TasksWorkspace, type TasksWorkspaceHandle } from './tasks/TasksWorkspace';

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

const Dashboard: React.FC = () => {
  // Hooks
  const { i18n } = useTranslation();
  const { flags: featureFlags, loading: featureFlagsLoading } = useFeatureFlags();
  const { isMobile } = useScreenSize();

  // Authentication and user state
  const [user, setUser] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('user');

  // UI state management
  const [currentView, setCurrentView] = useState<DashboardView>('calendar');
  const getInitialThemeColor = () => {
    if (typeof window === 'undefined') {
      return THEME_COLORS.BLUE;
    }
    return localStorage.getItem('themeColor') || THEME_COLORS.BLUE;
  };

  const [themeColor, setThemeColor] = useState<string>(getInitialThemeColor);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Permissions state
  const [canAccessReservations, setCanAccessReservations] = useState<boolean>(false);
  const [permissionsLoading, setPermissionsLoading] = useState<boolean>(true);

  const { unreadCount } = useNotifications();
  const tasksWorkspaceRef = useRef<TasksWorkspaceHandle | null>(null);

  /**
   * Handles user login and initializes user session
   *
   * @param username - The logged-in user's username
   * @param token - Optional JWT authentication token
   * @param role - User role (admin/user), defaults to 'user'
   * @param userData - Additional user profile data including theme preferences
   */
  const handleLogin = (username: string, token?: string, role?: string, userData?: any) => {
    // Update component state
    setUser(username);
    setUserRole(role || 'user');

    // Store authentication data in localStorage for session persistence
    localStorage.setItem('username', username);
    localStorage.setItem('userRole', role || 'user');
    if (token) {
      // Token is managed via sessionManager; no browser storage required.
    }

    // Apply user's theme preference if available
    if (userData && userData.themeColor) {
      setThemeColor(userData.themeColor);
      localStorage.setItem('themeColor', userData.themeColor);
    }

    // Load complete user profile from server
    loadUserProfile();

    // Load user permissions
    loadUserPermissions();
  };

  /**
   * Handles user logout and clears all session data
   * Resets component state to default values and clears localStorage
   */
  const handleLogout = async () => {
    // Reset component state to defaults
    setUser(null);
    setUserRole('user');
    setCurrentView('calendar');
    setThemeColor(THEME_COLORS.BLUE);
    localStorage.removeItem('themeColor');
    setUserProfile(null);

    // Reset permissions state
    setCanAccessReservations(false);
    setPermissionsLoading(true);

    // Clear all authentication data from localStorage
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');

    // Clear permissions cache
    UserPermissionsService.clearCache();

    // Notify API service to clear any cached tokens
    try {
      await apiService.logout();
    } catch (error) {
      console.warn('Logout request failed', error);
    }
  };

  /**
   * Loads user profile from the server and applies theme preferences
   * Called after login and when user updates their profile
   */
  const loadUserProfile = async () => {
    try {
      const profile = await apiService.getUserProfile();
      setUserProfile(profile);

      // Apply user's saved theme preference
      if (profile.themeColor) {
        setThemeColor(profile.themeColor);
        localStorage.setItem('themeColor', profile.themeColor);
      }

      // Apply user's saved language preference
      if (profile.language) {
        i18n.changeLanguage(profile.language);
      }
    } catch (err) {
      console.warn('Could not load user profile:', err);
    }
  };

  /**
   * Loads user permissions from the server
   * Called after login and when permissions need to be refreshed
   */
  const loadUserPermissions = async () => {
    try {
      setPermissionsLoading(true);
      const hasReservationAccess = await UserPermissionsService.canAccessReservations();
      setCanAccessReservations(hasReservationAccess);
    } catch (err) {
      console.warn('Could not load user permissions:', err);
      setCanAccessReservations(false);
    } finally {
      setPermissionsLoading(false);
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
    const storedUsername = localStorage.getItem('username');
    const storedRole = localStorage.getItem('userRole');

    if (storedUsername) {
      setUser(storedUsername);
      setUserRole(storedRole || 'user');
    }

    if (!sessionManager.hasActiveSession()) {
      sessionManager.refreshAccessToken().catch(() => {
        setUser(null);
      });
    }
  }, []);

  // Load user profile and permissions on component mount if logged in
  useEffect(() => {
    if (!user) {
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
      await loadUserPermissions();
    };

    void initialise();
  }, [user]);

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
  const themeConfig = getThemeConfig(themeColor);

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Handle tab change (works for both mobile and desktop)
  const handleTabChange = (tabId: TabId) => {
    setCurrentView(tabId as DashboardView);
  };

  const handleCreateEvent = () => {
    console.log('Create new event');
  };
  const handleCreateTask = () => {
    tasksWorkspaceRef.current?.openComposer();
  };

  // Refresh handler for pull-to-refresh
  const handleRefresh = async () => {
    await loadUserProfile();
    await loadUserPermissions();
  };

  const activeNavigationView: TabId = (currentView === 'notification-settings'
    ? 'notifications'
    : currentView) as TabId;

  return (
    <div className={`min-h-screen ${isMobile ? 'bg-white' : `bg-gradient-to-br ${themeConfig.gradient.background}`}`}>
      {/* Responsive Navigation - Adapts to screen size */}
      <ResponsiveNavigation
        activeTab={activeNavigationView}
        onTabChange={handleTabChange}
          themeColor={themeColor}
          userRole={userRole}
          userName={user || ''}
          onLogout={handleLogout}
          featureFlags={featureFlags}
          canAccessReservations={canAccessReservations}
          hideReservationsTab={userProfile?.hideReservationsTab}
          themeConfig={themeConfig}
          notificationsBadge={unreadCount}
        />

      {/* Main Content Area with Mobile Layout Wrapper */}
      <MobileLayout
        showBottomNav={isMobile}
        onRefresh={handleRefresh}
        noPadding={currentView === 'calendar'}
      >
        <div className={isMobile ? '' : 'relative'}>
          {currentView === 'calendar' && (
            <Calendar themeColor={themeColor} timeFormat={userProfile?.timeFormat || '12h'} />
          )}
          {currentView === 'tasks' && featureFlags.tasks && (
            <TasksWorkspace ref={tasksWorkspaceRef} themeColor={themeColor} />
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
          {currentView === 'admin' && userRole === 'admin' && (
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



