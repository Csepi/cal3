import { useState, useEffect } from 'react';
import { BASE_URL } from '../config/apiConfig';
import { secureFetch } from '../services/authErrorHandler';
import type {
  ReservationOrganization,
  ReservationResourceType,
  ReservationUserSummary,
} from '../types/reservation';

interface Resource {
  id: number;
  name: string;
  description?: string;
  capacity: number;
  isActive: boolean;
  resourceType?: ReservationResourceType;
  managedBy?: ReservationUserSummary;
}

interface ResourceType {
  id: number;
  name: string;
  organisation: ReservationOrganization;
}

interface ResourceManagementProps {
}

const ResourceManagement: React.FC<ResourceManagementProps> = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: 1,
    resourceTypeId: 0
  });

  useEffect(() => {
    loadResources();
    loadResourceTypes();
  }, []);

  const loadResources = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await secureFetch(`${BASE_URL}/api/resources`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to load resources');
      const data = (await response.json()) as Resource[];
      setResources(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const loadResourceTypes = async () => {
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
      console.error('Failed to load resource types:', err);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await secureFetch(`${BASE_URL}/api/resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to create resource');

      await loadResources();
      setShowModal(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create resource');
    }
  };

  const handleUpdate = async () => {
    if (!editingResource) return;

    try {
      const { resourceTypeId, ...updateData } = formData;
      const response = await secureFetch(`${BASE_URL}/api/resources/${editingResource.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) throw new Error('Failed to update resource');

      await loadResources();
      setShowModal(false);
      setEditingResource(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update resource');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    try {
      const response = await secureFetch(`${BASE_URL}/api/resources/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to delete resource');
      await loadResources();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete resource');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      capacity: 1,
      resourceTypeId: 0
    });
  };

  const openCreateModal = () => {
    setEditingResource(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (resource: Resource) => {
    setEditingResource(resource);
    setFormData({
      name: resource.name,
      description: resource.description || '',
      capacity: resource.capacity,
      resourceTypeId: resource.resourceType?.id || 0
    });
    setShowModal(true);
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h3 className="text-xl font-medium text-gray-800">Resources</h3>
        <button
          onClick={openCreateModal}
          className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-all duration-200 flex items-center gap-2"
        >
          ➕ Add Resource
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
          <table className="min-w-full bg-white border border-green-200 rounded-2xl overflow-hidden shadow-sm">
            <thead className="bg-gradient-to-r from-green-100 to-emerald-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-green-200">ID</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-green-200">Name</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-green-200">Type</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-green-200">Organisation</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-green-200">Capacity</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-green-200">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-green-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((resource) => (
                <tr key={resource.id} className="hover:bg-green-50 transition-all duration-200">
                  <td className="px-6 py-4 border-b border-green-100 text-sm text-gray-700">{resource.id}</td>
                  <td className="px-6 py-4 border-b border-green-100 text-sm text-gray-900 font-medium">{resource.name}</td>
                  <td className="px-6 py-4 border-b border-green-100 text-sm text-gray-700">{resource.resourceType?.name || 'N/A'}</td>
                  <td className="px-6 py-4 border-b border-green-100 text-sm text-gray-700">{resource.resourceType?.organisation?.name || 'N/A'}</td>
                  <td className="px-6 py-4 border-b border-green-100 text-sm text-gray-700">{resource.capacity}</td>
                  <td className="px-6 py-4 border-b border-green-100 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      resource.isActive ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'
                    }`}>
                      {resource.isActive ? '✅ Active' : '❌ Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 border-b border-green-100 text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(resource)}
                        className="text-xs px-3 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-all duration-200"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(resource.id)}
                        className="text-xs px-3 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {resources.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No resources found. Create one to get started!
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
              {editingResource ? 'Edit Resource' : 'Create Resource'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resource Type *</label>
                <select
                  value={formData.resourceTypeId}
                  onChange={(e) => setFormData({ ...formData, resourceTypeId: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  disabled={!!editingResource}
                >
                  <option value={0}>Select Resource Type</option>
                  {resourceTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name} ({type.organisation?.name})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Capacity *</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  min={1}
                />
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={editingResource ? handleUpdate : handleCreate}
                  className="flex-1 bg-green-500 text-white py-3 rounded-xl hover:bg-green-600 transition-all"
                  disabled={!formData.name || formData.resourceTypeId === 0}
                >
                  {editingResource ? 'Update' : 'Create'}
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

export default ResourceManagement;

