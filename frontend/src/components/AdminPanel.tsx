import { useState, useEffect } from 'react';
import ConfirmationDialog from './ConfirmationDialog';

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

interface AdminPanelProps {
  themeColor?: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ themeColor = '#3b82f6' }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'calendars' | 'events' | 'shares' | 'stats'>('stats');
  const [users, setUsers] = useState<User[]>([]);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [shares, setShares] = useState<CalendarShare[]>([]);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'password'>('create');
  const [modalEntity, setModalEntity] = useState<'user' | 'calendar' | 'event'>('user');
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form data
  const [formData, setFormData] = useState<any>({});

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

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

      let data;
      switch (dataType) {
        case 'users':
          data = await apiCall('/admin/users', token);
          setUsers(data);
          break;
        case 'calendars':
          data = await apiCall('/admin/calendars', token);
          setCalendars(data);
          break;
        case 'events':
          data = await apiCall('/admin/events', token);
          setEvents(data);
          break;
        case 'shares':
          data = await apiCall('/admin/calendar-shares', token);
          setShares(data);
          break;
        case 'stats':
          data = await apiCall('/admin/stats', token);
          setStats(data);
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

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  // CRUD Operations
  const handleCreate = async (entityType: 'user' | 'calendar' | 'event', data: any) => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      await apiCall(`/admin/${entityType}s`, token, 'POST', data);
      await loadData(entityType + 's');
      setShowModal(false);
      setFormData({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item');
    }
  };

  const handleUpdate = async (entityType: 'user' | 'calendar' | 'event', id: number, data: any) => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      await apiCall(`/admin/${entityType}s/${id}`, token, 'PATCH', data);
      await loadData(entityType + 's');
      setShowModal(false);
      setFormData({});
      setEditingItem(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
    }
  };

  const handleDelete = (entityType: 'user' | 'calendar' | 'event', id: number) => {
    // Get the item details for a more specific confirmation message
    let itemName = '';
    let item: any = null;

    if (entityType === 'user') {
      item = users.find(u => u.id === id);
      itemName = item ? `${item.username} (${item.email})` : 'this user';
    } else if (entityType === 'calendar') {
      item = calendars.find(c => c.id === id);
      itemName = item ? item.name : 'this calendar';
    } else if (entityType === 'event') {
      item = events.find(e => e.id === id);
      itemName = item ? item.title : 'this event';
    }

    setConfirmDialog({
      isOpen: true,
      title: `Delete ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`,
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone and may affect other related data.`,
      confirmText: `Delete ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('admin_token');
          if (!token) {
            setConfirmDialog({ ...confirmDialog, isOpen: false });
            return;
          }

          await apiCall(`/admin/${entityType}s/${id}`, token, 'DELETE');
          await loadData(entityType + 's');
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (err) {
          setError(err instanceof Error ? err.message : `Failed to delete ${entityType}`);
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      }
    });
  };

  const handleUpdateUserRole = async (userId: number, role: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      await apiCall(`/admin/users/${userId}/role`, token, 'PATCH', { role });
      await loadData('users');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user role');
    }
  };

  const handleChangePassword = async (userId: number, password: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      await apiCall(`/admin/users/${userId}/password`, token, 'PATCH', { password });
      setShowModal(false);
      setFormData({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    }
  };

  // Modal handlers
  const openCreateModal = (entityType: 'user' | 'calendar' | 'event') => {
    setModalType('create');
    setModalEntity(entityType);
    setFormData({});
    setShowModal(true);
  };

  const openEditModal = (entityType: 'user' | 'calendar' | 'event', item: any) => {
    setModalType('edit');
    setModalEntity(entityType);
    setEditingItem(item);
    setFormData({ ...item });
    setShowModal(true);
  };

  const openPasswordModal = (user: User) => {
    setModalType('password');
    setModalEntity('user');
    setEditingItem(user);
    setFormData({ password: '' });
    setShowModal(true);
  };

  // Render functions
  const renderStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <button
        onClick={() => setActiveTab('users')}
        className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
      >
        <h3 className="text-lg font-semibold text-blue-800 mb-2 flex items-center gap-2">
          👥 Users
        </h3>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-blue-900">{stats?.users.total || 0}</p>
          <p className="text-sm text-blue-600">Total Users</p>
          <p className="text-sm text-blue-600">Active: {stats?.users.active || 0}</p>
          <p className="text-sm text-blue-600">Admins: {stats?.users.admins || 0}</p>
        </div>
      </button>

      <button
        onClick={() => setActiveTab('calendars')}
        className="bg-green-50 border border-green-200 rounded-lg p-6 text-left hover:bg-green-100 hover:border-green-300 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
      >
        <h3 className="text-lg font-semibold text-green-800 mb-2 flex items-center gap-2">
          📅 Calendars
        </h3>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-green-900">{stats?.calendars.total || 0}</p>
          <p className="text-sm text-green-600">Total Calendars</p>
        </div>
      </button>

      <button
        onClick={() => setActiveTab('events')}
        className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-left hover:bg-yellow-100 hover:border-yellow-300 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
      >
        <h3 className="text-lg font-semibold text-yellow-800 mb-2 flex items-center gap-2">
          ✨ Events
        </h3>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-yellow-900">{stats?.events.total || 0}</p>
          <p className="text-sm text-yellow-600">Total Events</p>
        </div>
      </button>

      <button
        onClick={() => setActiveTab('shares')}
        className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-left hover:bg-purple-100 hover:border-purple-300 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
      >
        <h3 className="text-lg font-semibold text-purple-800 mb-2 flex items-center gap-2">
          🤝 Shares
        </h3>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-purple-900">{stats?.shares.total || 0}</p>
          <p className="text-sm text-purple-600">Total Shares</p>
        </div>
      </button>

      {stats && (
        <div className="md:col-span-2 lg:col-span-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            Last updated: {formatDate(stats.lastUpdated)}
          </p>
        </div>
      )}
    </div>
  );

  const renderUsers = () => (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h3 className="text-xl font-medium text-gray-800">Users Management</h3>
        <button
          onClick={() => openCreateModal('user')}
          className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-all duration-200 flex items-center gap-2"
        >
          ➕ Add User
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-blue-200 rounded-2xl overflow-hidden shadow-sm">
          <thead className="bg-gradient-to-r from-blue-100 to-indigo-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-blue-200">ID</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-blue-200">Username</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-blue-200">Email</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-blue-200">Name</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-blue-200">Role</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-blue-200">Active</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-blue-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-blue-50 transition-all duration-200">
                <td className="px-6 py-4 border-b border-blue-100 text-sm text-gray-700">{user.id}</td>
                <td className="px-6 py-4 border-b border-blue-100 text-sm text-gray-900 font-medium">{user.username}</td>
                <td className="px-6 py-4 border-b border-blue-100 text-sm text-gray-700">{user.email}</td>
                <td className="px-6 py-4 border-b border-blue-100 text-sm text-gray-700">{user.firstName} {user.lastName}</td>
                <td className="px-6 py-4 border-b border-blue-100 text-sm">
                  <select
                    value={user.role}
                    onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                    className="text-xs px-3 py-2 bg-white border border-blue-300 text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="observer">Observer</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4 border-b border-blue-100 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    user.isActive ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'
                  }`}>
                    {user.isActive ? '✅ Active' : '❌ Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 border-b border-blue-100 text-sm">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal('user', user)}
                      className="text-xs px-3 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-all duration-200 hover:scale-105 shadow-sm"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => openPasswordModal(user)}
                      className="text-xs px-3 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all duration-200 hover:scale-105 shadow-sm"
                    >
                      🔒 Password
                    </button>
                    <button
                      onClick={() => handleDelete('user', user.id)}
                      className="text-xs px-3 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 hover:scale-105 shadow-sm"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCalendars = () => (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h3 className="text-xl font-medium text-gray-800">Calendars Management</h3>
        <button
          onClick={() => openCreateModal('calendar')}
          className="bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 transition-all duration-200 flex items-center gap-2"
        >
          ➕ Add Calendar
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-green-200 rounded-2xl overflow-hidden shadow-sm">
          <thead className="bg-gradient-to-r from-green-100 to-emerald-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-green-200">ID</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-green-200">Name</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-green-200">Description</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-green-200">Owner</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-green-200">Color</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-green-200">Visibility</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-green-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {calendars.map((calendar) => (
              <tr key={calendar.id} className="hover:bg-green-50 transition-all duration-200">
                <td className="px-6 py-4 border-b border-green-100 text-sm text-gray-700">{calendar.id}</td>
                <td className="px-6 py-4 border-b border-green-100 text-sm text-gray-900 font-medium">{calendar.name}</td>
                <td className="px-6 py-4 border-b border-green-100 text-sm text-gray-700">{calendar.description || 'N/A'}</td>
                <td className="px-6 py-4 border-b border-green-100 text-sm text-gray-700">{calendar.owner?.username}</td>
                <td className="px-6 py-4 border-b border-green-100 text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full border border-gray-300"
                      style={{ backgroundColor: calendar.color }}
                    ></div>
                    {calendar.color}
                  </div>
                </td>
                <td className="px-6 py-4 border-b border-green-100 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    calendar.visibility === 'public' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-yellow-100 text-yellow-700 border-yellow-300'
                  }`}>
                    {calendar.visibility === 'public' ? '🌐 Public' : '🔒 Private'}
                  </span>
                </td>
                <td className="px-6 py-4 border-b border-green-100 text-sm">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal('calendar', calendar)}
                      className="text-xs px-3 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-all duration-200 hover:scale-105 shadow-sm"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete('calendar', calendar.id)}
                      className="text-xs px-3 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 hover:scale-105 shadow-sm"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderEvents = () => (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h3 className="text-xl font-medium text-gray-800">Events Management</h3>
        <button
          onClick={() => openCreateModal('event')}
          className="bg-yellow-500 text-white px-4 py-2 rounded-xl hover:bg-yellow-600 transition-all duration-200 flex items-center gap-2"
        >
          ➕ Add Event
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-yellow-200 rounded-2xl overflow-hidden shadow-sm">
          <thead className="bg-gradient-to-r from-yellow-100 to-amber-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-yellow-200">ID</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-yellow-200">Title</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-yellow-200">Calendar</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-yellow-200">Start Date</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-yellow-200">End Date</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-yellow-200">All Day</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-yellow-200">Created By</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-yellow-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-yellow-50 transition-all duration-200">
                <td className="px-6 py-4 border-b border-yellow-100 text-sm text-gray-700">{event.id}</td>
                <td className="px-6 py-4 border-b border-yellow-100 text-sm text-gray-900 font-medium">{event.title}</td>
                <td className="px-6 py-4 border-b border-yellow-100 text-sm text-gray-700">{event.calendar?.name}</td>
                <td className="px-6 py-4 border-b border-yellow-100 text-sm text-gray-700">{formatDate(event.startDate)}</td>
                <td className="px-6 py-4 border-b border-yellow-100 text-sm text-gray-700">{event.endDate ? formatDate(event.endDate) : 'N/A'}</td>
                <td className="px-6 py-4 border-b border-yellow-100 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    event.isAllDay ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-100 text-gray-700 border-gray-300'
                  }`}>
                    {event.isAllDay ? '📅 All Day' : '⏰ Timed'}
                  </span>
                </td>
                <td className="px-6 py-4 border-b border-yellow-100 text-sm text-gray-700">{event.createdBy?.username}</td>
                <td className="px-6 py-4 border-b border-yellow-100 text-sm">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal('event', event)}
                      className="text-xs px-3 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-all duration-200 hover:scale-105 shadow-sm"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete('event', event.id)}
                      className="text-xs px-3 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 hover:scale-105 shadow-sm"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderModal = () => {
    if (!showModal) return null;

    const isCreate = modalType === 'create';
    const isPassword = modalType === 'password';

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            {isPassword ? `Change Password for ${editingItem?.username}` :
             `${isCreate ? 'Create' : 'Edit'} ${modalEntity.charAt(0).toUpperCase() + modalEntity.slice(1)}`}
          </h2>

          {isPassword ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Enter new password"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleChangePassword(editingItem.id, formData.password)}
                  className="flex-1 bg-purple-500 text-white py-3 rounded-xl hover:bg-purple-600 transition-all"
                  disabled={!formData.password}
                >
                  Change Password
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-xl hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : modalEntity === 'user' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={formData.username || ''}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              {isCreate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName || ''}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={formData.role || 'user'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="observer">Observer</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive !== false}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => isCreate ? handleCreate('user', formData) : handleUpdate('user', editingItem.id, formData)}
                  className="flex-1 bg-blue-500 text-white py-3 rounded-xl hover:bg-blue-600 transition-all"
                >
                  {isCreate ? 'Create User' : 'Update User'}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-xl hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : modalEntity === 'calendar' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <input
                  type="color"
                  value={formData.color || '#3B82F6'}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
                <select
                  value={formData.visibility || 'private'}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
              </div>
              {isCreate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Owner ID</label>
                  <input
                    type="number"
                    value={formData.ownerId || ''}
                    onChange={(e) => setFormData({ ...formData, ownerId: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="User ID who owns this calendar"
                  />
                </div>
              )}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="calendarIsActive"
                  checked={formData.isActive !== false}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="calendarIsActive" className="text-sm font-medium text-gray-700">Active</label>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => isCreate ? handleCreate('calendar', formData) : handleUpdate('calendar', editingItem.id, formData)}
                  className="flex-1 bg-green-500 text-white py-3 rounded-xl hover:bg-green-600 transition-all"
                >
                  {isCreate ? 'Create Calendar' : 'Update Calendar'}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-xl hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : modalEntity === 'event' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="datetime-local"
                    value={formData.startDate ? new Date(formData.startDate).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="datetime-local"
                    value={formData.endDate ? new Date(formData.endDate).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <input
                  type="color"
                  value={formData.color || '#EAB308'}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none"
                />
              </div>
              {isCreate && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Calendar ID</label>
                    <input
                      type="number"
                      value={formData.calendarId || ''}
                      onChange={(e) => setFormData({ ...formData, calendarId: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none"
                      placeholder="Calendar ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Created By ID</label>
                    <input
                      type="number"
                      value={formData.createdById || ''}
                      onChange={(e) => setFormData({ ...formData, createdById: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none"
                      placeholder="User ID"
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="eventIsAllDay"
                  checked={formData.isAllDay || false}
                  onChange={(e) => setFormData({ ...formData, isAllDay: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="eventIsAllDay" className="text-sm font-medium text-gray-700">All Day Event</label>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => isCreate ? handleCreate('event', formData) : handleUpdate('event', editingItem.id, formData)}
                  className="flex-1 bg-yellow-500 text-white py-3 rounded-xl hover:bg-yellow-600 transition-all"
                >
                  {isCreate ? 'Create Event' : 'Update Event'}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-xl hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-blue-200 relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-300 to-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-indigo-300 to-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-r from-purple-300 to-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 p-8">
        <div className="mb-10">
          <h1 className="text-5xl font-thin mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">⚙️ Admin Panel</h1>
          <p className="text-gray-700 text-xl font-light">Manage and monitor your beautiful calendar application</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex flex-wrap gap-2 p-2 bg-white/70 border border-blue-200 rounded-3xl backdrop-blur-md">
            {[
              { key: 'stats', label: 'Statistics', icon: '📊' },
              { key: 'users', label: 'Users', icon: '👥' },
              { key: 'calendars', label: 'Calendars', icon: '📅' },
              { key: 'events', label: 'Events', icon: '✨' },
              { key: 'shares', label: 'Shares', icon: '🤝' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-6 py-3 rounded-2xl font-medium text-sm transition-all duration-300 flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'bg-blue-500 text-white shadow-lg scale-105'
                    : 'text-blue-700 hover:text-blue-800 hover:bg-blue-100 hover:scale-105'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="min-h-96 bg-white/70 border border-blue-200 rounded-3xl p-8 backdrop-blur-md">
          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="text-xl text-gray-700 animate-pulse flex items-center gap-3">
                <div className="animate-spin w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full"></div>
                Loading...
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-6 py-4 rounded-2xl mb-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                {error}
                <button
                  onClick={() => setError('')}
                  className="ml-auto text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {!loading && !error && (
            <>
              {activeTab === 'stats' && renderStats()}
              {activeTab === 'users' && renderUsers()}
              {activeTab === 'calendars' && renderCalendars()}
              {activeTab === 'events' && renderEvents()}
              {activeTab === 'shares' && (
                <div className="text-center py-12">
                  <p className="text-xl text-gray-600">
                    Calendar Shares management coming soon...
                  </p>
                  <p className="text-sm text-gray-500 mt-2">Full CRUD operations for this entity are being implemented</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {renderModal()}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        themeColor={themeColor}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};

export default AdminPanel;