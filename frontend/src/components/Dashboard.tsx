import { useState, useEffect } from 'react';
import Login from './Login';
import Calendar from './Calendar';
import AdminPanel from './AdminPanel';
import UserProfile from './UserProfile';
import CalendarSync from './CalendarSync';
import { apiService } from '../services/api';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('user');
  const [currentView, setCurrentView] = useState<'calendar' | 'admin' | 'profile' | 'sync'>('calendar');
  const [themeColor, setThemeColor] = useState<string>('#3b82f6');
  const [userProfile, setUserProfile] = useState<any>(null);

  const handleLogin = (username: string, token?: string, role?: string, userData?: any) => {
    setUser(username);
    setUserRole(role || 'user');

    // Store authentication data in localStorage for persistence
    localStorage.setItem('username', username);
    localStorage.setItem('userRole', role || 'user');
    if (token) {
      localStorage.setItem('authToken', token);
      // Note: apiService automatically reads token from localStorage in getAuthHeaders()
    }

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

    // Clear all authentication data from localStorage
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    localStorage.removeItem('authToken');
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

  // Initialize authentication state from localStorage on component mount
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedRole = localStorage.getItem('userRole');
    const authToken = localStorage.getItem('authToken');

    if (storedUsername && authToken) {
      setUser(storedUsername);
      setUserRole(storedRole || 'user');
      // Note: apiService automatically reads token from localStorage in getAuthHeaders()
    }
  }, []);

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
      },
      '#eab308': { // Yellow
        primary: 'bg-yellow-500 hover:bg-yellow-600',
        secondary: 'bg-yellow-100 border-yellow-200 text-yellow-700',
        accent: 'text-yellow-600',
        gradient: 'from-yellow-50 via-yellow-100 to-yellow-200'
      },
      '#22c55e': { // Emerald
        primary: 'bg-emerald-500 hover:bg-emerald-600',
        secondary: 'bg-emerald-100 border-emerald-200 text-emerald-700',
        accent: 'text-emerald-600',
        gradient: 'from-emerald-50 via-emerald-100 to-emerald-200'
      },
      '#06b6d4': { // Cyan
        primary: 'bg-cyan-500 hover:bg-cyan-600',
        secondary: 'bg-cyan-100 border-cyan-200 text-cyan-700',
        accent: 'text-cyan-600',
        gradient: 'from-cyan-50 via-cyan-100 to-cyan-200'
      },
      '#0ea5e9': { // Sky
        primary: 'bg-sky-500 hover:bg-sky-600',
        secondary: 'bg-sky-100 border-sky-200 text-sky-700',
        accent: 'text-sky-600',
        gradient: 'from-sky-50 via-sky-100 to-sky-200'
      },
      '#84cc16': { // Lime
        primary: 'bg-lime-500 hover:bg-lime-600',
        secondary: 'bg-lime-100 border-lime-200 text-lime-700',
        accent: 'text-lime-600',
        gradient: 'from-lime-50 via-lime-100 to-lime-200'
      },
      '#7c3aed': { // Violet
        primary: 'bg-violet-500 hover:bg-violet-600',
        secondary: 'bg-violet-100 border-violet-200 text-violet-700',
        accent: 'text-violet-600',
        gradient: 'from-violet-50 via-violet-100 to-violet-200'
      },
      '#f43f5e': { // Rose
        primary: 'bg-rose-500 hover:bg-rose-600',
        secondary: 'bg-rose-100 border-rose-200 text-rose-700',
        accent: 'text-rose-600',
        gradient: 'from-rose-50 via-rose-100 to-rose-200'
      },
      '#64748b': { // Slate
        primary: 'bg-slate-500 hover:bg-slate-600',
        secondary: 'bg-slate-100 border-slate-200 text-slate-700',
        accent: 'text-slate-600',
        gradient: 'from-slate-50 via-slate-100 to-slate-200'
      }
    };

    return colorMap[color] || colorMap['#3b82f6']; // Default to blue
  };

  const themeColors = getThemeColors(themeColor);

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeColors.gradient}`}>
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
              <button
                onClick={() => setCurrentView('sync')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  currentView === 'sync'
                    ? `${themeColors.primary} text-white shadow-lg`
                    : `${themeColors.accent} hover:bg-white/50`
                }`}
              >
                🔄 Calendar Sync
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
        {currentView === 'sync' && <CalendarSync themeColor={themeColor} />}
        {currentView === 'admin' && userRole === 'admin' && <AdminPanel themeColor={themeColor} />}
      </div>
    </div>
  );
};

export default Dashboard;