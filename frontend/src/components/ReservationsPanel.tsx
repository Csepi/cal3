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

import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { UserPermissionsService } from '../services/userPermissions';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface ReservationsPanelProps {
  themeColor?: string;
}

interface Organization {
  id: number;
  name: string;
  description?: string;
  role?: 'USER' | 'EDITOR' | 'ORG_ADMIN';
}

interface ResourceType {
  id: number;
  name: string;
  description?: string;
  organisationId: number;
  minBookingDuration?: number;
  bufferTime?: number;
  isActive: boolean;
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

const ReservationsPanel: React.FC<ReservationsPanelProps> = ({ themeColor = '#3b82f6' }) => {
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
    item: any;
    preview: any;
    loading: boolean;
  }>({
    isOpen: false,
    type: null,
    item: null,
    preview: null,
    loading: false
  });

  // Theme configuration
  const getThemeColors = (color: string) => {
    const colorMap: Record<string, any> = {
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

      const orgs = await UserPermissionsService.getAccessibleOrganizations();

      // Get user-organization roles from the organizations endpoint
      const orgsWithRoles = await Promise.all(
        orgs.map(async (org) => {
          try {
            // Try to get organization users to determine role
            const users = await apiService.get(`/organisations/${org.id}/users/list`);
            const currentUser = users.find((u: any) => u.userId === org.userId);
            return {
              ...org,
              role: currentUser?.role || 'USER'
            };
          } catch (err) {
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
    } catch (err: any) {
      console.error('Failed to load organizations:', err);
      setError(err.message || 'Failed to load organizations');
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
      const types = await apiService.get(`/resource-types?organisationId=${selectedOrgId}`);
      setResourceTypes(types);

      // Load resources for this organization
      const resourcesData = await apiService.get('/resources');
      const orgResources = resourcesData.filter((r: Resource) =>
        r.resourceType?.organisationId === selectedOrgId
      );
      setResources(orgResources);

      // Load reservations for this organization's resources
      const reservationsData = await apiService.get('/reservations');
      const orgResourceIds = orgResources.map((r: Resource) => r.id);
      const orgReservations = reservationsData.filter((res: Reservation) =>
        orgResourceIds.includes(res.resourceId)
      );
      setReservations(orgReservations);

    } catch (err: any) {
      console.error('Failed to load organization data:', err);
      setError(err.message || 'Failed to load data');
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
  const handleDeleteClick = async (type: 'organization' | 'resourceType' | 'resource' | 'reservation', item: any) => {
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
    } catch (err: any) {
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
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete item');
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
    <div className={`min-h-screen bg-gradient-to-br ${themeColors.gradient} relative`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-300 to-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-indigo-300 to-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
      </div>

      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-thin mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            🎯 Reservations Management
          </h1>
          <p className="text-gray-700 text-xl font-light">
            Manage your organization's resources and bookings
          </p>
        </div>

        {/* Organization Selector */}
        <div className="mb-8 bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-blue-200 shadow-lg">
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
                    onClick={() => setActiveView(tab.key as any)}
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
            <div className="min-h-96 bg-white/80 backdrop-blur-md border border-blue-200 rounded-3xl p-8 shadow-lg">
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
                    {canEdit() && (
                      <button className={`${themeColors.primary} text-white px-4 py-2 rounded-xl font-medium`}>
                        + Add Resource Type
                      </button>
                    )}
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
                                <button className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded-lg hover:bg-blue-50">
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
                      <button className={`${themeColors.primary} text-white px-4 py-2 rounded-xl font-medium`}>
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
                                <button className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded-lg hover:bg-blue-50 text-sm">
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
      </div>

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
    </div>
  );
};

export default ReservationsPanel;