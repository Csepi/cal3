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
import type {
  Booking,
  Organization as DomainOrganization,
  Resource as DomainResource,
  ResourceType as DomainResourceType,
} from '../types';

import { tStatic } from '../i18n';

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

interface Organization extends DomainOrganization {
  role?: string;
}

interface ResourceType extends DomainResourceType {
  minBookingDuration?: number;
  bufferTime?: number;
}

interface Resource extends DomainResource {
  resourceType?: ResourceType;
}

interface Reservation extends Booking {
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
  type ThemeColors = {
    gradient: string;
    primary: string;
    accent: string;
    badge: string;
  };

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
  const getThemeColors = (color: string): ThemeColors => {
    const colorMap: Record<string, ThemeColors> = {
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
      let preview: DeletionPreview | undefined;
      if (type === 'organization') {
        preview = await apiService.get<DeletionPreview>(`/organisations/${item.id}/deletion-preview`);
      } else if (type === 'resourceType') {
        preview = await apiService.get<DeletionPreview>(`/resource-types/${item.id}/deletion-preview`);
      } else if (type === 'resource') {
        preview = await apiService.get<DeletionPreview>(`/resources/${item.id}/deletion-preview`);
      }

      setDeleteModal(prev => ({
        ...prev,
        preview: preview ?? null,
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
        await loadOrganizationData();
      } else if (deleteModal.type === 'resource') {
        await apiService.delete(`/resources/${deleteModal.item.id}/cascade`);
        // Reload resources for this organization
        await loadOrganizationData();
      } else if (deleteModal.type === 'reservation') {
        await apiService.delete(`/reservations/${deleteModal.item.id}`);
        // Reload reservations for this organization
        await loadOrganizationData();
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

  const getDeleteItemName = (item: DeletableItem | null): string => {
    if (!item) return tStatic('admin:reservations.unknownItem');
    if ('name' in item && typeof item.name === 'string') {
      return item.name;
    }
    const reservationCustomerName =
      'customerName' in item && typeof item.customerName === 'string'
        ? item.customerName
        : null;
    if (reservationCustomerName) {
      return reservationCustomerName;
    }
    return tStatic('admin:reservations.reservationNumber', { id: item.id });
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
    if (!confirm(tStatic('common:auto.frontend.k06cb91a03fb9'))) {
      return;
    }

    try {
      setLoading(true);
      const result = (await apiService.post('/admin/public-booking/initialize', {})) as {
        resourcesUpdated: number;
        resourceTypesWithHours: number;
        errors: string[];
      };

      const errors =
        result.errors.length > 0
          ? tStatic('admin:reservations.initBookingErrors', {
            errors: result.errors.join('\n'),
          })
          : '';
      alert(
        tStatic('admin:reservations.initBookingSuccess', {
          resourcesUpdated: result.resourcesUpdated,
          resourceTypesWithHours: result.resourceTypesWithHours,
          errors,
        }),
      );

      // Reload data to show updated tokens
      await loadOrganizationData();
    } catch (err: unknown) {
      console.error('Failed to initialize public booking:', err);
      alert(
        tStatic('admin:reservations.initBookingError', {
          error: getErrorMessage(err, tStatic('admin:reservations.unknownError')),
        }),
      );
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
      alert(tStatic('common:auto.frontend.k0e71ac3919dd'));
      return;
    }

    if (!resourceTypeModal.editMode && !selectedOrgId) {
      alert(tStatic('common:auto.frontend.k5685fdac56a2'));
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
      alert(
        resourceTypeModal.editMode
          ? tStatic('admin:reservations.updateResourceTypeError', {
            error: getErrorMessage(err, tStatic('admin:reservations.unknownError')),
          })
          : tStatic('admin:reservations.createResourceTypeError', {
            error: getErrorMessage(err, tStatic('admin:reservations.unknownError')),
          }),
      );
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
      alert(tStatic('common:auto.frontend.k02cb2a87ae82'));
      return;
    }

    if (!resourceModal.resourceTypeId) {
      alert(tStatic('common:auto.frontend.kb47bedb469a6'));
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
      alert(
        resourceModal.editMode
          ? tStatic('admin:reservations.updateResourceError', {
            error: getErrorMessage(err, tStatic('admin:reservations.unknownError')),
          })
          : tStatic('admin:reservations.createResourceError', {
            error: getErrorMessage(err, tStatic('admin:reservations.unknownError')),
          }),
      );
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
      alert(tStatic('common:auto.frontend.k5255a85e5f17'));
      return;
    }
    if (!reservationModal.customerName.trim() || !reservationModal.customerEmail.trim() || !reservationModal.customerPhone.trim()) {
      alert(tStatic('common:auto.frontend.k1a9c468ad813'));
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
      alert(
        tStatic('admin:reservations.createReservationError', {
          error: getErrorMessage(err, tStatic('admin:reservations.unknownError')),
        }),
      );
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
          <p className="text-gray-600 text-lg">{tStatic('common:auto.frontend.k44b91203c407')}</p>
        </div>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${themeColors.gradient} flex items-center justify-center p-8`}>
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-12 max-w-2xl text-center shadow-xl">
          <div className="text-6xl mb-6">🏢</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">{tStatic('common:auto.frontend.k1e717a0dea80')}</h2>
          <p className="text-gray-600 mb-6">
            {tStatic('common:auto.frontend.ka1e68006ddbc')}</p>
          <div className={`${themeColors.badge} rounded-lg p-4`}>
            <p className="text-sm font-medium">
              <strong>{tStatic('common:auto.frontend.k83423c198b60')}</strong> {tStatic('common:auto.frontend.k9baa06eaf046')}</p>
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
                {tStatic('common:auto.frontend.kbba4bb6ec590')}</h1>
            </div>
          </div>
        </header>
      )}

      <main className={`relative z-10 max-w-7xl mx-auto ${isMobile ? 'p-4 mt-0' : 'p-6 mt-6'}`}>

        {/* Organization Selector */}
        <div className="mb-6 backdrop-blur-md bg-white/70 border border-blue-200 rounded-3xl p-6 shadow-xl hover:bg-white/80 transition-all duration-300">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{tStatic('common:auto.frontend.k7c0e1044bfd4')}</h2>
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
                  { key: 'overview', label: tStatic('admin:reservations.overviewTab'), icon: '📊' },
                  { key: 'types', label: tStatic('admin:reservations.resourceTypesTab'), icon: '📋' },
                  { key: 'resources', label: tStatic('admin:reservations.resourcesTab'), icon: '🪑' },
                  { key: 'reservations', label: tStatic('admin:reservations.reservationsTab'), icon: '📆' }
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
                  <strong>{tStatic('common:auto.frontend.k787aa1617c37')}</strong> {error}
                </div>
              )}

              {activeView === 'overview' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">{tStatic('common:auto.frontend.k77ce17d7c7e6')}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                      <div className="text-4xl mb-2">📋</div>
                      <div className="text-3xl font-bold text-blue-600">{resourceTypes.length}</div>
                      <div className="text-gray-600 font-medium">{tStatic('common:auto.frontend.k4830bf222d91')}</div>
                    </div>
                    <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                      <div className="text-4xl mb-2">🪑</div>
                      <div className="text-3xl font-bold text-green-600">{resources.length}</div>
                      <div className="text-gray-600 font-medium">{tStatic('common:auto.frontend.k87df60de337f')}</div>
                    </div>
                    <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
                      <div className="text-4xl mb-2">📆</div>
                      <div className="text-3xl font-bold text-purple-600">{reservations.length}</div>
                      <div className="text-gray-600 font-medium">{tStatic('common:auto.frontend.kfe5c54bbae46')}</div>
                    </div>
                  </div>

                  {/* Permissions Info */}
                  <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">{tStatic('common:auto.frontend.kb0ac20fea7bf')}</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={canEdit() ? 'text-green-600' : 'text-gray-400'}>
                          {canEdit() ? '✓' : '✗'}
                        </span>
                        <span className="text-gray-700">{tStatic('common:auto.frontend.k3c7e4c8bab24')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={canManageUsers() ? 'text-green-600' : 'text-gray-400'}>
                          {canManageUsers() ? '✓' : '✗'}
                        </span>
                        <span className="text-gray-700">{tStatic('common:auto.frontend.k3677bc8315fc')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={canManageUsers() ? 'text-green-600' : 'text-gray-400'}>
                          {canManageUsers() ? '✓' : '✗'}
                        </span>
                        <span className="text-gray-700">{tStatic('common:auto.frontend.kd293030f3753')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeView === 'types' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">{tStatic('common:auto.frontend.k1d3142586dd2')}</h2>
                    <div className="flex gap-2">
                      {canManageUsers() && (
                        <button
                          onClick={handleInitializePublicBooking}
                          className="bg-purple-600 text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity"
                          title={tStatic('common:auto.frontend.kaea6af44e5f2')}
                        >
                          {tStatic('common:auto.frontend.k31ac798d0151')}</button>
                      )}
                      {canEdit() && (
                        <button
                          onClick={handleAddResourceTypeClick}
                          className={`${themeColors.primary} text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity`}
                        >
                          {tStatic('common:auto.frontend.k968b74a982ac')}</button>
                      )}
                    </div>
                  </div>
                  {resourceTypes.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-6xl mb-4">📋</div>
                      <p className="text-lg">{tStatic('common:auto.frontend.ka47a88cdef1e')}</p>
                      {canEdit() && <p className="text-sm mt-2">{tStatic('common:auto.frontend.k9ed1c0d8eccb')}</p>}
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
                                {type.minBookingDuration && <span>{tStatic('common:auto.frontend.k21be6e4ee37c')}{type.minBookingDuration}m</span>}
                                {type.bufferTime && <span>{tStatic('common:auto.frontend.k19ffcea72ce5')}{type.bufferTime}m</span>}
                              </div>
                            </div>
                            {canEdit() && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditResourceTypeClick(type)}
                                  className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded-lg hover:bg-blue-50"
                                >
                                  {tStatic('common:auto.frontend.k5301648dcf6b')}</button>
                                <button
                                  onClick={() => handleDeleteClick('resourceType', type)}
                                  className="text-red-600 hover:text-red-800 px-3 py-1 rounded-lg hover:bg-red-50"
                                >
                                  {tStatic('common:auto.frontend.kf6fdbe48dc54')}</button>
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
                    <h2 className="text-2xl font-bold text-gray-800">{tStatic('common:auto.frontend.ke5db679b7c26')}</h2>
                    {canEdit() && (
                      <button
                        onClick={handleAddResourceClick}
                        className={`${themeColors.primary} text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity`}
                      >
                        {tStatic('common:auto.frontend.kc91b65e04724')}</button>
                    )}
                  </div>
                  {resources.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-6xl mb-4">🪑</div>
                      <p className="text-lg">{tStatic('common:auto.frontend.kfb9519a57e4c')}</p>
                      {canEdit() && <p className="text-sm mt-2">{tStatic('common:auto.frontend.k906c0548976d')}</p>}
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
                                {resource.capacity && <span>{tStatic('common:auto.frontend.k218347e0b411')}{resource.capacity}</span>}
                                {resource.resourceType && <span>{tStatic('common:auto.frontend.kee3fb11d05c9')}{resource.resourceType.name}</span>}
                              </div>
                              {resource.publicBookingToken && (
                                <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                                  <p className="text-xs font-semibold text-blue-800 mb-1">{tStatic('common:auto.frontend.kae79dbe3bdeb')}</p>
                                  <div className="flex items-center gap-2">
                                    <code className="text-xs text-blue-600 break-all flex-1">
                                      {window.location.origin}/public-booking/{resource.publicBookingToken}
                                    </code>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/public-booking/${resource.publicBookingToken}`);
                                        alert(tStatic('common:auto.frontend.k88574a26f3fc'));
                                      }}
                                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors flex-shrink-0"
                                      title={tStatic('common:auto.frontend.k2f84eea5d45d')}
                                    >
                                      {tStatic('common:auto.frontend.kaf74f7c5362a')}</button>
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
                                  {tStatic('common:auto.frontend.k5301648dcf6b')}</button>
                                <button
                                  onClick={() => handleDeleteClick('resource', resource)}
                                  className="text-red-600 hover:text-red-800 px-3 py-1 rounded-lg hover:bg-red-50 text-sm"
                                >
                                  {tStatic('common:auto.frontend.kf6fdbe48dc54')}</button>
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
                    <h2 className="text-2xl font-bold text-gray-800">{tStatic('common:auto.frontend.k7854b94e302c')}</h2>
                    {canEdit() && (
                      <button
                        onClick={handleAddReservationClick}
                        className={`${themeColors.primary} text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity`}
                      >
                        {tStatic('common:auto.frontend.k0204b5c93ca5')}</button>
                    )}
                  </div>
                  {reservations.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-6xl mb-4">📆</div>
                      <p className="text-lg">{tStatic('common:auto.frontend.kdcc08dcf854a')}</p>
                      <p className="text-sm mt-2">{tStatic('common:auto.frontend.k2d2f8f3d7053')}</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tStatic('common:auto.frontend.k021493f340d3')}</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tStatic('common:auto.frontend.k0e85749a6f40')}</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tStatic('common:auto.frontend.k41c1074ddb72')}</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tStatic('common:auto.frontend.k4c640e925e8b')}</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tStatic('common:auto.frontend.kbae7d5be7082')}</th>
                            {canEdit() && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tStatic('common:auto.frontend.kc3cd636a585b')}</th>}
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
                                    <button className="text-blue-600 hover:text-blue-800 text-sm">{tStatic('common:auto.frontend.k5301648dcf6b')}</button>
                                    <button
                                      onClick={() => handleDeleteClick('reservation', reservation)}
                                      className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                      {tStatic('common:auto.frontend.kf6fdbe48dc54')}</button>
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
              📋 {resourceTypeModal.editMode ? 'Edit' : 'Add'} {tStatic('common:auto.frontend.k1a4838822911')}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {tStatic('common:auto.frontend.k709a23220f2c')}<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={resourceTypeModal.name}
                  onChange={(e) => setResourceTypeModal(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={tStatic('common:auto.frontend.kb3d95eec0f37')}
                  disabled={resourceTypeModal.loading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {tStatic('common:auto.frontend.k55f8ebc805e6')}</label>
                <textarea
                  value={resourceTypeModal.description}
                  onChange={(e) => setResourceTypeModal(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={tStatic('common:auto.frontend.ka6eacf69e186')}
                  rows={3}
                  disabled={resourceTypeModal.loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {tStatic('common:auto.frontend.ka63587030d01')}</label>
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
                    {tStatic('common:auto.frontend.k64ff0da1954c')}</label>
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
                {tStatic('common:auto.frontend.k77dfd2135f4d')}</button>
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
              🪑 {resourceModal.editMode ? 'Edit' : 'Add'} {tStatic('common:auto.frontend.k021493f340d3')}</h2>

            {resourceTypes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">{tStatic('common:auto.frontend.k73aa35d2e2b3')}</p>
                <button
                  onClick={() => {
                    handleResourceModalClose();
                    handleAddResourceTypeClick();
                  }}
                  className={`${themeColors.primary} text-white px-4 py-2 rounded-xl font-medium`}
                >
                  {tStatic('common:auto.frontend.k5a488a010d6a')}</button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {tStatic('common:auto.frontend.k709a23220f2c')}<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={resourceModal.name}
                      onChange={(e) => setResourceModal(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={tStatic('common:auto.frontend.k52aed95c4579')}
                      disabled={resourceModal.loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {tStatic('common:auto.frontend.k55f8ebc805e6')}</label>
                    <textarea
                      value={resourceModal.description}
                      onChange={(e) => setResourceModal(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={tStatic('common:auto.frontend.ka6eacf69e186')}
                      rows={3}
                      disabled={resourceModal.loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {tStatic('common:auto.frontend.k1a4838822911')}<span className="text-red-500">*</span>
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
                      {tStatic('common:auto.frontend.k45bd908df490')}</label>
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
                    {tStatic('common:auto.frontend.k77dfd2135f4d')}</button>
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
        itemName={getDeleteItemName(deleteModal.item)}
        itemType={deleteModal.type || 'resource'}
        cascadePreview={deleteModal.preview ?? undefined}
        isLoading={deleteModal.loading}
      />

      {/* Create Reservation Modal */}
      {reservationModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{tStatic('common:auto.frontend.k30303fe608eb')}</h2>

            <div className="space-y-4">
              {/* Resource Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tStatic('common:auto.frontend.k021493f340d3')}<span className="text-red-500">*</span>
                </label>
                <select
                  value={reservationModal.resourceId}
                  onChange={(e) => setReservationModal(prev => ({ ...prev, resourceId: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={reservationModal.loading}
                >
                  <option value="">{tStatic('common:auto.frontend.kbd1e22abe48e')}</option>
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
                  {tStatic('common:auto.frontend.keb9a4bc1c0c1')}<span className="text-red-500">*</span>
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
                    {tStatic('common:auto.frontend.k41c1074ddb72')}<span className="text-red-500">*</span>
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
                    {tStatic('common:auto.frontend.k4c640e925e8b')}<span className="text-red-500">*</span>
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
                  {tStatic('common:auto.frontend.k44f6af694554')}<span className="text-red-500">*</span>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{tStatic('common:auto.frontend.kc996cd1052de')}</h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {tStatic('common:auto.frontend.k64346b483c0a')}<span className="text-red-500">*</span>
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
                      {tStatic('common:auto.frontend.k84add5b29527')}<span className="text-red-500">*</span>
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
                      {tStatic('common:auto.frontend.k77064d526523')}<span className="text-red-500">*</span>
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
                      {tStatic('common:auto.frontend.k70440046a3dc')}</label>
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
                {tStatic('common:auto.frontend.k77dfd2135f4d')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(ReservationsPanel);


