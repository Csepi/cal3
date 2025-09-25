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
  // Helper function to get theme-based colors
  const getThemeColors = (color: string) => {
    const colorMap: Record<string, any> = {
      '#ef4444': { gradient: 'from-red-50 via-red-100 to-red-200', primary: 'red', light: 'red-100', text: 'red-700', hover: 'red-200' },
      '#f59e0b': { gradient: 'from-orange-50 via-orange-100 to-orange-200', primary: 'orange', light: 'orange-100', text: 'orange-700', hover: 'orange-200' },
      '#eab308': { gradient: 'from-yellow-50 via-yellow-100 to-yellow-200', primary: 'yellow', light: 'yellow-100', text: 'yellow-700', hover: 'yellow-200' },
      '#84cc16': { gradient: 'from-lime-50 via-lime-100 to-lime-200', primary: 'lime', light: 'lime-100', text: 'lime-700', hover: 'lime-200' },
      '#10b981': { gradient: 'from-green-50 via-green-100 to-green-200', primary: 'green', light: 'green-100', text: 'green-700', hover: 'green-200' },
      '#22c55e': { gradient: 'from-emerald-50 via-emerald-100 to-emerald-200', primary: 'emerald', light: 'emerald-100', text: 'emerald-700', hover: 'emerald-200' },
      '#14b8a6': { gradient: 'from-teal-50 via-teal-100 to-teal-200', primary: 'teal', light: 'teal-100', text: 'teal-700', hover: 'teal-200' },
      '#06b6d4': { gradient: 'from-cyan-50 via-cyan-100 to-cyan-200', primary: 'cyan', light: 'cyan-100', text: 'cyan-700', hover: 'cyan-200' },
      '#0ea5e9': { gradient: 'from-sky-50 via-sky-100 to-sky-200', primary: 'sky', light: 'sky-100', text: 'sky-700', hover: 'sky-200' },
      '#3b82f6': { gradient: 'from-blue-50 via-blue-100 to-blue-200', primary: 'blue', light: 'blue-100', text: 'blue-700', hover: 'blue-200' },
      '#6366f1': { gradient: 'from-indigo-50 via-indigo-100 to-indigo-200', primary: 'indigo', light: 'indigo-100', text: 'indigo-700', hover: 'indigo-200' },
      '#7c3aed': { gradient: 'from-violet-50 via-violet-100 to-violet-200', primary: 'violet', light: 'violet-100', text: 'violet-700', hover: 'violet-200' },
      '#8b5cf6': { gradient: 'from-purple-50 via-purple-100 to-purple-200', primary: 'purple', light: 'purple-100', text: 'purple-700', hover: 'purple-200' },
      '#ec4899': { gradient: 'from-pink-50 via-pink-100 to-pink-200', primary: 'pink', light: 'pink-100', text: 'pink-700', hover: 'pink-200' },
      '#f43f5e': { gradient: 'from-rose-50 via-rose-100 to-rose-200', primary: 'rose', light: 'rose-100', text: 'rose-700', hover: 'rose-200' },
      '#64748b': { gradient: 'from-slate-50 via-slate-100 to-slate-200', primary: 'slate', light: 'slate-100', text: 'slate-700', hover: 'slate-200' }
    };
    return colorMap[color] || colorMap['#3b82f6'];
  };

  const themeColors = getThemeColors(themeColor);
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
    resourceId: 0,
    // Multi-day fields
    startDate: '',
    endDate: '',
    startTimeOnly: '',
    endTimeOnly: ''
  });

  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    resourceType: '',
    organization: '',
    dateFrom: '',
    dateTo: '',
    resourceId: ''
  });
  const [resourceTypes, setResourceTypes] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);

  // Validation states
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Multi-day reservation state
  const [isMultiDay, setIsMultiDay] = useState(false);

  useEffect(() => {
    loadReservations();
    loadResources();
    loadResourceTypes();
    loadOrganizations();
  }, []);

  // Apply filters whenever reservations or filters change
  useEffect(() => {
    applyFilters();
  }, [reservations, filters]);

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
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError('');

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

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to create reservation');
      }

      await loadReservations();
      setShowModal(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create reservation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingReservation) return;
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      // Only send fields that the backend expects
      const updateData = {
        startTime: formData.startTime,
        endTime: formData.endTime,
        quantity: formData.quantity,
        customerInfo: formData.customerInfo,
        notes: formData.notes
      };
      const response = await fetch(`http://localhost:8081/api/reservations/${editingReservation.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to update reservation');
      }

      await loadReservations();
      setShowModal(false);
      setEditingReservation(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update reservation');
    } finally {
      setIsSubmitting(false);
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
      resourceId: 0,
      startDate: '',
      endDate: '',
      startTimeOnly: '',
      endTimeOnly: ''
    });
    setValidationErrors({});
    setIsSubmitting(false);
    setIsMultiDay(false);
  };

  // Load resource types for filtering
  const loadResourceTypes = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8081/api/resource-types', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setResourceTypes(data);
      }
    } catch (err) {
      console.error('Failed to load resource types:', err);
    }
  };

  // Load organizations for filtering
  const loadOrganizations = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8081/api/organisations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data);
      }
    } catch (err) {
      console.error('Failed to load organizations:', err);
    }
  };

  // Apply filters to reservations
  const applyFilters = () => {
    let filtered = [...reservations];

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(r => r.status === filters.status);
    }

    // Filter by resource
    if (filters.resourceId) {
      filtered = filtered.filter(r => r.resource?.id === parseInt(filters.resourceId));
    }

    // Filter by resource type
    if (filters.resourceType) {
      filtered = filtered.filter(r => r.resource?.resourceType?.id === parseInt(filters.resourceType));
    }

    // Filter by organization
    if (filters.organization) {
      filtered = filtered.filter(r => r.resource?.resourceType?.organisationId === parseInt(filters.organization));
    }

    // Filter by date range
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(r => new Date(r.startTime) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // Include end of day
      filtered = filtered.filter(r => new Date(r.endTime) <= toDate);
    }

    setFilteredReservations(filtered);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: '',
      resourceType: '',
      organization: '',
      dateFrom: '',
      dateTo: '',
      resourceId: ''
    });
  };

  // Validation function
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.startTime) {
      errors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      errors.endTime = 'End time is required';
    }

    if (!formData.resourceId || formData.resourceId === 0) {
      errors.resourceId = 'Please select a resource';
    }

    if (formData.quantity < 1) {
      errors.quantity = 'Quantity must be at least 1';
    }

    // Validate time range
    if (formData.startTime && formData.endTime) {
      const startTime = new Date(formData.startTime);
      const endTime = new Date(formData.endTime);

      if (endTime <= startTime) {
        errors.endTime = 'End time must be after start time';
      }

      // Check if start time is in the past
      if (startTime < new Date()) {
        errors.startTime = 'Start time cannot be in the past';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Clear validation errors when form data changes
  const updateFormData = (field: string, value: any) => {
    const newFormData = { ...formData, [field]: value };

    // If multi-day mode, combine date and time fields
    if (isMultiDay) {
      if (field === 'startDate' || field === 'startTimeOnly') {
        if (newFormData.startDate && newFormData.startTimeOnly) {
          newFormData.startTime = `${newFormData.startDate}T${newFormData.startTimeOnly}`;
        }
      }
      if (field === 'endDate' || field === 'endTimeOnly') {
        if (newFormData.endDate && newFormData.endTimeOnly) {
          newFormData.endTime = `${newFormData.endDate}T${newFormData.endTimeOnly}`;
        }
      }
    } else {
      // Single-day mode: combine single date with start/end times
      if (field === 'startDate' || field === 'endDate' || field === 'startTimeOnly' || field === 'endTimeOnly') {
        const singleDate = newFormData.startDate || newFormData.endDate || '';
        if (singleDate && newFormData.startTimeOnly) {
          newFormData.startTime = `${singleDate}T${newFormData.startTimeOnly}`;
        }
        if (singleDate && newFormData.endTimeOnly) {
          newFormData.endTime = `${singleDate}T${newFormData.endTimeOnly}`;
        }
      }
    }

    setFormData(newFormData);

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: '' });
    }
  };

  // Handle multi-day toggle
  const handleMultiDayToggle = (checked: boolean) => {
    setIsMultiDay(checked);

    if (checked && formData.startTime && formData.endTime) {
      // Convert existing datetime to separate date/time fields
      const startDateTime = new Date(formData.startTime);
      const endDateTime = new Date(formData.endTime);

      updateFormData('startDate', startDateTime.toISOString().split('T')[0]);
      updateFormData('endDate', endDateTime.toISOString().split('T')[0]);
      updateFormData('startTimeOnly', startDateTime.toTimeString().slice(0, 5));
      updateFormData('endTimeOnly', endDateTime.toTimeString().slice(0, 5));
    } else if (!checked) {
      // Converting to single-day mode
      if (formData.startDate && formData.startTimeOnly && formData.endTimeOnly) {
        // Use existing startDate for both start and end
        updateFormData('endDate', formData.startDate);
        updateFormData('startTime', `${formData.startDate}T${formData.startTimeOnly}`);
        updateFormData('endTime', `${formData.startDate}T${formData.endTimeOnly}`);
      } else if (formData.startTime && formData.endTime) {
        // Extract date and times from existing datetime fields
        const startDateTime = new Date(formData.startTime);
        const endDateTime = new Date(formData.endTime);
        const singleDate = startDateTime.toISOString().split('T')[0];

        updateFormData('startDate', singleDate);
        updateFormData('endDate', singleDate);
        updateFormData('startTimeOnly', startDateTime.toTimeString().slice(0, 5));
        updateFormData('endTimeOnly', endDateTime.toTimeString().slice(0, 5));
      }
    }
  };

  const openCreateModal = () => {
    setEditingReservation(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (reservation: Reservation) => {
    setEditingReservation(reservation);

    // Parse the start and end times
    const startDateTime = new Date(reservation.startTime);
    const endDateTime = new Date(reservation.endTime);
    const startDate = startDateTime.toISOString().split('T')[0];
    const endDate = endDateTime.toISOString().split('T')[0];
    const startTimeOnly = startDateTime.toTimeString().slice(0, 5);
    const endTimeOnly = endDateTime.toTimeString().slice(0, 5);

    // Determine if it's multi-day
    const isMultiDayReservation = startDate !== endDate;
    setIsMultiDay(isMultiDayReservation);

    setFormData({
      startTime: reservation.startTime.slice(0, 16),
      endTime: reservation.endTime.slice(0, 16),
      startDate: startDate,
      endDate: endDate,
      startTimeOnly: startTimeOnly,
      endTimeOnly: endTimeOnly,
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
          className={`bg-${themeColors.primary}-500 text-white px-4 py-2 rounded-xl hover:bg-${themeColors.primary}-600 transition-all duration-200 flex items-center gap-2`}
          style={{ backgroundColor: themeColor }}
        >
          ➕ New Reservation
        </button>
      </div>

      {/* Comprehensive Filters */}
      <div className={`mb-6 bg-white rounded-2xl border border-${themeColors.primary}-200 shadow-sm overflow-hidden`}>
        <div className={`p-4 bg-gradient-to-r ${themeColors.gradient} border-b border-${themeColors.primary}-200`}>
          <h4 className="text-lg font-medium text-gray-800 mb-3">Filter Reservations</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${themeColors.primary}-500 focus:border-${themeColors.primary}-500`}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="waitlist">Waitlist</option>
              </select>
            </div>

            {/* Resource Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Resource</label>
              <select
                value={filters.resourceId}
                onChange={(e) => setFilters({ ...filters, resourceId: e.target.value })}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${themeColors.primary}-500 focus:border-${themeColors.primary}-500`}
              >
                <option value="">All Resources</option>
                {resources.map((resource) => (
                  <option key={resource.id} value={resource.id}>
                    {resource.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Resource Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Resource Type</label>
              <select
                value={filters.resourceType}
                onChange={(e) => setFilters({ ...filters, resourceType: e.target.value })}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${themeColors.primary}-500 focus:border-${themeColors.primary}-500`}
              >
                <option value="">All Types</option>
                {resourceTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Organization Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
              <select
                value={filters.organization}
                onChange={(e) => setFilters({ ...filters, organization: e.target.value })}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${themeColors.primary}-500 focus:border-${themeColors.primary}-500`}
              >
                <option value="">All Organizations</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${themeColors.primary}-500 focus:border-${themeColors.primary}-500`}
              />
            </div>

            {/* Date To Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${themeColors.primary}-500 focus:border-${themeColors.primary}-500`}
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Showing {filteredReservations.length} of {reservations.length} reservations
            </div>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
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
          <table className={`min-w-full bg-white border border-${themeColors.primary}-200 rounded-2xl overflow-hidden shadow-sm`}>
            <thead className={`bg-gradient-to-r ${themeColors.gradient}`}>
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-${themeColors.primary}-200">ID</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-${themeColors.primary}-200">Resource</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-${themeColors.primary}-200">Start Time</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-${themeColors.primary}-200">End Time</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-${themeColors.primary}-200">Quantity</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-${themeColors.primary}-200">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-800 border-b border-${themeColors.primary}-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.map((reservation) => (
                <tr key={reservation.id} className="hover:bg-${themeColors.primary}-50 transition-all duration-200">
                  <td className="px-6 py-4 border-b border-${themeColors.primary}-100 text-sm text-gray-700">{reservation.id}</td>
                  <td className="px-6 py-4 border-b border-${themeColors.primary}-100 text-sm text-gray-900 font-medium">{reservation.resource?.name || 'N/A'}</td>
                  <td className="px-6 py-4 border-b border-${themeColors.primary}-100 text-sm text-gray-700">{formatDateTime(reservation.startTime)}</td>
                  <td className="px-6 py-4 border-b border-${themeColors.primary}-100 text-sm text-gray-700">{formatDateTime(reservation.endTime)}</td>
                  <td className="px-6 py-4 border-b border-${themeColors.primary}-100 text-sm text-gray-700">{reservation.quantity}</td>
                  <td className="px-6 py-4 border-b border-${themeColors.primary}-100 text-sm">
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
                  <td className="px-6 py-4 border-b border-${themeColors.primary}-100 text-sm">
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
              {filteredReservations.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {reservations.length === 0
                      ? "No reservations found. Create one to get started!"
                      : "No reservations match your filter criteria. Try adjusting the filters."}
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
                  onChange={(e) => updateFormData('resourceId', parseInt(e.target.value))}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-${themeColors.primary}-500 outline-none ${
                    validationErrors.resourceId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={!!editingReservation}
                >
                  <option value={0}>Select Resource</option>
                  {resources.map(resource => (
                    <option key={resource.id} value={resource.id}>{resource.name} ({resource.resourceType?.name})</option>
                  ))}
                </select>
                {validationErrors.resourceId && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.resourceId}</p>
                )}
              </div>
              {/* Multi-day toggle */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="multiDay"
                  checked={isMultiDay}
                  onChange={(e) => handleMultiDayToggle(e.target.checked)}
                  className={`w-4 h-4 text-${themeColors.primary}-600 bg-gray-100 border-gray-300 rounded focus:ring-${themeColors.primary}-500 focus:ring-2`}
                />
                <label htmlFor="multiDay" className="text-sm font-medium text-gray-700">
                  Multi-day reservation (start and end on different dates)
                </label>
              </div>

              {isMultiDay ? (
                // Multi-day date/time fields
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => updateFormData('startDate', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-${themeColors.primary}-500 outline-none ${
                          validationErrors.startTime ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => updateFormData('endDate', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-${themeColors.primary}-500 outline-none ${
                          validationErrors.endTime ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
                      <input
                        type="time"
                        value={formData.startTimeOnly}
                        onChange={(e) => updateFormData('startTimeOnly', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-${themeColors.primary}-500 outline-none ${
                          validationErrors.startTime ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
                      <input
                        type="time"
                        value={formData.endTimeOnly}
                        onChange={(e) => updateFormData('endTimeOnly', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-${themeColors.primary}-500 outline-none ${
                          validationErrors.endTime ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                  </div>
                  {(validationErrors.startTime || validationErrors.endTime) && (
                    <div className="text-red-500 text-sm">
                      {validationErrors.startTime && <p>{validationErrors.startTime}</p>}
                      {validationErrors.endTime && <p>{validationErrors.endTime}</p>}
                    </div>
                  )}
                </div>
              ) : (
                // Single-day: one date field + two time fields
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                    <input
                      type="date"
                      value={formData.startDate || formData.endDate || ''}
                      onChange={(e) => {
                        updateFormData('startDate', e.target.value);
                        updateFormData('endDate', e.target.value);
                      }}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-${themeColors.primary}-500 outline-none ${
                        (validationErrors.startTime || validationErrors.endTime) ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
                      <input
                        type="time"
                        value={formData.startTimeOnly || ''}
                        onChange={(e) => updateFormData('startTimeOnly', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-${themeColors.primary}-500 outline-none ${
                          validationErrors.startTime ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {validationErrors.startTime && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.startTime}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
                      <input
                        type="time"
                        value={formData.endTimeOnly || ''}
                        onChange={(e) => updateFormData('endTimeOnly', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-${themeColors.primary}-500 outline-none ${
                          validationErrors.endTime ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {validationErrors.endTime && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.endTime}</p>
                      )}
                    </div>
                  </div>
                  {(validationErrors.startTime || validationErrors.endTime) && (
                    <div className="text-red-500 text-sm">
                      {validationErrors.startTime && <p>{validationErrors.startTime}</p>}
                      {validationErrors.endTime && <p>{validationErrors.endTime}</p>}
                    </div>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => updateFormData('quantity', parseInt(e.target.value))}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-${themeColors.primary}-500 outline-none ${
                    validationErrors.quantity ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min={1}
                />
                {validationErrors.quantity && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.quantity}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-${themeColors.primary}-500 outline-none"
                  rows={3}
                />
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={editingReservation ? handleUpdate : handleCreate}
                  className={`flex-1 py-3 rounded-xl transition-all ${
                    isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : `bg-${themeColors.primary}-500 hover:bg-${themeColors.primary}-600`
                  } text-white`}
                  style={!isSubmitting ? { backgroundColor: themeColor } : {}}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? (editingReservation ? 'Updating...' : 'Creating...')
                    : (editingReservation ? 'Update' : 'Create')
                  }
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