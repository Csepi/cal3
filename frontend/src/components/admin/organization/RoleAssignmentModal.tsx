/**
 * RoleAssignmentModal - Assign users to organization roles
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../../ui';
import type { User, MemberWithRole } from '../types';

import { tStatic } from '../../../i18n';

export interface RoleAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (userId: number, role: 'admin' | 'editor' | 'user') => Promise<void>;
  availableUsers: User[];
  currentMembers: MemberWithRole[];
  loading?: boolean;
  themeColor?: string;
}

export const RoleAssignmentModal: React.FC<RoleAssignmentModalProps> = ({
  isOpen,
  onClose,
  onAssign,
  availableUsers,
  currentMembers,
  loading = false,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'editor' | 'user'>('user');
  const [error, setError] = useState('');

  // Filter out users who are already members
  const memberIds = currentMembers.map(m => m.id);
  const availableForAssignment = availableUsers.filter(u => !memberIds.includes(u.id));

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedUserId(null);
      setSelectedRole('user');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!selectedUserId) {
      setError(tStatic('common:auto.frontend.k4bb9782bc031'));
      return;
    }

    try {
      await onAssign(selectedUserId, selectedRole);
      setSelectedUserId(null);
      setSelectedRole('user');
      setError('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign user');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{tStatic('common:auto.frontend.ka674b3abc49c')}</h3>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* User Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {tStatic('common:auto.frontend.k00311eec184f')}</label>
            <select
              value={selectedUserId || ''}
              onChange={(e) => setSelectedUserId(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">{tStatic('common:auto.frontend.k48ff73f37ba0')}</option>
              {availableForAssignment.map(user => (
                <option key={user.id} value={user.id}>
                  {user.username} ({user.email})
                </option>
              ))}
            </select>
            {availableForAssignment.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">{tStatic('common:auto.frontend.k64dc2c947e6b')}</p>
            )}
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {tStatic('common:auto.frontend.k9861a735d776')}</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'editor' | 'user')}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="user">{tStatic('common:auto.frontend.kbc0b059e211d')}</option>
              <option value="editor">{tStatic('common:auto.frontend.kcee2e77d82bd')}</option>
              <option value="admin">{tStatic('common:auto.frontend.k484c3c667836')}</option>
            </select>
          </div>

          {/* Role descriptions */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-600">
              {selectedRole === 'admin' && '👑 Admins can manage members, settings, and all organization resources'}
              {selectedRole === 'editor' && '✏️ Editors can create and modify organization content'}
              {selectedRole === 'user' && '👤 Users have standard read and limited write access'}
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button
            onClick={onClose}
            disabled={loading}
            className="bg-gray-300 hover:bg-gray-400 text-gray-700"
          >
            {tStatic('common:auto.frontend.k77dfd2135f4d')}</Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedUserId || availableForAssignment.length === 0}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {loading ? 'Assigning...' : 'Assign User'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoleAssignmentModal;
