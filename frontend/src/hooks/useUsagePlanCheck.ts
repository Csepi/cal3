/**
 * useUsagePlanCheck hook - Check user permissions based on usage plans
 *
 * This hook provides utilities to check if a user has the necessary usage plans
 * to perform various organization and role management operations.
 */

import { useState, useEffect } from 'react';
import { profileApi } from '../services/profileApi';

export interface UsagePlanPermissions {
  /** Whether user can create and manage organizations */
  canManageOrganizations: boolean;
  /** Whether user can assign admin roles */
  canAssignAdmins: boolean;
  /** Whether user can assign editor roles */
  canAssignEditors: boolean;
  /** Whether user can add regular users */
  canAddUsers: boolean;
  /** User's current usage plans */
  usagePlans: string[];
  /** Whether data is loading */
  loading: boolean;
  /** Error message if any */
  error: string | null;
}

export interface RolePermissions {
  /** Role identifier */
  role: 'admin' | 'editor' | 'user';
  /** Display label for the role */
  label: string;
  /** Description of the role */
  description: string;
  /** Whether this role is available to the user */
  available: boolean;
  /** Required usage plans for this role */
  requiredPlans: string[];
}

/**
 * Check if user has any of the required usage plans
 */
const hasRequiredPlan = (userPlans: string[], requiredPlans: string[]): boolean => {
  return requiredPlans.some(plan => userPlans.includes(plan));
};

/**
 * Hook to check user permissions based on usage plans
 */
export const useUsagePlanCheck = () => {
  const [permissions, setPermissions] = useState<UsagePlanPermissions>({
    canManageOrganizations: false,
    canAssignAdmins: false,
    canAssignEditors: false,
    canAddUsers: false,
    usagePlans: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    loadUserPermissions();
  }, []);

  const loadUserPermissions = async () => {
    try {
      const userProfile = (await profileApi.getUserProfile()) as { usagePlans?: string[] };
      const usagePlans = userProfile.usagePlans || ['user'];

      // Organization management requires store or enterprise plan
      const canManageOrganizations = hasRequiredPlan(usagePlans, ['store', 'enterprise']);

      // Admin assignment requires store or enterprise plan
      const canAssignAdmins = hasRequiredPlan(usagePlans, ['store', 'enterprise']);

      // Editor assignment requires store or enterprise plan
      const canAssignEditors = hasRequiredPlan(usagePlans, ['store', 'enterprise']);

      // Adding users requires at least user plan (default)
      const canAddUsers = hasRequiredPlan(usagePlans, ['user', 'store', 'enterprise']);

      setPermissions({
        canManageOrganizations,
        canAssignAdmins,
        canAssignEditors,
        canAddUsers,
        usagePlans,
        loading: false,
        error: null,
      });
    } catch (err) {
      setPermissions(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load user permissions',
      }));
    }
  };

  /**
   * Get available roles based on user's usage plans
   */
  const getAvailableRoles = (): RolePermissions[] => {
    return [
      {
        role: 'admin',
        label: 'Administrator',
        description: 'Full control over the organization, can manage members and settings',
        available: permissions.canAssignAdmins,
        requiredPlans: ['store', 'enterprise'],
      },
      {
        role: 'editor',
        label: 'Editor',
        description: 'Can manage reservations and bookings, but cannot modify organization settings',
        available: permissions.canAssignEditors,
        requiredPlans: ['store', 'enterprise'],
      },
      {
        role: 'user',
        label: 'User',
        description: 'Basic access to view and create own reservations',
        available: permissions.canAddUsers,
        requiredPlans: ['user', 'store', 'enterprise'],
      },
    ];
  };

  /**
   * Check if a specific role can be assigned
   */
  const canAssignRole = (role: 'admin' | 'editor' | 'user'): boolean => {
    switch (role) {
      case 'admin':
        return permissions.canAssignAdmins;
      case 'editor':
        return permissions.canAssignEditors;
      case 'user':
        return permissions.canAddUsers;
      default:
        return false;
    }
  };

  /**
   * Get upgrade message for locked features
   */
  const getUpgradeMessage = (feature: 'organizations' | 'admin' | 'editor'): string => {
    const featureMessages = {
      organizations: 'Upgrade to Store or Enterprise plan to create and manage organizations',
      admin: 'Upgrade to Store or Enterprise plan to assign organization administrators',
      editor: 'Upgrade to Store or Enterprise plan to assign organization editors',
    };

    return featureMessages[feature];
  };

  return {
    permissions,
    getAvailableRoles,
    canAssignRole,
    getUpgradeMessage,
    refresh: loadUserPermissions,
  };
};

export default useUsagePlanCheck;
