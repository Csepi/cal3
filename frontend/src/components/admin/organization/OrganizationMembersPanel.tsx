/**
 * OrganizationMembersPanel - Display and manage organization members
 */

import React from 'react';
import { Button } from '../../ui';
import { Badge } from '../../ui/Badge';
import type { MemberWithRole } from '../types';
import { getThemeConfig } from '../../../constants/theme';

export interface OrganizationMembersPanelProps {
  members: MemberWithRole[];
  onRemoveMember: (userId: number, isAdmin: boolean) => void;
  onAddMember: () => void;
  loading?: boolean;
  themeColor?: string;
}

export const OrganizationMembersPanel: React.FC<OrganizationMembersPanelProps> = ({
  members,
  onRemoveMember,
  onAddMember,
  loading = false,
  themeColor = '#3b82f6',
}) => {
  const theme = getThemeConfig(themeColor);

  const getRoleBadgeVariant = (role: string): 'success' | 'info' | 'warning' | 'default' => {
    switch (role) {
      case 'admin':
        return 'success';
      case 'editor':
        return 'info';
      case 'user':
        return 'default';
      default:
        return 'default';
    }
  };

  const getRoleIcon = (role: string): string => {
    switch (role) {
      case 'admin':
        return '👑';
      case 'editor':
        return '✏️';
      case 'user':
        return '👤';
      default:
        return '👤';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading members...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Organization Members</h3>
          <p className="text-sm text-gray-600">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        <Button
          onClick={onAddMember}
          className={`${theme.button} text-white`}
        >
          + Add Member
        </Button>
      </div>

      {/* Members List */}
      {members.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600">No members in this organization</p>
          <p className="text-sm text-gray-500 mt-1">Add your first member to get started</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">User</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Email</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">Role</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">Assigned</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const assignedDate = member.assignedAt
                  ? new Date(member.assignedAt).toLocaleDateString()
                  : 'N/A';

                return (
                  <tr
                    key={member.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <span className="mr-2">{getRoleIcon(member.organizationRole)}</span>
                        <div>
                          <div className="font-medium text-gray-900">
                            {member.username}
                            {member.firstName && member.lastName && (
                              <span className="text-gray-500 text-sm ml-2">
                                ({member.firstName} {member.lastName})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {member.email}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={getRoleBadgeVariant(member.organizationRole)}>
                        {member.organizationRole}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {member.isActive ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {assignedDate}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        onClick={() => onRemoveMember(member.id, member.isOrgAdmin || false)}
                        className="text-xs px-2 py-1 bg-red-500 hover:bg-red-600 text-white"
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Role Descriptions</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-600">
          <div className="flex items-start">
            <span className="mr-2">👑</span>
            <div>
              <span className="font-medium">Admin:</span> Full organization management access
            </div>
          </div>
          <div className="flex items-start">
            <span className="mr-2">✏️</span>
            <div>
              <span className="font-medium">Editor:</span> Can modify organization content
            </div>
          </div>
          <div className="flex items-start">
            <span className="mr-2">👤</span>
            <div>
              <span className="font-medium">User:</span> Standard read and limited write access
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationMembersPanel;