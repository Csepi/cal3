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
    <div className="min-h-screen">
      {/* User Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-blue-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="text-gray-800">
              <span className="text-sm text-gray-600">Welcome,</span>
              <span className="ml-2 text-lg font-medium text-blue-600">{user}</span>
              {userRole === 'admin' && (
                <span className="ml-3 px-3 py-1 bg-red-100 border border-red-300 text-red-700 text-xs rounded-full font-medium">🔥 Admin</span>
              )}
            </div>
            {userRole === 'admin' && (
              <div className="flex space-x-1 bg-blue-100 rounded-2xl p-1 border border-blue-200">
                <button
                  onClick={() => setCurrentView('calendar')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    currentView === 'calendar'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'text-blue-700 hover:text-blue-800 hover:bg-blue-200'
                  }`}
                >
                  📅 Calendar
                </button>
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
              </div>
            )}
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
        {currentView === 'calendar' ? <Calendar /> : <AdminPanel />}
      </div>
    </div>
  );
};

export default Dashboard;