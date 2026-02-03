/**
 * AdminOrganisationPanel - Refactored organization management
 *
 * This component uses modular sub-components for better maintainability and follows
 * the same patterns as AdminUserPanel with centralized services and theming.
 */

import React, { useState, useEffect } from 'react';
import { Card, Button } from '../ui';
import { getThemeConfig } from '../../constants/theme';
import {
  useOrganizationList,
  useOrganizationDetails,
  useAvailableUsers
} from '../../hooks/useOrganizationData';
import { OrganizationList } from './organization/OrganizationList';
import { OrganizationOverview } from './organization/OrganizationOverview';
import { OrganizationMembersPanel } from './organization/OrganizationMembersPanel';
import { OrganizationFormModal } from './organization/OrganizationFormModal';
import { RoleAssignmentModal } from './organization/RoleAssignmentModal';
import { ConfirmationDialog } from './organization/ConfirmationDialog';

export interface AdminOrganisationPanelProps {
  /** Current theme color for styling */
  themeColor?: string;
  /** Whether the panel is currently active/visible */
  isActive?: boolean;
  /** Callback when data changes (for parent refresh) */
  onDataChange?: () => void;
}

/**
 * Main organization management panel
 */
export const AdminOrganisationPanel: React.FC<AdminOrganisationPanelProps> = ({
  themeColor = '#3b82f6',
  isActive = false,
  onDataChange
}) => {
  const theme = getThemeConfig(themeColor);

  // Selected organization state
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'members'>('overview');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Hooks for data management
  const {
    organizations,
    loading: orgListLoading,
    error: orgListError,
    loadOrganizations,
    createOrganization,
    deleteOrganization,
  } = useOrganizationList();

  const {
    organization,
    members,
    loading: orgDetailsLoading,
    error: orgDetailsError,
    loadOrganizationData,
    assignMemberRole,
    removeMember,
  } = useOrganizationDetails(selectedOrgId);

  const {
    users: availableUsers,
    loadUsers,
  } = useAvailableUsers();

  // Load initial data when component becomes active
  useEffect(() => {
    if (isActive) {
      loadOrganizations();
      loadUsers();
    }
  }, [isActive, loadOrganizations, loadUsers]);

  // Load organization details when selection changes
  useEffect(() => {
    if (selectedOrgId) {
      loadOrganizationData();
    }
  }, [selectedOrgId, loadOrganizationData]);

  /**
   * Handle organization selection
   */
  const handleSelectOrganization = (orgId: number) => {
    setSelectedOrgId(orgId);
    setActiveView('overview');
  };

  /**
   * Handle organization creation
   */
  const handleCreateOrganization = async (name: string, description: string) => {
    const success = await createOrganization(name, description);
    if (success) {
      onDataChange?.();
    }
  };

  /**
   * Handle organization deletion with confirmation
   */
  const handleDeleteOrganization = (orgId: number) => {
    const org = organizations.find(o => o.id === orgId);
    if (!org) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Organization',
      message: `Are you sure you want to delete "${org.name}"? This action cannot be undone and will remove all associated data.`,
      onConfirm: async () => {
        const success = await deleteOrganization(orgId);
        if (success) {
          if (selectedOrgId === orgId) {
            setSelectedOrgId(null);
          }
          onDataChange?.();
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  /**
   * Handle member role assignment
   */
  const handleAssignMemberRole = async (
    userId: number,
    role: 'admin' | 'editor' | 'user'
  ) => {
    const success = await assignMemberRole(userId, role);
    if (success) {
      onDataChange?.();
    }
  };

  /**
   * Handle member removal with confirmation
   */
  const handleRemoveMember = (userId: number, isAdmin: boolean) => {
    const member = members.find(m => m.id === userId);
    if (!member) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Remove Member',
      message: `Are you sure you want to remove ${member.username} from this organization?`,
      onConfirm: async () => {
        const success = await removeMember(userId, isAdmin);
        if (success) {
          onDataChange?.();
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Calculate statistics
  const adminCount = members.filter(m => m.organizationRole === 'admin').length;
  const userCount = members.filter(m => m.organizationRole !== 'admin').length;

  // Combined error message
  const error = orgListError || orgDetailsError;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🏛️ Organizations</h2>
          <p className="text-gray-600 mt-1">Manage organizations and their members</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className={`${theme.button} text-white mt-4 sm:mt-0`}
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

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Organization List */}
        <div className="lg:col-span-1">
          <Card>
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Organizations</h3>
              <p className="text-sm text-gray-600">{organizations.length} total</p>
            </div>
            <div className="p-4">
              <OrganizationList
                organizations={organizations}
                onSelectOrganization={handleSelectOrganization}
                onDeleteOrganization={handleDeleteOrganization}
                selectedOrgId={selectedOrgId}
                loading={orgListLoading}
                themeColor={themeColor}
              />
            </div>
          </Card>
        </div>

        {/* Right: Organization Details */}
        <div className="lg:col-span-2">
          {selectedOrgId ? (
            <div className="space-y-6">
              {/* View Toggle */}
              <div className="flex space-x-2 border-b border-gray-200">
                <button
                  onClick={() => setActiveView('overview')}
                  className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                    activeView === 'overview'
                      ? `border-${theme.primary}-500 text-${theme.primary}-600`
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  📊 Overview
                </button>
                <button
                  onClick={() => setActiveView('members')}
                  className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                    activeView === 'members'
                      ? `border-${theme.primary}-500 text-${theme.primary}-600`
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  👥 Members ({members.length})
                </button>
              </div>

              {/* View Content */}
              {activeView === 'overview' && (
                <OrganizationOverview
                  organization={organization}
                  adminCount={adminCount}
                  userCount={userCount}
                  calendarCount={0}
                  loading={orgDetailsLoading}
                  themeColor={themeColor}
                />
              )}

              {activeView === 'members' && (
                <OrganizationMembersPanel
                  members={members}
                  onRemoveMember={handleRemoveMember}
                  onAddMember={() => setShowRoleModal(true)}
                  loading={orgDetailsLoading}
                  themeColor={themeColor}
                />
              )}
            </div>
          ) : (
            <Card>
              <div className="p-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">🏛️</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Select an Organization
                </h3>
                <p className="text-gray-600">
                  Choose an organization from the list to view details and manage members
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Modals */}
      <OrganizationFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateOrganization}
        loading={orgListLoading}
        themeColor={themeColor}
      />

      <RoleAssignmentModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        onAssign={handleAssignMemberRole}
        availableUsers={availableUsers}
        currentMembers={members}
        loading={orgDetailsLoading}
        themeColor={themeColor}
      />

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        variant="danger"
        loading={orgListLoading || orgDetailsLoading}
      />
    </div>
  );
};

export default AdminOrganisationPanel;

