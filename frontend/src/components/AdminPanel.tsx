import { useState, useEffect } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Calendar {
  id: number;
  name: string;
  description?: string;
  color: string;
  visibility: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  owner: User;
}

interface Event {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  startTime?: string;
  endDate: string;
  endTime?: string;
  isAllDay: boolean;
  location?: string;
  color: string;
  calendar: Calendar;
  createdBy: User;
}

interface CalendarShare {
  id: number;
  permission: string;
  sharedAt: string;
  calendar: Calendar;
  user: User;
}

interface DatabaseStats {
  users: { total: number; active: number; admins: number };
  calendars: { total: number };
  events: { total: number };
  shares: { total: number };
  lastUpdated: string;
}

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'calendars' | 'events' | 'shares' | 'stats'>('stats');
  const [users, setUsers] = useState<User[]>([]);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [shares, setShares] = useState<CalendarShare[]>([]);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const apiCall = async (endpoint: string, token: string, method: string = 'GET', data?: any) => {
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`http://localhost:8081/api${endpoint}`, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to ${method} ${endpoint}: ${response.statusText}`);
    }

    return response.json();
  };

  const loadData = async (dataType: string) => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        setError('No admin token found. Please login as admin.');
        return;
      }

      switch (dataType) {
        case 'users':
          const usersData = await apiCall('/admin/users', token);
          setUsers(usersData);
          break;
        case 'calendars':
          const calendarsData = await apiCall('/admin/calendars', token);
          setCalendars(calendarsData);
          break;
        case 'events':
          const eventsData = await apiCall('/admin/events', token);
          setEvents(eventsData);
          break;
        case 'shares':
          const sharesData = await apiCall('/admin/calendar-shares', token);
          setShares(sharesData);
          break;
        case 'stats':
          const statsData = await apiCall('/admin/stats', token);
          setStats(statsData);
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      await apiCall(`/admin/users/${userId}`, token, 'DELETE');
      setUsers(users.filter(user => user.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleUpdateUserRole = async (userId: number, newRole: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      await apiCall(`/admin/users/${userId}/role`, token, 'PATCH', { role: newRole });
      setUsers(users.map(user => user.id === userId ? { ...user, role: newRole } : user));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user role');
    }
  };

  const handleDeleteCalendar = async (calendarId: number) => {
    if (!confirm('Are you sure you want to delete this calendar? This will also delete all events in it.')) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      await apiCall(`/admin/calendars/${calendarId}`, token, 'DELETE');
      setCalendars(calendars.filter(calendar => calendar.id !== calendarId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete calendar');
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      await apiCall(`/admin/events/${eventId}`, token, 'DELETE');
      setEvents(events.filter(event => event.id !== eventId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
    }
  };

  const renderUsers = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-900">ID</th>
            <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-900">Username</th>
            <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-900">Email</th>
            <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-900">Name</th>
            <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-900">Role</th>
            <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-900">Active</th>
            <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-900">Created</th>
            <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 border-b text-sm">{user.id}</td>
              <td className="px-4 py-2 border-b text-sm">{user.username}</td>
              <td className="px-4 py-2 border-b text-sm">{user.email}</td>
              <td className="px-4 py-2 border-b text-sm">{user.firstName} {user.lastName}</td>
              <td className="px-4 py-2 border-b text-sm">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  user.role === 'admin' ? 'bg-red-100 text-red-800' :
                  user.role === 'user' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {user.role}
                </span>
              </td>
              <td className="px-4 py-2 border-b text-sm">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-4 py-2 border-b text-sm">{formatDate(user.createdAt)}</td>
              <td className="px-4 py-2 border-b text-sm">
                <div className="flex space-x-2">
                  <select
                    value={user.role}
                    onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                    className="text-xs px-2 py-1 border border-gray-300 rounded"
                  >
                    <option value="observer">Observer</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderCalendars = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-900">ID</th>
            <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-900">Name</th>
            <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-900">Description</th>
            <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-900">Color</th>
            <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-900">Visibility</th>
            <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-900">Owner</th>
            <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-900">Created</th>
            <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody>
          {calendars.map((calendar) => (
            <tr key={calendar.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 border-b text-sm">{calendar.id}</td>
              <td className="px-4 py-2 border-b text-sm">{calendar.name}</td>
              <td className="px-4 py-2 border-b text-sm">{calendar.description || 'N/A'}</td>
              <td className="px-4 py-2 border-b text-sm">
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded mr-2"
                    style={{ backgroundColor: calendar.color }}
                  ></div>
                  {calendar.color}
                </div>
              </td>
              <td className="px-4 py-2 border-b text-sm">{calendar.visibility}</td>
              <td className="px-4 py-2 border-b text-sm">{calendar.owner?.username || 'N/A'}</td>
              <td className="px-4 py-2 border-b text-sm">{formatDate(calendar.createdAt)}</td>
              <td className="px-4 py-2 border-b text-sm">
                <button
                  onClick={() => handleDeleteCalendar(calendar.id)}
                  className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderEvents = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-900">ID</th>
            <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-900">Title</th>
            <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-900">Start Date</th>
            <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-900">End Date</th>
            <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-900">All Day</th>
            <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-900">Calendar</th>
            <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-900">Created By</th>
            <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 border-b text-sm">{event.id}</td>
              <td className="px-4 py-2 border-b text-sm">{event.title}</td>
              <td className="px-4 py-2 border-b text-sm">
                {event.startDate} {event.startTime || ''}
              </td>
              <td className="px-4 py-2 border-b text-sm">
                {event.endDate} {event.endTime || ''}
              </td>
              <td className="px-4 py-2 border-b text-sm">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  event.isAllDay ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {event.isAllDay ? 'All Day' : 'Timed'}
                </span>
              </td>
              <td className="px-4 py-2 border-b text-sm">{event.calendar?.name || 'N/A'}</td>
              <td className="px-4 py-2 border-b text-sm">{event.createdBy?.username || 'N/A'}</td>
              <td className="px-4 py-2 border-b text-sm">
                <button
                  onClick={() => handleDeleteEvent(event.id)}
                  className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderShares = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-900">ID</th>
            <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-900">Calendar</th>
            <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-900">User</th>
            <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-900">Permission</th>
            <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-900">Shared At</th>
          </tr>
        </thead>
        <tbody>
          {shares.map((share) => (
            <tr key={share.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 border-b text-sm">{share.id}</td>
              <td className="px-4 py-2 border-b text-sm">{share.calendar?.name || 'N/A'}</td>
              <td className="px-4 py-2 border-b text-sm">{share.user?.username || 'N/A'}</td>
              <td className="px-4 py-2 border-b text-sm">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  share.permission === 'admin' ? 'bg-red-100 text-red-800' :
                  share.permission === 'write' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {share.permission}
                </span>
              </td>
              <td className="px-4 py-2 border-b text-sm">{formatDate(share.sharedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Users</h3>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-blue-900">{stats?.users.total || 0}</p>
          <p className="text-sm text-blue-600">Total Users</p>
          <p className="text-sm text-blue-600">Active: {stats?.users.active || 0}</p>
          <p className="text-sm text-blue-600">Admins: {stats?.users.admins || 0}</p>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-800 mb-2">Calendars</h3>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-green-900">{stats?.calendars.total || 0}</p>
          <p className="text-sm text-green-600">Total Calendars</p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Events</h3>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-yellow-900">{stats?.events.total || 0}</p>
          <p className="text-sm text-yellow-600">Total Events</p>
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-purple-800 mb-2">Shares</h3>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-purple-900">{stats?.shares.total || 0}</p>
          <p className="text-sm text-purple-600">Total Shares</p>
        </div>
      </div>

      {stats && (
        <div className="md:col-span-2 lg:col-span-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            Last updated: {formatDate(stats.lastUpdated)}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Panel</h1>
        <p className="text-gray-600">Manage and monitor the calendar application</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { key: 'stats', label: 'Statistics' },
            { key: 'users', label: 'Users' },
            { key: 'calendars', label: 'Calendars' },
            { key: 'events', label: 'Events' },
            { key: 'shares', label: 'Shares' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-96">
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">Loading...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {activeTab === 'stats' && renderStats()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'calendars' && renderCalendars()}
            {activeTab === 'events' && renderEvents()}
            {activeTab === 'shares' && renderShares()}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;