// @ts-nocheck
/**
 * ReservationsPanel Component
 *
 * Complete redesign with the following requirements:
 * 1. Only accessible to users with "Store" or "Enterprise" usage plan
 * 2. Organization selector showing organizations user is assigned to with role badges
 * 3. Users can see all reservations and their assignments
 * 4. Editors can view/edit/delete reservations, resources, and resource types they're assigned to
 * 5. Org admins have all editor powers plus user assignment and organization deletion
 * 6. Public booking links for each resource
 */

import { useState, useEffect, memo } from 'react';
import { http } from '../lib/http';
import { profileApi } from '../services/profileApi';
import { UserPermissionsService } from '../services/userPermissions';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { useScreenSize } from '../hooks/useScreenSize';

const apiService = {
  get: <T,>(endpoint: string) => http.get<T>(`/api${endpoint}`),
  post: <T,>(endpoint: string, data?: unknown) => http.post<T>(`/api${endpoint}`, data),
  patch: <T,>(endpoint: string, data?: unknown) => http.patch<T>(`/api${endpoint}`, data),
  delete: <T,>(endpoint: string) => http.delete<T>(`/api${endpoint}`),
  getUserProfile: () => profileApi.getUserProfile(),
};

interface ReservationsPanelProps {
  themeColor?: string;
}

interface Organization {
  id: number;
  name: string;
  description?: string;
  role?: 'USER' | 'EDITOR' | 'ORG_ADMIN';
  color: string;
}

interface ResourceType {
  id: number;
  name: string;
  description?: string;
  organisationId: number;
  minBookingDuration?: number;
  bufferTime?: number;
  isActive: boolean;
  color: string;
}

interface Resource {
  id: number;
  name: string;
  description?: string;
  capacity?: number;
  resourceTypeId: number;
  resourceType?: ResourceType;
  publicBookingToken?: string;
  isActive: boolean;
}

interface Reservation {
  id: number;
  startTime: string;
  endTime: string;
  quantity: number;
  status: string;
  customerName?: string;
  customerEmail?: string;
  resource?: Resource;
  resourceId: number;
}

type DeletableItem = Organization | ResourceType | Resource | Reservation;
type DeletionPreview = Record<string, unknown>;

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

const ReservationsPanel: React.FC<ReservationsPanelProps> = ({ themeColor = '#3b82f6' }) => {
  // Mobile detection
  const { isMobile } = useScreenSize();

  // State management
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'types' | 'resources' | 'reservations'>('overview');

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'organization' | 'resourceType' | 'resource' | 'reservation' | null;
    item: DeletableItem | null;
    preview: DeletionPreview | null;
    loading: boolean;
  }>({
    isOpen: false,
    type: null,
    item: null,
    preview: null,
    loading: false
  });

  // Add Resource Type modal state
  const [resourceTypeModal, setResourceTypeModal] = useState<{
    isOpen: boolean;
    loading: boolean;
    editMode: boolean;
    editId: number | null;
    name: string;
    description: string;
    minBookingDuration: string;
    bufferTime: string;
  }>({
    isOpen: false,
    loading: false,
    editMode: false,
    editId: null,
    name: '',
    description: '',
    minBookingDuration: '30',
    bufferTime: '0'
  });

  // Add Resource modal state
  const [resourceModal, setResourceModal] = useState<{
    isOpen: boolean;
    loading: boolean;
    editMode: boolean;
    editId: number | null;
    name: string;
    description: string;
    capacity: string;
    resourceTypeId: string;
  }>({
    isOpen: false,
    loading: false,
    editMode: false,
    editId: null,
    name: '',
    description: '',
    capacity: '1',
    resourceTypeId: ''
  });

  // Add Reservation modal state
  const [reservationModal, setReservationModal] = useState<{
    isOpen: boolean;
    loading: boolean;
    resourceId: string;
    startDate: string;
    startTime: string;
    endTime: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    notes: string;
    quantity: string;
  }>({
    isOpen: false,
    loading: false,
    resourceId: '',
    startDate: new Date().toISOString().split('T')[0], // Today's date
    startTime: '09:00',
    endTime: '10:00',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    notes: '',
    quantity: '1'
  });

  // Theme configuration
  const getThemeColors = (color: string) => {
    const colorMap: Record<string, unknown> = {
      '#ef4444': { gradient: 'from-red-50 via-red-100 to-red-200', primary: 'bg-red-500 hover:bg-red-600', accent: 'text-red-600', badge: 'bg-red-100 text-red-800' },
      '#f59e0b': { gradient: 'from-orange-50 via-orange-100 to-orange-200', primary: 'bg-orange-500 hover:bg-orange-600', accent: 'text-orange-600', badge: 'bg-orange-100 text-orange-800' },
      '#eab308': { gradient: 'from-yellow-50 via-yellow-100 to-yellow-200', primary: 'bg-yellow-500 hover:bg-yellow-600', accent: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-800' },
      '#84cc16': { gradient: 'from-lime-50 via-lime-100 to-lime-200', primary: 'bg-lime-500 hover:bg-lime-600', accent: 'text-lime-600', badge: 'bg-lime-100 text-lime-800' },
      '#10b981': { gradient: 'from-green-50 via-green-100 to-green-200', primary: 'bg-green-500 hover:bg-green-600', accent: 'text-green-600', badge: 'bg-green-100 text-green-800' },
      '#22c55e': { gradient: 'from-emerald-50 via-emerald-100 to-emerald-200', primary: 'bg-emerald-500 hover:bg-emerald-600', accent: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-800' },
      '#14b8a6': { gradient: 'from-teal-50 via-teal-100 to-teal-200', primary: 'bg-teal-500 hover:bg-teal-600', accent: 'text-teal-600', badge: 'bg-teal-100 text-teal-800' },
      '#06b6d4': { gradient: 'from-cyan-50 via-cyan-100 to-cyan-200', primary: 'bg-cyan-500 hover:bg-cyan-600', accent: 'text-cyan-600', badge: 'bg-cyan-100 text-cyan-800' },
      '#0ea5e9': { gradient: 'from-sky-50 via-sky-100 to-sky-200', primary: 'bg-sky-500 hover:bg-sky-600', accent: 'text-sky-600', badge: 'bg-sky-100 text-sky-800' },
      '#3b82f6': { gradient: 'from-blue-50 via-blue-100 to-blue-200', primary: 'bg-blue-500 hover:bg-blue-600', accent: 'text-blue-600', badge: 'bg-blue-100 text-blue-800' },
      '#6366f1': { gradient: 'from-indigo-50 via-indigo-100 to-indigo-200', primary: 'bg-indigo-500 hover:bg-indigo-600', accent: 'text-indigo-600', badge: 'bg-indigo-100 text-indigo-800' },
      '#7c3aed': { gradient: 'from-violet-50 via-violet-100 to-violet-200', primary: 'bg-violet-500 hover:bg-violet-600', accent: 'text-violet-600', badge: 'bg-violet-100 text-violet-800' },
      '#8b5cf6': { gradient: 'from-purple-50 via-purple-100 to-purple-200', primary: 'bg-purple-500 hover:bg-purple-600', accent: 'text-purple-600', badge: 'bg-purple-100 text-purple-800' },
      '#ec4899': { gradient: 'from-pink-50 via-pink-100 to-pink-200', primary: 'bg-pink-500 hover:bg-pink-600', accent: 'text-pink-600', badge: 'bg-pink-100 text-pink-800' },
      '#f43f5e': { gradient: 'from-rose-50 via-rose-100 to-rose-200', primary: 'bg-rose-500 hover:bg-rose-600', accent: 'text-rose-600', badge: 'bg-rose-100 text-rose-800' },
      '#64748b': { gradient: 'from-slate-50 via-slate-100 to-slate-200', primary: 'bg-slate-500 hover:bg-slate-600', accent: 'text-slate-600', badge: 'bg-slate-100 text-slate-800' }
    };
    return colorMap[color] || colorMap['#3b82f6'];
  };

  const themeColors = getThemeColors(themeColor);

  // Load accessible organizations
  useEffect(() => {
    loadOrganizations();
  }, []);

  // Load data when organization is selected
  useEffect(() => {
    if (selectedOrgId) {
      loadOrganizationData();
    }
  }, [selectedOrgId]);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current logged-in user's profile to get their ID
      const userProfile = await apiService.getUserProfile();
      const currentUserId = userProfile.id;

      const orgs = await UserPermissionsService.getAccessibleOrganizations();

      // Get user-organization roles from the organizations endpoint
      const orgsWithRoles = await Promise.all(
        orgs.map(async (org) => {
          try {
            // Try to get organization users to determine role
            const users = (await apiService.get(
              `/organisations/${org.id}/users/list`,
            )) as Array<{ userId?: number; role?: string }>;
            const currentUserInOrg = users.find((u) => u.userId === currentUserId);

            // Map role from backend ('admin', 'editor', 'user') to frontend format ('ORG_ADMIN', 'EDITOR', 'USER')
            const role = currentUserInOrg?.role;
            const mappedRole = role === 'admin' ? 'ORG_ADMIN' : role === 'editor' ? 'EDITOR' : 'USER';

            return {
              ...org,
              role: mappedRole
            };
          } catch (err) {
            console.error(`Failed to fetch users for org ${org.id}:`, err);
            // If can't fetch users, default to USER role
            return { ...org, role: 'USER' as const };
          }
        })
      );

      setOrganizations(orgsWithRoles);

      // Auto-select first organization
      if (orgsWithRoles.length > 0 && !selectedOrgId) {
        setSelectedOrgId(orgsWithRoles[0].id);
        setSelectedOrg(orgsWithRoles[0]);
      }
    } catch (err: unknown) {
      console.error('Failed to load organizations:', err);
      setError(getErrorMessage(err, 'Failed to load organizations'));
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizationData = async () => {
    if (!selectedOrgId) return;

    try {
      setLoading(true);
      setError(null);

      // Load resource types for this organization
      const types = (await apiService.get(
        `/resource-types?organisationId=${selectedOrgId}`,
      )) as ResourceType[];
      setResourceTypes(types);

      // Load resources for this organization
      const resourcesData = (await apiService.get('/resources')) as Resource[];
      const orgResources = resourcesData.filter((r: Resource) =>
        r.resourceType?.organisationId === selectedOrgId
      );
      setResources(orgResources);

      // Load reservations for this organization's resources
      const reservationsData = (await apiService.get('/reservations')) as Reservation[];
      const orgResourceIds = orgResources.map((r: Resource) => r.id);
      const orgReservations = reservationsData.filter((res: Reservation) =>
        orgResourceIds.includes(res.resourceId)
      );
      setReservations(orgReservations);

    } catch (err: unknown) {
      console.error('Failed to load organization data:', err);
      setError(getErrorMessage(err, 'Failed to load data'));
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role?: string) => {
    const roleConfig: Record<string, { label: string; color: string }> = {
      'USER': { label: 'User', color: 'bg-gray-100 text-gray-700' },
      'EDITOR': { label: 'Editor', color: 'bg-blue-100 text-blue-700' },
      'ORG_ADMIN': { label: 'Org Admin', color: 'bg-purple-100 text-purple-700' }
    };

    const config = roleConfig[role || 'USER'] || roleConfig['USER'];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const canEdit = () => {
    return selectedOrg?.role === 'EDITOR' || selectedOrg?.role === 'ORG_ADMIN';
  };

  const canManageUsers = () => {
    return selectedOrg?.role === 'ORG_ADMIN';
  };

  // Delete handlers
  const handleDeleteClick = async (type: 'organization' | 'resourceType' | 'resource' | 'reservation', item: DeletableItem) => {
    setDeleteModal({
      isOpen: true,
      type,
      item,
      preview: null,
      loading: true
    });

    // Fetch deletion preview
    try {
      let preview;
      if (type === 'organization') {
        preview = await apiService.get(`/organisations/${item.id}/deletion-preview`);
      } else if (type === 'resourceType') {
        preview = await apiService.get(`/resource-types/${item.id}/deletion-preview`);
      } else if (type === 'resource') {
        preview = await apiService.get(`/resources/${item.id}/deletion-preview`);
      }

      setDeleteModal(prev => ({
        ...prev,
        preview,
        loading: false
      }));
    } catch (err: unknown) {
      console.error('Error fetching deletion preview:', err);
      setDeleteModal(prev => ({
        ...prev,
        loading: false
      }));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.item || !deleteModal.type) return;

    try {
      if (deleteModal.type === 'organization') {
        await apiService.delete(`/organisations/${deleteModal.item.id}/cascade`);
        // Reload organizations list
        await loadOrganizations();
        setSelectedOrgId(null);
        setSelectedOrg(null);
      } else if (deleteModal.type === 'resourceType') {
        await apiService.delete(`/resource-types/${deleteModal.item.id}/cascade`);
        // Reload resource types for this organization
        await loadOrganizationData(selectedOrgId!);
      } else if (deleteModal.type === 'resource') {
        await apiService.delete(`/resources/${deleteModal.item.id}/cascade`);
        // Reload resources for this organization
        await loadOrganizationData(selectedOrgId!);
      } else if (deleteModal.type === 'reservation') {
        await apiService.delete(`/reservations/${deleteModal.item.id}`);
        // Reload reservations for this organization
        await loadOrganizationData(selectedOrgId!);
      }

      // Close modal
      setDeleteModal({
        isOpen: false,
        type: null,
        item: null,
        preview: null,
        loading: false
      });
    } catch (err: unknown) {
      throw new Error(getErrorMessage(err, 'Failed to delete item'));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      type: null,
      item: null,
      preview: null,
      loading: false
    });
  };

  // Public Booking Initialization
  const handleInitializePublicBooking = async () => {
    if (!confirm('This will generate public booking tokens for all resources and default operating hours for all resource types. Continue?')) {
      return;
    }

    try {
      setLoading(true);
      const result = (await apiService.post('/admin/public-booking/initialize', {})) as {
        resourcesUpdated: number;
        resourceTypesWithHours: number;
        errors: string[];
      };

      alert(`Public booking initialized successfully!\n\nResources updated: ${result.resourcesUpdated}\nResource types with hours: ${result.resourceTypesWithHours}${result.errors.length > 0 ? '\n\nErrors: ' + result.errors.join('\n') : ''}`);

      // Reload data to show updated tokens
      await loadOrganizationData();
    } catch (err: unknown) {
      console.error('Failed to initialize public booking:', err);
      alert(`Failed to initialize public booking: ${getErrorMessage(err, 'Unknown error')}`);
    } finally {
      setLoading(false);
    }
  };

  // Resource Type handlers
  const handleAddResourceTypeClick = () => {
    setResourceTypeModal({
      isOpen: true,
      loading: false,
      editMode: false,
      editId: null,
      name: '',
      description: '',
      minBookingDuration: '30',
      bufferTime: '0'
    });
  };

  const handleEditResourceTypeClick = (type: ResourceType) => {
    setResourceTypeModal({
      isOpen: true,
      loading: false,
      editMode: true,
      editId: type.id,
      name: type.name,
      description: type.description || '',
      minBookingDuration: String(type.minBookingDuration || 30),
      bufferTime: String(type.bufferTime || 0)
    });
  };

  const handleSaveResourceType = async () => {
    if (!resourceTypeModal.name.trim()) {
      alert('Please enter a resource type name');
      return;
    }

    if (!resourceTypeModal.editMode && !selectedOrgId) {
      alert('No organization selected');
      return;
    }

    try {
      setResourceTypeModal(prev => ({ ...prev, loading: true }));

      const payload: Record<string, unknown> = {
        name: resourceTypeModal.name.trim(),
      };

      // Add organisationId only for create mode
      if (!resourceTypeModal.editMode) {
        payload.organisationId = selectedOrgId;
      }

      // Only add optional fields if they have values
      if (resourceTypeModal.description.trim()) {
        payload.description = resourceTypeModal.description.trim();
      }

      const minDuration = parseInt(resourceTypeModal.minBookingDuration);
      if (!isNaN(minDuration) && minDuration > 0) {
        payload.minBookingDuration = minDuration;
      }

      const buffer = parseInt(resourceTypeModal.bufferTime);
      if (!isNaN(buffer) && buffer >= 0) {
        payload.bufferTime = buffer;
      }

      if (resourceTypeModal.editMode && resourceTypeModal.editId) {
        // Update existing resource type
        await apiService.patch(`/resource-types/${resourceTypeModal.editId}`, payload);
      } else {
        // Create new resource type
        await apiService.post('/resource-types', payload);
      }

      // Reload organization data
      await loadOrganizationData();

      // Close modal
      setResourceTypeModal({
        isOpen: false,
        loading: false,
        editMode: false,
        editId: null,
        name: '',
        description: '',
        minBookingDuration: '30',
        bufferTime: '0'
      });
    } catch (err: unknown) {
      console.error(`Failed to ${resourceTypeModal.editMode ? 'update' : 'create'} resource type:`, err);
      alert(`Failed to ${resourceTypeModal.editMode ? 'update' : 'create'} resource type: ${getErrorMessage(err, 'Unknown error')}`);
      setResourceTypeModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleResourceTypeModalClose = () => {
    setResourceTypeModal({
      isOpen: false,
      loading: false,
      editMode: false,
      editId: null,
      name: '',
      description: '',
      minBookingDuration: '30',
      bufferTime: '0'
    });
  };

  // Resource handlers
  const handleAddResourceClick = () => {
    setResourceModal({
      isOpen: true,
      loading: false,
      editMode: false,
      editId: null,
      name: '',
      description: '',
      capacity: '1',
      resourceTypeId: resourceTypes.length > 0 ? String(resourceTypes[0].id) : ''
    });
  };

  const handleEditResourceClick = (resource: Resource) => {
    setResourceModal({
      isOpen: true,
      loading: false,
      editMode: true,
      editId: resource.id,
      name: resource.name,
      description: resource.description || '',
      capacity: String(resource.capacity || 1),
      resourceTypeId: String(resource.resourceTypeId)
    });
  };

  const handleSaveResource = async () => {
    if (!resourceModal.name.trim()) {
      alert('Please enter a resource name');
      return;
    }

    if (!resourceModal.resourceTypeId) {
      alert('Please select a resource type');
      return;
    }

    try {
      setResourceModal(prev => ({ ...prev, loading: true }));

      const payload: Record<string, unknown> = {
        name: resourceModal.name.trim(),
      };

      // Add resourceTypeId only for create mode
      if (!resourceModal.editMode) {
        payload.resourceTypeId = parseInt(resourceModal.resourceTypeId);
      }

      // Only add optional fields if they have values
      if (resourceModal.description.trim()) {
        payload.description = resourceModal.description.trim();
      }

      const capacity = parseInt(resourceModal.capacity);
      if (!isNaN(capacity) && capacity > 0) {
        payload.capacity = capacity;
      }

      if (resourceModal.editMode && resourceModal.editId) {
        // Update existing resource
        await apiService.patch(`/resources/${resourceModal.editId}`, payload);
      } else {
        // Create new resource
        payload.resourceTypeId = parseInt(resourceModal.resourceTypeId);
        await apiService.post('/resources', payload);
      }

      // Reload organization data
      await loadOrganizationData();

      // Close modal
      setResourceModal({
        isOpen: false,
        loading: false,
        editMode: false,
        editId: null,
        name: '',
        description: '',
        capacity: '1',
        resourceTypeId: ''
      });
    } catch (err: unknown) {
      console.error(`Failed to ${resourceModal.editMode ? 'update' : 'create'} resource:`, err);
      alert(`Failed to ${resourceModal.editMode ? 'update' : 'create'} resource: ${getErrorMessage(err, 'Unknown error')}`);
      setResourceModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleResourceModalClose = () => {
    setResourceModal({
      isOpen: false,
      loading: false,
      editMode: false,
      editId: null,
      name: '',
      description: '',
      capacity: '1',
      resourceTypeId: ''
    });
  };

  // Reservation handlers
  const handleAddReservationClick = () => {
    setReservationModal({
      isOpen: true,
      loading: false,
      resourceId: '',
      startDate: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      notes: '',
      quantity: '1'
    });
  };

  const handleSaveReservation = async () => {
    if (!reservationModal.resourceId) {
      alert('Please select a resource');
      return;
    }
    if (!reservationModal.customerName.trim() || !reservationModal.customerEmail.trim() || !reservationModal.customerPhone.trim()) {
      alert('Please fill in all required customer information');
      return;
    }

    try {
      setReservationModal(prev => ({ ...prev, loading: true }));

      // Combine date and time into ISO strings
      const startDateTime = new Date(`${reservationModal.startDate}T${reservationModal.startTime}:00`).toISOString();
      const endDateTime = new Date(`${reservationModal.startDate}T${reservationModal.endTime}:00`).toISOString();

      const payload = {
        resourceId: parseInt(reservationModal.resourceId),
        startTime: startDateTime,
        endTime: endDateTime,
        quantity: parseInt(reservationModal.quantity),
        customerName: reservationModal.customerName.trim(),
        customerEmail: reservationModal.customerEmail.trim(),
        customerPhone: reservationModal.customerPhone.trim(),
        notes: reservationModal.notes.trim() || undefined,
        status: 'CONFIRMED'
      };

      await apiService.post('/reservations', payload);

      // Reload organization data
      await loadOrganizationData();

      // Close modal
      setReservationModal({
        isOpen: false,
        loading: false,
        resourceId: '',
        startDate: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '10:00',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        notes: '',
        quantity: '1'
      });
    } catch (err: unknown) {
      console.error('Failed to create reservation:', err);
      alert(`Failed to create reservation: ${getErrorMessage(err, 'Unknown error')}`);
      setReservationModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleReservationModalClose = () => {
    setReservationModal({
      isOpen: false,
      loading: false,
      resourceId: '',
      startDate: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      notes: '',
      quantity: '1'
    });
  };

  if (loading && organizations.length === 0) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${themeColors.gradient} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading reservations...</p>
        </div>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${themeColors.gradient} flex items-center justify-center p-8`}>
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-12 max-w-2xl text-center shadow-xl">
          <div className="text-6xl mb-6">🏢</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">No Organizations Found</h2>
          <p className="text-gray-600 mb-6">
            You are not assigned to any organizations yet. Please contact your administrator to get access.
          </p>
          <div className={`${themeColors.badge} rounded-lg p-4`}>
            <p className="text-sm font-medium">
              <strong>Note:</strong> You need to be assigned to an organization with Store or Enterprise plan to access reservations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isMobile ? 'bg-gray-50' : `bg-gradient-to-br ${themeColors.gradient}`} relative`}>
      {/* Animated background elements - Desktop Only */}
      {!isMobile && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-300 to-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-indigo-300 to-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
        </div>
      )}

      {/* Header - Hidden on mobile (Dashboard handles it) */}
      {!isMobile && (
        <header className="relative z-10 backdrop-blur-sm bg-white/60 border-b border-blue-200 text-gray-800 py-6">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-semibold text-blue-900">
                🎯 Reservations Management
              </h1>
            </div>
          </div>
        </header>
      )}

      <main className={`relative z-10 max-w-7xl mx-auto ${isMobile ? 'p-4 mt-0' : 'p-6 mt-6'}`}>

        {/* Organization Selector */}
        <div className="mb-6 backdrop-blur-md bg-white/70 border border-blue-200 rounded-3xl p-6 shadow-xl hover:bg-white/80 transition-all duration-300">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">📋 Select Organization</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => {
                  setSelectedOrgId(org.id);
                  setSelectedOrg(org);
                }}
                className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                  selectedOrgId === org.id
                    ? `${themeColors.primary} text-white border-transparent shadow-lg scale-105`
                    : 'bg-white/50 border-gray-200 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className={`font-semibold text-lg ${selectedOrgId === org.id ? 'text-white' : 'text-gray-800'}`}>
                    {org.name}
                  </h3>
                  {getRoleBadge(org.role)}
                </div>
                {org.description && (
                  <p className={`text-sm ${selectedOrgId === org.id ? 'text-white/80' : 'text-gray-600'}`}>
                    {org.description}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        {selectedOrgId && (
          <>
            {/* Tab Navigation */}
            <div className="mb-6">
              <nav className="flex flex-wrap gap-2 p-2 bg-white/70 border border-blue-200 rounded-3xl backdrop-blur-md">
                {[
                  { key: 'overview', label: 'Overview', icon: '📊' },
                  { key: 'types', label: 'Resource Types', icon: '📋' },
                  { key: 'resources', label: 'Resources', icon: '🪑' },
                  { key: 'reservations', label: 'Reservations', icon: '📆' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() =>
                      setActiveView(
                        tab.key as 'overview' | 'types' | 'resources' | 'reservations',
                      )
                    }
                    className={`px-6 py-3 rounded-2xl font-medium text-sm transition-all duration-300 flex items-center gap-2 ${
                      activeView === tab.key
                        ? `${themeColors.primary} text-white shadow-lg scale-105`
                        : `${themeColors.accent} hover:bg-white/50 hover:scale-105`
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content Area */}
            <div className="min-h-96 backdrop-blur-md bg-white/70 border border-blue-200 rounded-3xl p-8 shadow-xl hover:bg-white/80 transition-all duration-300">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                  <strong>Error:</strong> {error}
                </div>
              )}

              {activeView === 'overview' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 Organization Overview</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                      <div className="text-4xl mb-2">📋</div>
                      <div className="text-3xl font-bold text-blue-600">{resourceTypes.length}</div>
                      <div className="text-gray-600 font-medium">Resource Types</div>
                    </div>
                    <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                      <div className="text-4xl mb-2">🪑</div>
                      <div className="text-3xl font-bold text-green-600">{resources.length}</div>
                      <div className="text-gray-600 font-medium">Resources</div>
                    </div>
                    <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
                      <div className="text-4xl mb-2">📆</div>
                      <div className="text-3xl font-bold text-purple-600">{reservations.length}</div>
                      <div className="text-gray-600 font-medium">Reservations</div>
                    </div>
                  </div>

                  {/* Permissions Info */}
                  <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">🔒 Your Permissions</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={canEdit() ? 'text-green-600' : 'text-gray-400'}>
                          {canEdit() ? '✓' : '✗'}
                        </span>
                        <span className="text-gray-700">Edit and delete resources & reservations</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={canManageUsers() ? 'text-green-600' : 'text-gray-400'}>
                          {canManageUsers() ? '✓' : '✗'}
                        </span>
                        <span className="text-gray-700">Manage organization users and settings</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={canManageUsers() ? 'text-green-600' : 'text-gray-400'}>
                          {canManageUsers() ? '✓' : '✗'}
                        </span>
                        <span className="text-gray-700">Delete organization (cascade)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeView === 'types' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">📋 Resource Types</h2>
                    <div className="flex gap-2">
                      {canManageUsers() && (
                        <button
                          onClick={handleInitializePublicBooking}
                          className="bg-purple-600 text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity"
                          title="Generate public booking tokens and default operating hours"
                        >
                          🔧 Initialize Public Booking
                        </button>
                      )}
                      {canEdit() && (
                        <button
                          onClick={handleAddResourceTypeClick}
                          className={`${themeColors.primary} text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity`}
                        >
                          + Add Resource Type
                        </button>
                      )}
                    </div>
                  </div>
                  {resourceTypes.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-6xl mb-4">📋</div>
                      <p className="text-lg">No resource types yet</p>
                      {canEdit() && <p className="text-sm mt-2">Click "Add Resource Type" to create one</p>}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {resourceTypes.map((type) => (
                        <div key={type.id} className="p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg text-gray-800">{type.name}</h3>
                              {type.description && <p className="text-gray-600 text-sm mt-1">{type.description}</p>}
                              <div className="flex gap-4 mt-2 text-sm text-gray-500">
                                {type.minBookingDuration && <span>Min: {type.minBookingDuration}m</span>}
                                {type.bufferTime && <span>Buffer: {type.bufferTime}m</span>}
                              </div>
                            </div>
                            {canEdit() && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditResourceTypeClick(type)}
                                  className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded-lg hover:bg-blue-50"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteClick('resourceType', type)}
                                  className="text-red-600 hover:text-red-800 px-3 py-1 rounded-lg hover:bg-red-50"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeView === 'resources' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">🪑 Resources</h2>
                    {canEdit() && (
                      <button
                        onClick={handleAddResourceClick}
                        className={`${themeColors.primary} text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity`}
                      >
                        + Add Resource
                      </button>
                    )}
                  </div>
                  {resources.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-6xl mb-4">🪑</div>
                      <p className="text-lg">No resources yet</p>
                      {canEdit() && <p className="text-sm mt-2">Click "Add Resource" to create one</p>}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {resources.map((resource) => (
                        <div key={resource.id} className="p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg text-gray-800">{resource.name}</h3>
                              {resource.description && <p className="text-gray-600 text-sm mt-1">{resource.description}</p>}
                              <div className="flex gap-4 mt-2 text-sm text-gray-500">
                                {resource.capacity && <span>Capacity: {resource.capacity}</span>}
                                {resource.resourceType && <span>Type: {resource.resourceType.name}</span>}
                              </div>
                              {resource.publicBookingToken && (
                                <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                                  <p className="text-xs font-semibold text-blue-800 mb-1">🔗 Public Booking Link:</p>
                                  <div className="flex items-center gap-2">
                                    <code className="text-xs text-blue-600 break-all flex-1">
                                      {window.location.origin}/public-booking/{resource.publicBookingToken}
                                    </code>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/public-booking/${resource.publicBookingToken}`);
                                        alert('Link copied to clipboard!');
                                      }}
                                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors flex-shrink-0"
                                      title="Copy link"
                                    >
                                      Copy
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                            {canEdit() && (
                              <div className="flex gap-2 ml-4">
                                <button
                                  onClick={() => handleEditResourceClick(resource)}
                                  className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded-lg hover:bg-blue-50 text-sm"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteClick('resource', resource)}
                                  className="text-red-600 hover:text-red-800 px-3 py-1 rounded-lg hover:bg-red-50 text-sm"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeView === 'reservations' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">📆 Reservations</h2>
                    {canEdit() && (
                      <button
                        onClick={handleAddReservationClick}
                        className={`${themeColors.primary} text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity`}
                      >
                        + Create Reservation
                      </button>
                    )}
                  </div>
                  {reservations.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-6xl mb-4">📆</div>
                      <p className="text-lg">No reservations yet</p>
                      <p className="text-sm mt-2">Reservations will appear here when customers book resources</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Resource</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Start Time</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">End Time</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                            {canEdit() && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {reservations.map((reservation) => (
                            <tr key={reservation.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-800">{reservation.resource?.name || 'N/A'}</td>
                              <td className="px-4 py-3 text-sm text-gray-800">
                                {reservation.customerName || 'N/A'}
                                {reservation.customerEmail && (
                                  <div className="text-xs text-gray-500">{reservation.customerEmail}</div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-800">
                                {new Date(reservation.startTime).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-800">
                                {new Date(reservation.endTime).toLocaleString()}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  reservation.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                  reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {reservation.status}
                                </span>
                              </td>
                              {canEdit() && (
                                <td className="px-4 py-3">
                                  <div className="flex gap-2">
                                    <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                                    <button
                                      onClick={() => handleDeleteClick('reservation', reservation)}
                                      className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Add/Edit Resource Type Modal */}
      {resourceTypeModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              📋 {resourceTypeModal.editMode ? 'Edit' : 'Add'} Resource Type
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={resourceTypeModal.name}
                  onChange={(e) => setResourceTypeModal(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Meeting Room, Desk, Equipment"
                  disabled={resourceTypeModal.loading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={resourceTypeModal.description}
                  onChange={(e) => setResourceTypeModal(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional description"
                  rows={3}
                  disabled={resourceTypeModal.loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Min Booking Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={resourceTypeModal.minBookingDuration}
                    onChange={(e) => setResourceTypeModal(prev => ({ ...prev, minBookingDuration: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    disabled={resourceTypeModal.loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Buffer Time (minutes)
                  </label>
                  <input
                    type="number"
                    value={resourceTypeModal.bufferTime}
                    onChange={(e) => setResourceTypeModal(prev => ({ ...prev, bufferTime: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    disabled={resourceTypeModal.loading}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleResourceTypeModalClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                disabled={resourceTypeModal.loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveResourceType}
                className={`flex-1 px-4 py-2 ${themeColors.primary} text-white rounded-xl font-medium transition-opacity ${resourceTypeModal.loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={resourceTypeModal.loading}
              >
                {resourceTypeModal.loading
                  ? (resourceTypeModal.editMode ? 'Saving...' : 'Creating...')
                  : (resourceTypeModal.editMode ? 'Save' : 'Create')
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Resource Modal */}
      {resourceModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              🪑 {resourceModal.editMode ? 'Edit' : 'Add'} Resource
            </h2>

            {resourceTypes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">You need to create a resource type first before adding resources.</p>
                <button
                  onClick={() => {
                    handleResourceModalClose();
                    handleAddResourceTypeClick();
                  }}
                  className={`${themeColors.primary} text-white px-4 py-2 rounded-xl font-medium`}
                >
                  Create Resource Type
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={resourceModal.name}
                      onChange={(e) => setResourceModal(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Conference Room A, Desk #12"
                      disabled={resourceModal.loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={resourceModal.description}
                      onChange={(e) => setResourceModal(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Optional description"
                      rows={3}
                      disabled={resourceModal.loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Resource Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={resourceModal.resourceTypeId}
                      onChange={(e) => setResourceModal(prev => ({ ...prev, resourceTypeId: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={resourceModal.loading}
                    >
                      {resourceTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Capacity
                    </label>
                    <input
                      type="number"
                      value={resourceModal.capacity}
                      onChange={(e) => setResourceModal(prev => ({ ...prev, capacity: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                      disabled={resourceModal.loading}
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={handleResourceModalClose}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    disabled={resourceModal.loading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveResource}
                    className={`flex-1 px-4 py-2 ${themeColors.primary} text-white rounded-xl font-medium transition-opacity ${resourceModal.loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={resourceModal.loading}
                  >
                    {resourceModal.loading
                      ? (resourceModal.editMode ? 'Saving...' : 'Creating...')
                      : (resourceModal.editMode ? 'Save' : 'Create')
                    }
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${deleteModal.type === 'resourceType' ? 'Resource Type' : deleteModal.type === 'organization' ? 'Organization' : deleteModal.type || 'Item'}`}
        itemName={deleteModal.item?.name || 'Unknown'}
        itemType={deleteModal.type || 'resource'}
        cascadePreview={deleteModal.preview}
        isLoading={deleteModal.loading}
      />

      {/* Create Reservation Modal */}
      {reservationModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Reservation</h2>

            <div className="space-y-4">
              {/* Resource Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resource <span className="text-red-500">*</span>
                </label>
                <select
                  value={reservationModal.resourceId}
                  onChange={(e) => setReservationModal(prev => ({ ...prev, resourceId: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={reservationModal.loading}
                >
                  <option value="">Select a resource</option>
                  {resources.map(resource => (
                    <option key={resource.id} value={resource.id}>
                      {resource.name} ({resource.resourceType?.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={reservationModal.startDate}
                  onChange={(e) => setReservationModal(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={reservationModal.loading}
                />
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={reservationModal.startTime}
                    onChange={(e) => setReservationModal(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={reservationModal.loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={reservationModal.endTime}
                    onChange={(e) => setReservationModal(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={reservationModal.loading}
                  />
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={reservationModal.quantity}
                  onChange={(e) => setReservationModal(prev => ({ ...prev, quantity: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={reservationModal.loading}
                />
              </div>

              {/* Customer Information */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={reservationModal.customerName}
                      onChange={(e) => setReservationModal(prev => ({ ...prev, customerName: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={reservationModal.loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={reservationModal.customerEmail}
                      onChange={(e) => setReservationModal(prev => ({ ...prev, customerEmail: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={reservationModal.loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={reservationModal.customerPhone}
                      onChange={(e) => setReservationModal(prev => ({ ...prev, customerPhone: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={reservationModal.loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={reservationModal.notes}
                      onChange={(e) => setReservationModal(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      disabled={reservationModal.loading}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveReservation}
                disabled={reservationModal.loading}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reservationModal.loading ? 'Creating...' : 'Create Reservation'}
              </button>
              <button
                onClick={handleReservationModalClose}
                disabled={reservationModal.loading}
                className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(ReservationsPanel);


