import { useState, useEffect } from 'react';

interface Reservation {
  id: number;
  startTime: string;
  endTime: string;
  quantity: number;
  status: string;
  customerInfo?: any;
  notes?: string;
  resource?: any;
  createdBy?: any;
}

interface Resource {
  id: number;
  name: string;
  resourceType: any;
}

interface ReservationManagementProps {
  themeColor?: string;
}

const ReservationManagement: React.FC<ReservationManagementProps> = ({ themeColor = '#3b82f6' }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    quantity: 1,
    customerInfo: {},
    notes: '',
    resourceId: 0
  });

  useEffect(() => {
    loadReservations();
    loadResources();
  }, []);

  const loadReservations = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8081/api/reservations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to load reservations');
      const data = await response.json();
      setReservations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const loadResources = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8081/api/resources', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to load resources');
      const data = await response.json();
      setResources(data);
    } catch (err) {
      console.error('Failed to load resources:', err);
    }
  };

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8081/api/reservations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to create reservation');

      await loadReservations();
      setShowModal(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create reservation');
    }
  };

  const handleUpdate = async () => {
    if (!editingReservation) return;

    try {
      const token = localStorage.getItem('authToken');
      const { resourceId, ...updateData } = formData;
      const response = await fetch(`http://localhost:8081/api/reservations/${editingReservation.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) throw new Error('Failed to update reservation');

      await loadReservations();
      setShowModal(false);
      setEditingReservation(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update reservation');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this reservation?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8081/api/reservations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to delete reservation');
      await loadReservations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete reservation');
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8081/api/reservations/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) throw new Error('Failed to update status');
      await loadReservations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      startTime: '',
      endTime: '',
      quantity: 1,
      customerInfo: {},
      notes: '',
      resourceId: 0
    });
  };

  const openCreateModal = () => {
    setEditingReservation(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setFormData({
      startTime: reservation.startTime.slice(0, 16),
      endTime: reservation.endTime.slice(0, 16),
      quantity: reservation.quantity,
      customerInfo: reservation.customerInfo || {},
      notes: reservation.notes || '',
      resourceId: reservation.resource?.id || 0
    });
    setShowModal(true);
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      confirmed: 'bg-green-100 text-green-700 border-green-300',
      completed: 'bg-blue-100 text-blue-700 border-blue-300',
      cancelled: 'bg-red-100 text-red-700 border-red-300',
      waitlist: 'bg-purple-100 text-purple-700 border-purple-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h3 className="text-xl font-medium text-gray-800">Reservations</h3>
        <button
          onClick={openCreateModal}
          className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-all duration-200 flex items-center gap-2"
        >
          ➕ New Reservation
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
          <table className="min-w-full bg-white border border-orange-200 rounded-2xl overflow-hidden shadow-sm">
            <thead className="bg-gradient-to-r from-orange-100 to-yellow-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-orange-200">ID</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-orange-200">Resource</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-orange-200">Start Time</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-orange-200">End Time</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-orange-200">Quantity</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-orange-200">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-orange-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((reservation) => (
                <tr key={reservation.id} className="hover:bg-orange-50 transition-all duration-200">
                  <td className="px-6 py-4 border-b border-orange-100 text-sm text-gray-700">{reservation.id}</td>
                  <td className="px-6 py-4 border-b border-orange-100 text-sm text-gray-900 font-medium">{reservation.resource?.name || 'N/A'}</td>
                  <td className="px-6 py-4 border-b border-orange-100 text-sm text-gray-700">{formatDateTime(reservation.startTime)}</td>
                  <td className="px-6 py-4 border-b border-orange-100 text-sm text-gray-700">{formatDateTime(reservation.endTime)}</td>
                  <td className="px-6 py-4 border-b border-orange-100 text-sm text-gray-700">{reservation.quantity}</td>
                  <td className="px-6 py-4 border-b border-orange-100 text-sm">
                    <select
                      value={reservation.status}
                      onChange={(e) => handleStatusChange(reservation.id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(reservation.status)}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="waitlist">Waitlist</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 border-b border-orange-100 text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(reservation)}
                        className="text-xs px-3 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-all duration-200"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(reservation.id)}
                        className="text-xs px-3 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {reservations.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No reservations found. Create one to get started!
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
              {editingReservation ? 'Edit Reservation' : 'Create Reservation'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resource *</label>
                <select
                  value={formData.resourceId}
                  onChange={(e) => setFormData({ ...formData, resourceId: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  disabled={!!editingReservation}
                >
                  <option value={0}>Select Resource</option>
                  {resources.map(resource => (
                    <option key={resource.id} value={resource.id}>{resource.name} ({resource.resourceType?.name})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  min={1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  rows={3}
                />
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={editingReservation ? handleUpdate : handleCreate}
                  className="flex-1 bg-orange-500 text-white py-3 rounded-xl hover:bg-orange-600 transition-all"
                  disabled={!formData.startTime || !formData.endTime || formData.resourceId === 0}
                >
                  {editingReservation ? 'Update' : 'Create'}
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

export default ReservationManagement;