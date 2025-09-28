/**
 * AdminOrganisationPanel component for organization and admin management
 *
 * This component provides comprehensive organization management functionality including
 * organization listing, admin assignment, reservation calendar management, and role assignment.
 * It follows the same pattern as other admin panels with proper error handling and theming.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, Button, Input } from '../ui';
import { loadAdminData, formatAdminError, adminApiCall, getAdminToken } from './adminApiService';
import { getThemeConfig } from '../../constants';
import type { Organisation, OrganisationAdmin, ReservationCalendar, User } from './types';

export interface AdminOrganisationPanelProps {
  /** Current theme color for styling */
  themeColor?: string;
  /** Whether the panel is currently active/visible */
  isActive?: boolean;
  /** Callback when data changes (for parent refresh) */
  onDataChange?: () => void;
}

/**
 * Comprehensive organization management panel with admin assignment and calendar management
 */
export const AdminOrganisationPanel: React.FC<AdminOrganisationPanelProps> = ({
  themeColor = '#3b82f6',
  isActive = false,
  onDataChange
}) => {
  const themeConfig = getThemeConfig(themeColor);

  // Data state
  const [organizations, setOrganizations] = useState<Organisation[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [orgAdmins, setOrgAdmins] = useState<OrganisationAdmin[]>([]);
  const [orgUsers, setOrgUsers] = useState<User[]>([]);
  const [reservationCalendars, setReservationCalendars] = useState<ReservationCalendar[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // UI state
  const [activeTab, setActiveTab] = useState<'overview' | 'admins' | 'users' | 'calendars'>('overview');
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [showAssignAdminModal, setShowAssignAdminModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showCreateCalendarModal, setShowCreateCalendarModal] = useState(false);

  // Form state
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDescription, setNewOrgDescription] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [newCalendarName, setNewCalendarName] = useState('');
  const [newCalendarDescription, setNewCalendarDescription] = useState('');

  /**
   * Load organizations from the API
   */
  const loadOrganizations = async () => {
    try {
      setLoading(true);
      setError('');

      const orgData = await loadAdminData<Organisation[]>('/organisations');
      setOrganizations(orgData);
      onDataChange?.();

    } catch (err) {
      console.error('Error loading organizations:', err);
      setError(formatAdminError(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load all users for admin assignment
   */
  const loadAllUsers = async () => {
    try {
      const userData = await loadAdminData<User[]>('/admin/users');
      setAllUsers(userData);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  /**
   * Load organization-specific data when an organization is selected
   */
  const loadOrganizationData = async (orgId: number) => {
    try {
      setLoading(true);

      // Load organization admins
      const adminsData = await loadAdminData<OrganisationAdmin[]>(`/organisations/${orgId}/admins`);
      setOrgAdmins(adminsData);

      // Load organization users
      const usersData = await loadAdminData<User[]>(`/organisations/${orgId}/users`);
      setOrgUsers(usersData);

      // Load reservation calendars (temporarily disabled)
      // const calendarsData = await loadAdminData<ReservationCalendar[]>(`/organisations/${orgId}/reservation-calendars`);
      // setReservationCalendars(calendarsData);
      setReservationCalendars([]);

    } catch (err) {
      console.error('Error loading organization data:', err);
      setError(formatAdminError(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle organization selection
   */
  const handleOrganizationSelect = (orgId: number) => {
    setSelectedOrgId(orgId);
    setActiveTab('overview');
    loadOrganizationData(orgId);
  };

  /**
   * Create new organization
   */
  const handleCreateOrganization = async () => {
    if (!newOrgName.trim()) {
      setError('Organization name is required');
      return;
    }

    if (newOrgName.trim().length < 3) {
      setError('Organization name must be at least 3 characters');
      return;
    }

    if (newOrgName.trim().length > 100) {
      setError('Organization name cannot exceed 100 characters');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const token = await getAdminToken();

      await adminApiCall({
        endpoint: '/organisations',
        token,
        method: 'POST',
        data: {
          name: newOrgName.trim(),
          description: newOrgDescription.trim() || undefined
        }
      });

      setNewOrgName('');
      setNewOrgDescription('');
      setShowCreateOrgModal(false);
      await loadOrganizations();

    } catch (err) {
      console.error('Error creating organization:', err);
      const errorMessage = formatAdminError(err);
      setError(errorMessage.includes('already exists') ?
        'An organization with this name already exists' :
        errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Assign organization admin
   */
  const handleAssignAdmin = async () => {
    if (!selectedOrgId || !selectedUserId) {
      setError('Please select a user to assign as admin');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const token = await getAdminToken();

      await adminApiCall({
        endpoint: `/organisations/${selectedOrgId}/admins`,
        token,
        method: 'POST',
        data: { userId: selectedUserId }
      });

      setSelectedUserId(null);
      setShowAssignAdminModal(false);
      await loadOrganizationData(selectedOrgId);

    } catch (err) {
      console.error('Error assigning admin:', err);
      const errorMessage = formatAdminError(err);
      setError(errorMessage.includes('already') ?
        'User is already an admin of this organization' :
        errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Remove organization admin
   */
  const handleRemoveAdmin = async (userId: number) => {
    if (!selectedOrgId) return;

    try {
      setLoading(true);
      const token = await getAdminToken();

      await adminApiCall({
        endpoint: `/organisations/${selectedOrgId}/admins/${userId}`,
        token,
        method: 'DELETE'
      });

      await loadOrganizationData(selectedOrgId);

    } catch (err) {
      console.error('Error removing admin:', err);
      setError(formatAdminError(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add user to organization
   */
  const handleAddUser = async () => {
    if (!selectedOrgId || !selectedUserId) return;

    try {
      setLoading(true);
      const token = await getAdminToken();

      await adminApiCall({
        endpoint: `/organisations/${selectedOrgId}/users`,
        token,
        method: 'POST',
        data: { userId: selectedUserId }
      });

      setSelectedUserId(null);
      setShowAddUserModal(false);
      await loadOrganizationData(selectedOrgId);

    } catch (err) {
      console.error('Error adding user:', err);
      setError(formatAdminError(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create reservation calendar
   */
  const handleCreateCalendar = async () => {
    if (!selectedOrgId) {
      setError('No organization selected');
      return;
    }

    if (!newCalendarName.trim()) {
      setError('Calendar name is required');
      return;
    }

    if (newCalendarName.trim().length < 3) {
      setError('Calendar name must be at least 3 characters');
      return;
    }

    if (newCalendarName.trim().length > 100) {
      setError('Calendar name cannot exceed 100 characters');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const token = await getAdminToken();

      await adminApiCall({
        endpoint: `/organisations/${selectedOrgId}/reservation-calendars`,
        token,
        method: 'POST',
        data: {
          name: newCalendarName.trim(),
          description: newCalendarDescription.trim() || undefined,
          color: themeColor
        }
      });

      setNewCalendarName('');
      setNewCalendarDescription('');
      setShowCreateCalendarModal(false);
      await loadOrganizationData(selectedOrgId);

    } catch (err) {
      console.error('Error creating calendar:', err);
      const errorMessage = formatAdminError(err);
      setError(errorMessage.includes('already exists') ?
        'A calendar with this name already exists in this organization' :
        errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Auto-load data when component becomes active
   */
  useEffect(() => {
    if (isActive) {
      loadOrganizations();
      loadAllUsers();
    }
  }, [isActive]);

  /**
   * Get available users for admin assignment (exclude current admins)
   */
  const getAvailableUsers = () => {
    const adminUserIds = orgAdmins.map(admin => admin.userId);
    return allUsers.filter(user => {
      // Exclude users who are already organization admins
      if (adminUserIds.includes(user.id)) return false;

      // Exclude global admins
      if (user.role === 'admin') return false;

      // Only include users with Store or Enterprise plans for organization admin assignment
      const hasRequiredPlan = user.usagePlans &&
        (user.usagePlans.includes('STORE') || user.usagePlans.includes('ENTERPRISE'));

      return hasRequiredPlan;
    });
  };

  /**
   * Get available users for organization (exclude current members)
   */
  const getAvailableOrgUsers = () => {
    const memberUserIds = orgUsers.map(user => user.id);
    return allUsers.filter(user => {
      // Exclude users who are already organization members
      if (memberUserIds.includes(user.id)) return false;

      // Only include users with Store or Enterprise plans for organization membership
      const hasRequiredPlan = user.usagePlans &&
        (user.usagePlans.includes('STORE') || user.usagePlans.includes('ENTERPRISE'));

      return hasRequiredPlan;
    });
  };

  /**
   * Render organization overview
   */
  const renderOverview = () => {
    const selectedOrg = organizations.find(org => org.id === selectedOrgId);
    if (!selectedOrg) return null;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold text-gray-900">{selectedOrg.name}</h3>
            <p className="text-gray-600">{selectedOrg.description || 'No description provided'}</p>
          </CardHeader>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`bg-gradient-to-r ${themeConfig.gradientBg} p-4 rounded-lg`}>
                <div className="text-2xl font-bold text-gray-800">{orgAdmins.length}</div>
                <div className="text-sm text-gray-600">Administrators</div>
              </div>
              <div className={`bg-gradient-to-r ${themeConfig.gradientBg} p-4 rounded-lg`}>
                <div className="text-2xl font-bold text-gray-800">{orgUsers.length}</div>
                <div className="text-sm text-gray-600">Users</div>
              </div>
              <div className={`bg-gradient-to-r ${themeConfig.gradientBg} p-4 rounded-lg`}>
                <div className="text-2xl font-bold text-gray-800">{reservationCalendars.length}</div>
                <div className="text-sm text-gray-600">Reservation Calendars</div>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Created: {new Date(selectedOrg.createdAt).toLocaleDateString()}
            </div>
          </div>
        </Card>
      </div>
    );
  };

  /**
   * Render admins tab
   */
  const renderAdmins = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Organization Administrators</h3>
        <Button
          onClick={() => setShowAssignAdminModal(true)}
          className={`${themeConfig.buttonClass} ${themeConfig.buttonHover}`}
        >
          + Assign Admin
        </Button>
      </div>
      <Card>
        <div className="p-6">
          {orgAdmins.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No administrators assigned to this organization
            </div>
          ) : (
            <div className="space-y-3">
              {orgAdmins.map(admin => (
                <div key={admin.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">
                      {admin.user.firstName} {admin.user.lastName}
                    </div>
                    <div className="text-sm text-gray-600">{admin.user.email}</div>
                    <div className="text-xs text-gray-500">
                      Assigned: {new Date(admin.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleRemoveAdmin(admin.userId)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  /**
   * Render users tab
   */
  const renderUsers = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Organization Users</h3>
        <Button
          onClick={() => setShowAddUserModal(true)}
          className={`${themeConfig.buttonClass} ${themeConfig.buttonHover}`}
        >
          + Add User
        </Button>
      </div>
      <Card>
        <div className="p-6">
          {orgUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No users in this organization
            </div>
          ) : (
            <div className="space-y-3">
              {orgUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                    <div className="text-xs text-gray-500">Role: {user.role}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  /**
   * Render calendars tab
   */
  const renderCalendars = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Reservation Calendars</h3>
        <Button
          onClick={() => setShowCreateCalendarModal(true)}
          className={`${themeConfig.buttonClass} ${themeConfig.buttonHover}`}
        >
          + Create Calendar
        </Button>
      </div>
      <Card>
        <div className="p-6">
          {reservationCalendars.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No reservation calendars in this organization
            </div>
          ) : (
            <div className="space-y-3">
              {reservationCalendars.map(calendar => (
                <div key={calendar.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{calendar.calendar.name}</div>
                      <div className="text-sm text-gray-600">{calendar.calendar.description}</div>
                      <div className="text-xs text-gray-500">
                        Created by: {calendar.createdBy.firstName} {calendar.createdBy.lastName}
                      </div>
                    </div>
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: calendar.calendar.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🏛️ Organizations</h2>
          <p className="text-gray-600 mt-1">Manage organizations, admins, and reservation calendars</p>
        </div>
        <Button
          onClick={() => setShowCreateOrgModal(true)}
          className={`${themeConfig.buttonClass} ${themeConfig.buttonHover} mt-4 sm:mt-0`}
        >
          + Create Organization
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Organizations List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Organizations</h3>
              <p className="text-sm text-gray-600">Select an organization to manage</p>
            </CardHeader>
            <div className="p-6">
              {loading && organizations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading organizations...</p>
                </div>
              ) : organizations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No organizations found
                </div>
              ) : (
                <div className="space-y-2">
                  {organizations.map(org => (
                    <button
                      key={org.id}
                      onClick={() => handleOrganizationSelect(org.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedOrgId === org.id
                          ? `bg-gradient-to-r ${themeConfig.gradientBg} text-gray-800`
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{org.name}</div>
                      <div className="text-sm text-gray-600 truncate">{org.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Organization Details */}
        <div className="lg:col-span-2">
          {selectedOrgId ? (
            <div className="space-y-6">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { id: 'overview', label: 'Overview', icon: '📊' },
                    { id: 'admins', label: 'Admins', icon: '👑' },
                    { id: 'users', label: 'Users', icon: '👥' },
                    { id: 'calendars', label: 'Calendars', icon: '📅' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                        activeTab === tab.id
                          ? `border-blue-500 ${themeConfig.textColor}`
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="mr-2">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'admins' && renderAdmins()}
              {activeTab === 'users' && renderUsers()}
              {activeTab === 'calendars' && renderCalendars()}
            </div>
          ) : (
            <Card>
              <div className="p-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">🏛️</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Select an Organization</h3>
                <p className="text-gray-600">Choose an organization from the list to view and manage its details</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Create Organization Modal */}
      {showCreateOrgModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Organization</h3>
            <div className="space-y-4">
              <Input
                placeholder="Organization name"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
              />
              <textarea
                placeholder="Description (optional)"
                value={newOrgDescription}
                onChange={(e) => setNewOrgDescription(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg resize-none"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                onClick={() => {
                  setShowCreateOrgModal(false);
                  setNewOrgName('');
                  setNewOrgDescription('');
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateOrganization}
                disabled={!newOrgName.trim() || loading}
                className={`${themeConfig.buttonClass} ${themeConfig.buttonHover}`}
              >
                {loading ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Admin Modal */}
      {showAssignAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Organization Admin</h3>
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Note:</span> Only users with Store or Enterprise plans can be assigned as organization administrators.
              </div>
              <select
                value={selectedUserId || ''}
                onChange={(e) => setSelectedUserId(Number(e.target.value) || null)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select a user</option>
                {getAvailableUsers().map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                onClick={() => {
                  setShowAssignAdminModal(false);
                  setSelectedUserId(null);
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignAdmin}
                disabled={!selectedUserId || loading}
                className={`${themeConfig.buttonClass} ${themeConfig.buttonHover}`}
              >
                {loading ? 'Assigning...' : 'Assign'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add User to Organization</h3>
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Note:</span> Only users with Store or Enterprise plans can be added to organizations.
              </div>
              <select
                value={selectedUserId || ''}
                onChange={(e) => setSelectedUserId(Number(e.target.value) || null)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select a user</option>
                {getAvailableOrgUsers().map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                onClick={() => {
                  setShowAddUserModal(false);
                  setSelectedUserId(null);
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddUser}
                disabled={!selectedUserId || loading}
                className={`${themeConfig.buttonClass} ${themeConfig.buttonHover}`}
              >
                {loading ? 'Adding...' : 'Add User'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Calendar Modal */}
      {showCreateCalendarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Reservation Calendar</h3>
            <div className="space-y-4">
              <Input
                placeholder="Calendar name"
                value={newCalendarName}
                onChange={(e) => setNewCalendarName(e.target.value)}
              />
              <textarea
                placeholder="Description (optional)"
                value={newCalendarDescription}
                onChange={(e) => setNewCalendarDescription(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg resize-none"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                onClick={() => {
                  setShowCreateCalendarModal(false);
                  setNewCalendarName('');
                  setNewCalendarDescription('');
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCalendar}
                disabled={!newCalendarName.trim() || loading}
                className={`${themeConfig.buttonClass} ${themeConfig.buttonHover}`}
              >
                {loading ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};