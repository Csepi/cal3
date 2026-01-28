import { useState, useEffect } from 'react';
import { UserPermissionsService } from '../services/userPermissions';
import { BASE_URL } from '../config/apiConfig';
import { secureFetch } from '../services/authErrorHandler';
import OrganisationUserManagement from './OrganisationUserManagement';

interface Organisation {
  id: number;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  users?: any[];
  resourceTypes?: any[];
}

interface OrganisationManagementProps {
  themeColor?: string;
}

const OrganisationManagement: React.FC<OrganisationManagementProps> = ({ themeColor = '#3b82f6' }) => {
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organisation | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: ''
  });

  // User permissions state
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  useEffect(() => {
    loadUserPermissions();
  }, []);

  useEffect(() => {
    if (!permissionsLoading) {
      loadOrganisations();
    }
  }, [permissionsLoading, isSuperAdmin]);

  const loadUserPermissions = async () => {
    try {
      const permissions = await UserPermissionsService.getUserPermissions();
      setIsSuperAdmin(permissions.isSuperAdmin);
    } catch (err) {
      console.error('Failed to load permissions:', err);
      setIsSuperAdmin(false);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const loadOrganisations = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await secureFetch(`${BASE_URL}/api/organisations?t=${Date.now()}`, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) throw new Error('Failed to load organisations');
      const data = await response.json();
      setOrganisations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organisations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await secureFetch(`${BASE_URL}/api/organisations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to create organisation');

      await loadOrganisations();
      setShowModal(false);
      setFormData({ name: '', description: '', address: '', phone: '', email: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organisation');
    }
  };

  const handleUpdate = async () => {
    if (!editingOrg) return;

    try {
      const response = await secureFetch(`${BASE_URL}/api/organisations/${editingOrg.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to update organisation');

      await loadOrganisations();
      setShowModal(false);
      setEditingOrg(null);
      setFormData({ name: '', description: '', address: '', phone: '', email: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update organisation');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this organisation?')) return;

    try {
      const response = await secureFetch(`${BASE_URL}/api/organisations/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to delete organisation');
      await loadOrganisations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete organisation');
    }
  };

  const openCreateModal = () => {
    setEditingOrg(null);
    setFormData({ name: '', description: '', address: '', phone: '', email: '' });
    setShowModal(true);
  };

  const openEditModal = (org: Organisation) => {
    setEditingOrg(org);
    setFormData({
      name: org.name,
      description: org.description || '',
      address: org.address || '',
      phone: org.phone || '',
      email: org.email || ''
    });
    setShowModal(true);
  };

  // Show loading state while permissions are being checked
  if (permissionsLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading permissions...</span>
      </div>
    );
  }

  // Show organization user management for non-super-admin users
  if (!isSuperAdmin) {
    return <OrganisationUserManagement themeColor={themeColor} />;
  }

  // Show organization CRUD for super admins
  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h3 className="text-xl font-medium text-gray-800">Organisations (Admin)</h3>
        <button
          onClick={openCreateModal}
          className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-all duration-200 flex items-center gap-2"
        >
          ➕ Add Organisation
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-2xl mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-blue-300 border-t-blue-600 rounded-full mx-auto"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-blue-200 rounded-2xl overflow-hidden shadow-sm">
            <thead className="bg-gradient-to-r from-blue-100 to-indigo-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-blue-200">ID</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-blue-200">Name</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-blue-200">Email</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-blue-200">Phone</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-blue-200">Address</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-blue-200">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-blue-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {organisations.map((org) => (
                <tr key={org.id} className="hover:bg-blue-50 transition-all duration-200">
                  <td className="px-6 py-4 border-b border-blue-100 text-sm text-gray-700">{org.id}</td>
                  <td className="px-6 py-4 border-b border-blue-100 text-sm text-gray-900 font-medium">{org.name}</td>
                  <td className="px-6 py-4 border-b border-blue-100 text-sm text-gray-700">{org.email || 'N/A'}</td>
                  <td className="px-6 py-4 border-b border-blue-100 text-sm text-gray-700">{org.phone || 'N/A'}</td>
                  <td className="px-6 py-4 border-b border-blue-100 text-sm text-gray-700">{org.address || 'N/A'}</td>
                  <td className="px-6 py-4 border-b border-blue-100 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      org.isActive ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'
                    }`}>
                      {org.isActive ? '✅ Active' : '❌ Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 border-b border-blue-100 text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(org)}
                        className="text-xs px-3 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-all duration-200"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(org.id)}
                        className="text-xs px-3 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {organisations.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No organisations found. Create one to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              {editingOrg ? 'Edit Organisation' : 'Create Organisation'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={editingOrg ? handleUpdate : handleCreate}
                  className="flex-1 bg-blue-500 text-white py-3 rounded-xl hover:bg-blue-600 transition-all"
                  disabled={!formData.name}
                >
                  {editingOrg ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-xl hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganisationManagement;
