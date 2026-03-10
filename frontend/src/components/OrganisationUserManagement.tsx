import { useState, useEffect } from 'react';
import { http } from '../lib/http';
import { UserPermissionsService } from '../services/userPermissions';
import type { Organization, User } from '../types';

import { tStatic } from '../i18n';

interface OrganisationUser extends User {
  id: number;
  organisationRole: 'admin' | 'editor' | 'user';
  joinedAt: string;
}

interface Organisation extends Organization {
  users: OrganisationUser[];
}

interface OrganisationUserManagementProps {
  themeColor?: string;
}

const OrganisationUserManagement: React.FC<OrganisationUserManagementProps> = ({ themeColor = '#3b82f6' }) => {
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [orgUsers, setOrgUsers] = useState<OrganisationUser[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modal states
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showRoleChangeModal, setShowRoleChangeModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserRole, setSelectedUserRole] = useState<'admin' | 'editor' | 'user'>('user');
  const [userToChangeRole, setUserToChangeRole] = useState<OrganisationUser | null>(null);

  useEffect(() => {
    loadUserOrganisations();
  }, []);

  useEffect(() => {
    if (selectedOrgId) {
      loadOrganisationUsers(selectedOrgId);
      loadAvailableUsers();
    }
  }, [selectedOrgId]);

  const loadUserOrganisations = async () => {
    setLoading(true);
    try {
      const permissions = await UserPermissionsService.getUserPermissions();

      if (permissions.isSuperAdmin) {
        // Super admins can see all organizations
        const response = await http.get<Organisation[]>('/api/organisations');
        setOrganisations(response);
      } else {
        // Regular users can only see organizations they admin
        const adminOrgIds = permissions.adminOrganizationIds;
        if (adminOrgIds.length > 0) {
          const orgPromises = adminOrgIds.map(id => http.get<Organisation>(`/api/organisations/${id}`));
          const orgs = await Promise.all(orgPromises);
          setOrganisations(orgs);
        }
      }

      // Auto-select first organization if available
      if (organisations.length > 0 && !selectedOrgId) {
        setSelectedOrgId(organisations[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const loadOrganisationUsers = async (orgId: number) => {
    try {
      const response = await http.get<{ data?: OrganisationUser[] } | OrganisationUser[]>(`/api/organisations/${orgId}/users`);
      const users = Array.isArray(response) ? response : (response.data ?? []);
      setOrgUsers(users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organization users');
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await http.get<User[]>('/api/admin/users');
      // Filter users with Store or Enterprise plans who aren't already in the organization
      const eligibleUsers = response.filter((user: User) => {
        const hasRequiredPlan = user.usagePlans &&
          (user.usagePlans.includes('STORE') || user.usagePlans.includes('ENTERPRISE'));
        const isNotInOrg = !orgUsers.some(orgUser => orgUser.id === user.id);
        return hasRequiredPlan && isNotInOrg;
      });
      setAvailableUsers(eligibleUsers);
    } catch (err) {
      console.error('Failed to load available users:', err);
    }
  };

  const handleAddUser = async () => {
    if (!selectedOrgId || !selectedUserId) return;

    try {
      setLoading(true);
      await http.post(`/api/organisations/${selectedOrgId}/users`, {
        userId: selectedUserId,
        role: selectedUserRole
      });

      await loadOrganisationUsers(selectedOrgId);
      await loadAvailableUsers();
      setShowAddUserModal(false);
      setSelectedUserId(null);
      setSelectedUserRole('user');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add user to organization');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async () => {
    if (!selectedOrgId || !userToChangeRole) return;

    try {
      setLoading(true);
      await http.patch(`/api/organisations/${selectedOrgId}/users/${userToChangeRole.id}/role`, {
        role: selectedUserRole
      });

      await loadOrganisationUsers(selectedOrgId);
      setShowRoleChangeModal(false);
      setUserToChangeRole(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change user role');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId: number) => {
    if (!selectedOrgId) return;

    if (!confirm(tStatic('common:auto.frontend.k9860e37e9923'))) return;

    try {
      setLoading(true);
      await http.delete(`/api/organisations/${selectedOrgId}/users/${userId}`);
      await loadOrganisationUsers(selectedOrgId);
      await loadAvailableUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove user');
    } finally {
      setLoading(false);
    }
  };

  const openRoleChangeModal = (user: OrganisationUser) => {
    setUserToChangeRole(user);
    setSelectedUserRole(user.organisationRole);
    setShowRoleChangeModal(true);
  };

  const getThemeColors = (color: string): { primary: string; border: string; text: string } => {
    const colorMap: Record<string, { primary: string; border: string; text: string }> = {
      '#ef4444': { primary: 'bg-red-500 hover:bg-red-600', border: 'border-red-200', text: 'text-red-600' },
      '#f59e0b': { primary: 'bg-orange-500 hover:bg-orange-600', border: 'border-orange-200', text: 'text-orange-600' },
      '#3b82f6': { primary: 'bg-blue-500 hover:bg-blue-600', border: 'border-blue-200', text: 'text-blue-600' },
    };
    return colorMap[color] || colorMap['#3b82f6'];
  };

  const themeColors = getThemeColors(themeColor);

  const selectedOrg = organisations.find(org => org.id === selectedOrgId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">{tStatic('common:auto.frontend.keec0895930d7')}</h2>
        {selectedOrgId && (
          <button
            onClick={() => setShowAddUserModal(true)}
            className={`${themeColors.primary} text-white px-4 py-2 rounded-lg transition-all duration-200`}
          >
            {tStatic('common:auto.frontend.k5d96d5ad6eb4')}</button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Organization Selection */}
      {organisations.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {tStatic('common:auto.frontend.kc8e5de1f5f2d')}</label>
          <select
            value={selectedOrgId || ''}
            onChange={(e) => setSelectedOrgId(Number(e.target.value) || null)}
            className="w-full p-2 border border-gray-300 rounded-lg"
          >
            <option value="">{tStatic('common:auto.frontend.k75eeb86436a0')}</option>
            {organisations.map(org => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Organization Users List */}
      {selectedOrg && (
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">
              {tStatic('common:auto.frontend.k2ccfc55db679')}{selectedOrg.name}
            </h3>
            <p className="text-sm text-gray-600">
              {tStatic('common:auto.frontend.k0c76e245911e')}</p>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">{tStatic('common:auto.frontend.k37282b63dd84')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{tStatic('common:auto.frontend.k9f8a2389a20c')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{tStatic('common:auto.frontend.k84add5b29527')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{tStatic('common:auto.frontend.kc3f104d13657')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{tStatic('common:auto.frontend.k95036cd183c6')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{tStatic('common:auto.frontend.k43a1c6266f88')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{tStatic('common:auto.frontend.kc3cd636a585b')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orgUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.organisationRole === 'admin' ? 'bg-red-100 text-red-800' :
                          user.organisationRole === 'editor' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.organisationRole}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.usagePlans?.map(plan => (
                          <span key={plan} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-1">
                            {plan}
                          </span>
                        ))}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">
                        {new Date(user.joinedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openRoleChangeModal(user)}
                            className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            {tStatic('common:auto.frontend.k7b55cbe93348')}</button>
                          <button
                            onClick={() => handleRemoveUser(user.id)}
                            className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            {tStatic('common:auto.frontend.ke963907dac5c')}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {orgUsers.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  {tStatic('common:auto.frontend.kcf057d3121f0')}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{tStatic('common:auto.frontend.k0efa9b2edc29')}</h3>
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-2">
                <span className="font-medium">{tStatic('common:auto.frontend.k83423c198b60')}</span> {tStatic('common:auto.frontend.kf8d99250a936')}</div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{tStatic('common:auto.frontend.kc875cbd5b1af')}</label>
                <select
                  value={selectedUserId || ''}
                  onChange={(e) => setSelectedUserId(Number(e.target.value) || null)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="">{tStatic('common:auto.frontend.k7d91dd0cb35d')}</option>
                  {availableUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{tStatic('common:auto.frontend.kc3f104d13657')}</label>
                <select
                  value={selectedUserRole}
                  onChange={(e) => setSelectedUserRole(e.target.value as 'admin' | 'editor' | 'user')}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="user">{tStatic('common:auto.frontend.k9f8a2389a20c')}</option>
                  <option value="editor">{tStatic('common:auto.frontend.kc7e9fb2ea6c3')}</option>
                  <option value="admin">{tStatic('common:auto.frontend.k4e7afebcfbae')}</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddUserModal(false);
                  setSelectedUserId(null);
                  setSelectedUserRole('user');
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded"
              >
                {tStatic('common:auto.frontend.k77dfd2135f4d')}</button>
              <button
                onClick={handleAddUser}
                disabled={!selectedUserId || loading}
                className={`${themeColors.primary} text-white px-4 py-2 rounded disabled:opacity-50`}
              >
                {loading ? 'Adding...' : 'Add User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {showRoleChangeModal && userToChangeRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{tStatic('common:auto.frontend.k163a8ef96ad3')}</h3>
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-medium">{userToChangeRole.firstName} {userToChangeRole.lastName}</p>
                <p className="text-sm text-gray-600">{userToChangeRole.email}</p>
                <p className="text-sm text-gray-500">{tStatic('common:auto.frontend.k53e944f37112')}{userToChangeRole.organisationRole}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{tStatic('common:auto.frontend.k261071b7ac94')}</label>
                <select
                  value={selectedUserRole}
                  onChange={(e) => setSelectedUserRole(e.target.value as 'admin' | 'editor' | 'user')}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="user">{tStatic('common:auto.frontend.k9f8a2389a20c')}</option>
                  <option value="editor">{tStatic('common:auto.frontend.kc7e9fb2ea6c3')}</option>
                  <option value="admin">{tStatic('common:auto.frontend.k4e7afebcfbae')}</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowRoleChangeModal(false);
                  setUserToChangeRole(null);
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded"
              >
                {tStatic('common:auto.frontend.k77dfd2135f4d')}</button>
              <button
                onClick={handleChangeRole}
                disabled={loading}
                className={`${themeColors.primary} text-white px-4 py-2 rounded disabled:opacity-50`}
              >
                {loading ? 'Updating...' : 'Update Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {organisations.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          {tStatic('common:auto.frontend.k3a1b61eb2eb7')}</div>
      )}
    </div>
  );
};

export default OrganisationUserManagement;
