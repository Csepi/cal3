/**
 * useOrganizationData hook - Handle organization data fetching and management
 *
 * This custom hook provides all data operations for organizations including
 * loading organizations, organization details, members, and performing CRUD operations.
 */

import { useState, useCallback } from 'react';
import { loadAdminData, adminApiCall, formatAdminError } from '../components/admin/adminApiService';
import type { Organisation, OrganisationAdmin, User } from '../components/admin/types';

export interface MemberWithRole extends User {
  /** Organization role (admin, editor, or user) */
  organizationRole: 'admin' | 'editor' | 'user';
  /** When the user was assigned to this role */
  assignedAt?: string;
  /** Whether this is an organization admin */
  isOrgAdmin?: boolean;
}

export interface OrganizationData {
  /** The organization details */
  organization: Organisation | null;
  /** Organization administrators */
  admins: OrganisationAdmin[];
  /** All organization members with their roles */
  members: MemberWithRole[];
  /** Loading state */
  loading: boolean;
  /** Error message if present */
  error: string | null;
}

/**
 * Hook to manage organization list operations
 */
export const useOrganizationList = () => {
  const [organizations, setOrganizations] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load all organizations
   */
  const loadOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const orgData = await loadAdminData<Organisation[]>('/admin/organizations');
      setOrganizations(orgData);

    } catch (err) {
      console.error('Error loading organizations:', err);
      setError(formatAdminError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new organization
   */
  const createOrganization = useCallback(async (name: string, description?: string) => {
    try {
      setLoading(true);
      setError(null);

      await adminApiCall({
        endpoint: '/organisations',
        method: 'POST',
        data: { name: name.trim(), description: description?.trim() }
      });

      // Reload organizations
      await loadOrganizations();

      return true;
    } catch (err) {
      console.error('Error creating organization:', err);
      setError(formatAdminError(err));
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadOrganizations]);

  /**
   * Delete an organization
   */
  const deleteOrganization = useCallback(async (orgId: number) => {
    try {
      setLoading(true);
      setError(null);

      await adminApiCall({
        endpoint: `/organisations/${orgId}`,
        method: 'DELETE'
      });

      // Reload organizations
      await loadOrganizations();

      return true;
    } catch (err) {
      console.error('Error deleting organization:', err);
      setError(formatAdminError(err));
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadOrganizations]);

  return {
    organizations,
    loading,
    error,
    loadOrganizations,
    createOrganization,
    deleteOrganization,
  };
};

/**
 * Hook to manage organization details and members
 */
export const useOrganizationDetails = (orgId: number | null) => {
  const [data, setData] = useState<OrganizationData>({
    organization: null,
    admins: [],
    members: [],
    loading: false,
    error: null,
  });

  /**
   * Load organization details and all members
   */
  const loadOrganizationData = useCallback(async () => {
    if (!orgId) return;

    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // Load organization details
      const orgResponse = await adminApiCall({
        endpoint: `/organisations/${orgId}`,
        method: 'GET'
      });

      // Load organization admins
      const adminsResponse = await adminApiCall({
        endpoint: `/organisations/${orgId}/admins`,
        method: 'GET'
      });

      // Load organization users (includes editors and regular users)
      const usersResponse = await adminApiCall({
        endpoint: `/organisations/${orgId}/users`,
        method: 'GET'
      });

      // Combine admins and users into a unified members list
      const adminUserIds = adminsResponse.data.map((admin: OrganisationAdmin) => admin.userId);

      // Map admins to members with role
      const adminMembers: MemberWithRole[] = adminsResponse.data.map((admin: OrganisationAdmin) => ({
        ...admin.user,
        organizationRole: 'admin' as const,
        assignedAt: admin.createdAt,
        isOrgAdmin: true,
      }));

      // Map other users to members with their roles
      type OrganizationUser = User & Partial<Pick<MemberWithRole, 'organizationRole' | 'assignedAt'>>;
      const otherMembers: MemberWithRole[] = (usersResponse.data || [])
        .filter((user: OrganizationUser) => !adminUserIds.includes(user.id))
        .map((user: OrganizationUser) => ({
          ...user,
          organizationRole: user.organizationRole || 'user' as const,
          assignedAt: user.assignedAt,
          isOrgAdmin: false,
        }));

      setData({
        organization: orgResponse,
        admins: adminsResponse.data,
        members: [...adminMembers, ...otherMembers],
        loading: false,
        error: null,
      });

    } catch (err) {
      console.error('Error loading organization data:', err);
      setData(prev => ({
        ...prev,
        loading: false,
        error: formatAdminError(err),
      }));
    }
  }, [orgId]);

  /**
   * Assign a user to a role in the organization
   */
  const assignMemberRole = useCallback(async (
    userId: number,
    role: 'admin' | 'editor' | 'user'
  ): Promise<boolean> => {
    if (!orgId) return false;

    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // Use the assign endpoint that accepts role
      await adminApiCall({
        endpoint: `/organisations/${orgId}/users/assign`,
        method: 'POST',
        data: { userId, role }
      });

      // Reload organization data
      await loadOrganizationData();

      return true;
    } catch (err) {
      console.error('Error assigning member role:', err);
      setData(prev => ({
        ...prev,
        loading: false,
        error: formatAdminError(err),
      }));
      return false;
    }
  }, [orgId, loadOrganizationData]);

  /**
   * Remove a member from the organization
   */
  const removeMember = useCallback(async (userId: number, isAdmin: boolean): Promise<boolean> => {
    if (!orgId) return false;

    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      if (isAdmin) {
        // Remove organization admin
        await adminApiCall({
          endpoint: `/organisations/${orgId}/admins/${userId}`,
          method: 'DELETE'
        });
      } else {
        // Remove regular user/editor
        await adminApiCall({
          endpoint: `/admin/users/${userId}/organizations/${orgId}`,
          method: 'DELETE'
        });
      }

      // Reload organization data
      await loadOrganizationData();

      return true;
    } catch (err) {
      console.error('Error removing member:', err);
      setData(prev => ({
        ...prev,
        loading: false,
        error: formatAdminError(err),
      }));
      return false;
    }
  }, [orgId, loadOrganizationData]);

  return {
    ...data,
    loadOrganizationData,
    assignMemberRole,
    removeMember,
  };
};

/**
 * Hook to get all available users for assignment
 */
export const useAvailableUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const userData = await loadAdminData<User[]>('/admin/users');
      setUsers(userData);

    } catch (err) {
      console.error('Error loading users:', err);
      setError(formatAdminError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    users,
    loading,
    error,
    loadUsers,
  };
};
