import { useState, useEffect } from 'react';
import { BASE_URL } from '../config/apiConfig';
import { secureFetch } from '../services/authErrorHandler';
import type { ReservationOrganization } from '../types/reservation';
import type { Organization, ResourceType as DomainResourceType } from '../types';

interface ResourceType extends DomainResourceType {
  minBookingDuration?: number;
  bufferTime?: number;
  customerInfoFields?: string[];
  waitlistEnabled: boolean;
  recurringEnabled: boolean;
  isActive: boolean;
  organisation?: ReservationOrganization;
}

type Organisation = Organization;

interface ResourceTypeManagementProps {
}

const ResourceTypeManagement: React.FC<ResourceTypeManagementProps> = () => {
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<ResourceType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    minBookingDuration: 30,
    bufferTime: 0,
    customerInfoFields: [] as string[],
    waitlistEnabled: false,
    recurringEnabled: false,
    organisationId: 0
  });

  useEffect(() => {
    loadResourceTypes();
    loadOrganisations();
  }, []);

  const loadResourceTypes = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await secureFetch(`${BASE_URL}/api/resource-types`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to load resource types');
      const data = (await response.json()) as ResourceType[];
      setResourceTypes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load resource types');
    } finally {
      setLoading(false);
    }
  };

  const loadOrganisations = async () => {
    try {
      const response = await secureFetch(`${BASE_URL}/api/organisations`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to load organisations');
      const data = (await response.json()) as Organisation[];
      setOrganisations(data);
    } catch (err) {
      console.error('Failed to load organisations:', err);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await secureFetch(`${BASE_URL}/api/resource-types`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to create resource type');

      await loadResourceTypes();
      setShowModal(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create resource type');
    }
  };

  const handleUpdate = async () => {
    if (!editingType) return;

    try {
      const { organisationId, ...updateData } = formData;
      const response = await secureFetch(`${BASE_URL}/api/resource-types/${editingType.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) throw new Error('Failed to update resource type');

      await loadResourceTypes();
      setShowModal(false);
      setEditingType(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update resource type');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this resource type?')) return;

    try {
      const response = await secureFetch(`${BASE_URL}/api/resource-types/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to delete resource type');
      await loadResourceTypes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete resource type');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      minBookingDuration: 30,
      bufferTime: 0,
      customerInfoFields: [],
      waitlistEnabled: false,
      recurringEnabled: false,
      organisationId: 0
    });
  };

  const openCreateModal = () => {
    setEditingType(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (type: ResourceType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      description: type.description || '',
      minBookingDuration: type.minBookingDuration || 30,
      bufferTime: type.bufferTime || 0,
      customerInfoFields: type.customerInfoFields || [],
      waitlistEnabled: type.waitlistEnabled,
      recurringEnabled: type.recurringEnabled,
      organisationId: type.organisation?.id || 0
    });
    setShowModal(true);
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h3 className="text-xl font-medium text-gray-800">Resource Types</h3>
        <button
          onClick={openCreateModal}
          className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-all duration-200 flex items-center gap-2"
        >
          ➕ Add Resource Type
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
            <thead className="bg-gradient-to-r from-purple-100 to-pink-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-purple-200">ID</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-purple-200">Name</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-purple-200">Organisation</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-purple-200">Min Duration</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-purple-200">Buffer Time</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-purple-200">Features</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-purple-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {resourceTypes.map((type) => (
                <tr key={type.id} className="hover:bg-purple-50 transition-all duration-200">
                  <td className="px-6 py-4 border-b border-purple-100 text-sm text-gray-700">{type.id}</td>
                  <td className="px-6 py-4 border-b border-purple-100 text-sm text-gray-900 font-medium">{type.name}</td>
                  <td className="px-6 py-4 border-b border-purple-100 text-sm text-gray-700">{type.organisation?.name || 'N/A'}</td>
                  <td className="px-6 py-4 border-b border-purple-100 text-sm text-gray-700">{type.minBookingDuration || '-'} min</td>
                  <td className="px-6 py-4 border-b border-purple-100 text-sm text-gray-700">{type.bufferTime || '-'} min</td>
                  <td className="px-6 py-4 border-b border-purple-100 text-sm">
                    <div className="flex gap-1">
                      {type.waitlistEnabled && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Waitlist</span>
                      )}
                      {type.recurringEnabled && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Recurring</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 border-b border-purple-100 text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(type)}
                        className="text-xs px-3 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-all duration-200"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(type.id)}
                        className="text-xs px-3 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {resourceTypes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No resource types found. Create one to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              {editingType ? 'Edit Resource Type' : 'Create Resource Type'}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Organisation *</label>
                  <select
                    value={formData.organisationId}
                    onChange={(e) => setFormData({ ...formData, organisationId: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                    disabled={!!editingType}
                  >
                    <option value={0}>Select Organisation</option>
                    {organisations.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Booking Duration (minutes)</label>
                  <input
                    type="number"
                    value={formData.minBookingDuration}
                    onChange={(e) => setFormData({ ...formData, minBookingDuration: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Buffer Time (minutes)</label>
                  <input
                    type="number"
                    value={formData.bufferTime}
                    onChange={(e) => setFormData({ ...formData, bufferTime: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.waitlistEnabled}
                    onChange={(e) => setFormData({ ...formData, waitlistEnabled: e.target.checked })}
                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Enable Waitlist</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.recurringEnabled}
                    onChange={(e) => setFormData({ ...formData, recurringEnabled: e.target.checked })}
                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Enable Recurring Bookings</span>
                </label>
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={editingType ? handleUpdate : handleCreate}
                  className="flex-1 bg-purple-500 text-white py-3 rounded-xl hover:bg-purple-600 transition-all"
                  disabled={!formData.name || formData.organisationId === 0}
                >
                  {editingType ? 'Update' : 'Create'}
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

export default ResourceTypeManagement;
