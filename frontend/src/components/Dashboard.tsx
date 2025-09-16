import { useState } from 'react';
import Login from './Login';
import Calendar from './Calendar';
import AdminPanel from './AdminPanel';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('user');
  const [currentView, setCurrentView] = useState<'calendar' | 'admin'>('calendar');

  const handleLogin = (username: string, _token?: string, role?: string) => {
    setUser(username);
    setUserRole(role || 'user');
  };

  const handleLogout = () => {
    setUser(null);
    setUserRole('user');
    setCurrentView('calendar');
    localStorage.removeItem('admin_token');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div>
      {/* User Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Welcome, <span className="font-semibold text-gray-800">{user}</span>
              {userRole === 'admin' && (
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Admin</span>
              )}
            </div>
            {userRole === 'admin' && (
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentView('calendar')}
                  className={`text-sm font-medium transition-colors ${
                    currentView === 'calendar'
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-700'
                  }`}
                >
                  Calendar
                </button>
                <button
                  onClick={() => setCurrentView('admin')}
                  className={`text-sm font-medium transition-colors ${
                    currentView === 'admin'
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-700'
                  }`}
                >
                  Admin Panel
                </button>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Content */}
      {currentView === 'calendar' ? <Calendar /> : <AdminPanel />}
    </div>
  );
};

export default Dashboard;