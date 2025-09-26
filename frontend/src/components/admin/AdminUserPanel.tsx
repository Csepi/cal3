/**
 * AdminUserPanel component for user management operations
 *
 * This component provides comprehensive user management functionality including
 * user listing, creation, editing, deletion, and bulk operations. It supports
 * advanced selection patterns, filtering, and usage plan management.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, Button, Input } from '../ui';
import { loadAdminData, formatAdminError, bulkDelete, bulkUpdateUsagePlans, adminApiCall, getAdminToken } from './adminApiService';
import type { User, SelectionState } from './types';
import { USAGE_PLAN_OPTIONS } from '../../constants';

export interface AdminUserPanelProps {
  /** Current theme color for styling */
  themeColor?: string;
  /** Whether the panel is currently active/visible */
  isActive?: boolean;
  /** Callback when user data changes (for parent refresh) */
  onDataChange?: () => void;
}

/**
 * Comprehensive user management panel with CRUD operations and bulk actions
 */
export const AdminUserPanel: React.FC<AdminUserPanelProps> = ({
  themeColor,
  isActive = false,
  onDataChange
}) => {
  // Data state
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Selection state for bulk operations
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number>(-1);

  // Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  /**
   * Load users from the API with progress tracking
   */
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const userData = await loadAdminData<User[]>('/admin/users');
      setUsers(userData);
      setSelectedUsers([]); // Clear selection on reload
      onDataChange?.();

    } catch (err) {
      console.error('Error loading users:', err);
      setError(formatAdminError(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Auto-load users when component becomes active
   */
  useEffect(() => {
    if (isActive) {
      loadUsers();
    }
  }, [isActive]);

  /**
   * Handle user selection with shift+click support for range selection
   */
  const handleUserSelection = (
    userId: number,
    isChecked: boolean,
    shiftKey: boolean = false
  ) => {
    if (shiftKey && lastSelectedIndex !== -1) {
      // Range selection with shift+click
      const currentIndex = users.findIndex(user => user.id === userId);
      const startIndex = Math.min(currentIndex, lastSelectedIndex);
      const endIndex = Math.max(currentIndex, lastSelectedIndex);

      const rangeIds = users.slice(startIndex, endIndex + 1).map(user => user.id);
      const newSelected = [...new Set([...selectedUsers, ...rangeIds])];
      setSelectedUsers(newSelected);
    } else {
      // Regular selection
      if (isChecked) {
        setSelectedUsers([...selectedUsers, userId]);
      } else {
        setSelectedUsers(selectedUsers.filter(id => id !== userId));
      }

      const currentIndex = users.findIndex(user => user.id === userId);
      setLastSelectedIndex(currentIndex);
    }
  };

  /**
   * Select all visible users (respecting current filters)
   */
  const selectAllVisible = () => {
    const visibleUsers = getFilteredUsers();
    const visibleIds = visibleUsers.map(user => user.id);
    const allSelected = visibleIds.every(id => selectedUsers.includes(id));

    if (allSelected) {
      // Deselect all visible
      setSelectedUsers(selectedUsers.filter(id => !visibleIds.includes(id)));
    } else {
      // Select all visible
      const newSelected = [...new Set([...selectedUsers, ...visibleIds])];
      setSelectedUsers(newSelected);
    }
  };

  /**
   * Get filtered users based on search and filter criteria
   */
  const getFilteredUsers = (): User[] => {
    return users.filter(user => {
      // Text search
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          user.username.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          (user.firstName?.toLowerCase().includes(searchLower)) ||
          (user.lastName?.toLowerCase().includes(searchLower));

        if (!matchesSearch) return false;
      }

      // Role filter
      if (roleFilter !== 'all' && user.role !== roleFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const isActive = statusFilter === 'active';
        if (user.isActive !== isActive) return false;
      }

      return true;
    });
  };

  /**
   * Handle bulk user deletion
   */
  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;

    const confirmMessage = `Are you sure you want to delete ${selectedUsers.length} user(s)? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) return;

    try {
      setLoading(true);
      const result = await bulkDelete('/admin/users', selectedUsers);

      if (result.failed > 0) {
        setError(`Deleted ${result.success} users, failed to delete ${result.failed} users.`);
      } else {
        setError(''); // Clear any previous errors
      }

      // Reload users to reflect changes
      await loadUsers();

    } catch (err) {
      console.error('Error in bulk delete:', err);
      setError(formatAdminError(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete a single user
   */
  const handleDeleteUser = async (userId: number, username: string) => {
    const confirmMessage = `Are you sure you want to delete user "${username}"? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) return;

    try {
      setLoading(true);
      const token = getAdminToken();
      if (!token) {
        throw new Error('No admin token found. Please login as admin.');
      }

      await adminApiCall({
        endpoint: `/admin/users/${userId}`,
        token,
        method: 'DELETE'
      });

      // Reload users to reflect changes
      await loadUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(formatAdminError(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle user edit (placeholder for future modal implementation)
   */
  const handleEditUser = async (user: User) => {
    // For now, we'll implement a simple prompt-based edit
    // In a real application, this would open a modal with a proper form

    const newUsername = window.prompt('Enter new username:', user.username);
    if (!newUsername || newUsername === user.username) return;

    const newEmail = window.prompt('Enter new email:', user.email);
    if (!newEmail || newEmail === user.email) return;

    try {
      setLoading(true);
      const token = getAdminToken();
      if (!token) {
        throw new Error('No admin token found. Please login as admin.');
      }

      await adminApiCall({
        endpoint: `/admin/users/${user.id}`,
        token,
        method: 'PATCH',
        data: {
          username: newUsername,
          email: newEmail
        }
      });

      // Reload users to reflect changes
      await loadUsers();
    } catch (err) {
      console.error('Error updating user:', err);
      setError(formatAdminError(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle bulk usage plan updates
   */
  const handleBulkUsagePlanUpdate = async (
    plans: string[],
    operation: 'set' | 'add' | 'remove'
  ) => {
    if (selectedUsers.length === 0 || plans.length === 0) return;

    try {
      setLoading(true);
      const result = await bulkUpdateUsagePlans(selectedUsers, plans, operation);

      if (result.failed > 0) {
        setError(`Updated ${result.success} users, failed to update ${result.failed} users.`);
      } else {
        setError(''); // Clear any previous errors
      }

      // Reload users to reflect changes
      await loadUsers();

    } catch (err) {
      console.error('Error in bulk usage plan update:', err);
      setError(formatAdminError(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format user display name
   */
  const getUserDisplayName = (user: User): string => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username;
  };

  /**
   * Format usage plans for display
   */
  const formatUsagePlans = (plans: string[] | undefined): string => {
    if (!plans || plans.length === 0) return 'None';
    return plans.map(plan =>
      plan.charAt(0).toUpperCase() + plan.slice(1)
    ).join(', ');
  };

  const filteredUsers = getFilteredUsers();
  const visibleIds = filteredUsers.map(user => user.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedUsers.includes(id));
  const someVisibleSelected = visibleIds.some(id => selectedUsers.includes(id));

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <Card
        themeColor={themeColor}
        padding="lg"
        header={
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span>👥</span>
                <h2 className="text-xl font-bold text-gray-800">User Management</h2>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
                  {filteredUsers.length} users
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadUsers}
                  loading={loading}
                  themeColor={themeColor}
                >
                  Refresh
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  themeColor={themeColor}
                >
                  Add User
                </Button>
              </div>
            </div>
          </CardHeader>
        }
      >
        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            themeColor={themeColor}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <div className="flex items-center space-x-2">
            {selectedUsers.length > 0 && (
              <span className="text-sm text-gray-600">
                {selectedUsers.length} selected
              </span>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium text-blue-800">
                {selectedUsers.length} user(s) selected
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  Delete Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  themeColor={themeColor}
                >
                  Bulk Edit Plans
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someVisibleSelected && !allVisibleSelected;
                    }}
                    onChange={selectAllVisible}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage Plans
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className={selectedUsers.includes(user.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => handleUserSelection(user.id, e.target.checked, e.shiftKey)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {getUserDisplayName(user).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{getUserDisplayName(user)}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'admin'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatUsagePlans(user.usagePlans)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        themeColor={themeColor}
                        onClick={() => handleEditUser(user)}
                        disabled={loading}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        disabled={loading}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {!loading && filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">👥</div>
            <p className="text-gray-600 mb-4">No users found</p>
            {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                }}
                themeColor={themeColor}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading users...</p>
          </div>
        )}
      </Card>
    </div>
  );
};