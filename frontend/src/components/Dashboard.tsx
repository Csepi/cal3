import { useState, useEffect } from 'react';
import Login from './Login';
import Calendar from './Calendar';
import AdminPanel from './AdminPanel';
import UserProfile from './UserProfile';
import { apiService } from '../services/api';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('user');
  const [currentView, setCurrentView] = useState<'calendar' | 'admin' | 'profile'>('calendar');
  const [themeColor, setThemeColor] = useState<string>('#3b82f6');
  const [userProfile, setUserProfile] = useState<any>(null);

  const handleLogin = (username: string, token?: string, role?: string, userData?: any) => {
    setUser(username);
    setUserRole(role || 'user');
    if (userData && userData.themeColor) {
      setThemeColor(userData.themeColor);
    }
    loadUserProfile();
  };

  const handleLogout = () => {
    setUser(null);
    setUserRole('user');
    setCurrentView('calendar');
    setThemeColor('#3b82f6');
    setUserProfile(null);
    localStorage.removeItem('admin_token');
    apiService.logout();
  };

  const loadUserProfile = async () => {
    try {
      const profile = await apiService.getUserProfile();
      setUserProfile(profile);
      if (profile.themeColor) {
        setThemeColor(profile.themeColor);
      }
    } catch (err) {
      console.warn('Could not load user profile:', err);
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setThemeColor(newTheme);
  };

  // Load user profile on component mount if logged in
  useEffect(() => {
    if (user && apiService.isAuthenticated()) {
      loadUserProfile();
    }
  }, [user]);

  // Helper function to get theme-based colors
  const getThemeColors = (color: string) => {
    // Simple theme color mapping - in a real app you'd use a more sophisticated color system
    const colorMap: Record<string, any> = {
      '#3b82f6': { // Blue
        primary: 'bg-blue-500 hover:bg-blue-600',
        secondary: 'bg-blue-100 border-blue-200 text-blue-700',
        accent: 'text-blue-600',
        gradient: 'from-blue-50 via-blue-100 to-blue-200'
      },
      '#8b5cf6': { // Purple
        primary: 'bg-purple-500 hover:bg-purple-600',
        secondary: 'bg-purple-100 border-purple-200 text-purple-700',
        accent: 'text-purple-600',
        gradient: 'from-purple-50 via-purple-100 to-purple-200'
      },
      '#10b981': { // Green
        primary: 'bg-green-500 hover:bg-green-600',
        secondary: 'bg-green-100 border-green-200 text-green-700',
        accent: 'text-green-600',
        gradient: 'from-green-50 via-green-100 to-green-200'
      },
      '#ef4444': { // Red
        primary: 'bg-red-500 hover:bg-red-600',
        secondary: 'bg-red-100 border-red-200 text-red-700',
        accent: 'text-red-600',
        gradient: 'from-red-50 via-red-100 to-red-200'
      },
      '#f59e0b': { // Orange
        primary: 'bg-orange-500 hover:bg-orange-600',
        secondary: 'bg-orange-100 border-orange-200 text-orange-700',
        accent: 'text-orange-600',
        gradient: 'from-orange-50 via-orange-100 to-orange-200'
      },
      '#ec4899': { // Pink
        primary: 'bg-pink-500 hover:bg-pink-600',
        secondary: 'bg-pink-100 border-pink-200 text-pink-700',
        accent: 'text-pink-600',
        gradient: 'from-pink-50 via-pink-100 to-pink-200'
      },
      '#6366f1': { // Indigo
        primary: 'bg-indigo-500 hover:bg-indigo-600',
        secondary: 'bg-indigo-100 border-indigo-200 text-indigo-700',
        accent: 'text-indigo-600',
        gradient: 'from-indigo-50 via-indigo-100 to-indigo-200'
      },
      '#14b8a6': { // Teal
        primary: 'bg-teal-500 hover:bg-teal-600',
        secondary: 'bg-teal-100 border-teal-200 text-teal-700',
        accent: 'text-teal-600',
        gradient: 'from-teal-50 via-teal-100 to-teal-200'
      }
    };

    return colorMap[color] || colorMap['#3b82f6']; // Default to blue
  };

  const themeColors = getThemeColors(themeColor);

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen">
      {/* User Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="text-gray-800">
              <span className="text-sm text-gray-600">Welcome,</span>
              <span className={`ml-2 text-lg font-medium ${themeColors.accent}`}>{user}</span>
              {userRole === 'admin' && (
                <span className="ml-3 px-3 py-1 bg-red-100 border border-red-300 text-red-700 text-xs rounded-full font-medium">🔥 Admin</span>
              )}
            </div>

            {/* Navigation buttons */}
            <div className={`flex space-x-1 ${themeColors.secondary} rounded-2xl p-1 border`}>
              <button
                onClick={() => setCurrentView('calendar')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  currentView === 'calendar'
                    ? `${themeColors.primary} text-white shadow-lg`
                    : `${themeColors.accent} hover:bg-white/50`
                }`}
              >
                📅 Calendar
              </button>
              <button
                onClick={() => setCurrentView('profile')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  currentView === 'profile'
                    ? `${themeColors.primary} text-white shadow-lg`
                    : `${themeColors.accent} hover:bg-white/50`
                }`}
              >
                👤 Profile
              </button>
              {userRole === 'admin' && (
                <button
                  onClick={() => setCurrentView('admin')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    currentView === 'admin'
                      ? 'bg-indigo-500 text-white shadow-lg'
                      : 'text-indigo-700 hover:text-indigo-800 hover:bg-indigo-200'
                  }`}
                >
                  ⚙️ Admin Panel
                </button>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 border border-red-400 text-white rounded-2xl hover:bg-red-600 font-medium transition-all duration-300 hover:scale-105 shadow-md"
          >
            🚀 Sign Out
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative">
        {currentView === 'calendar' && <Calendar themeColor={themeColor} />}
        {currentView === 'profile' && (
          <UserProfile onThemeChange={handleThemeChange} currentTheme={themeColor} />
        )}
        {currentView === 'admin' && userRole === 'admin' && <AdminPanel />}
      </div>
    </div>
  );
};

export default Dashboard;