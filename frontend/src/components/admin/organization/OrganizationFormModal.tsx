/**
 * OrganizationFormModal - Create/Edit organization form
 */

import React, { useState } from 'react';
import { Button, Input } from '../../ui';

export interface OrganizationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string) => Promise<void>;
  loading?: boolean;
  themeColor?: string;
}

export const OrganizationFormModal: React.FC<OrganizationFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  themeColor = '#3b82f6',
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Organization name is required');
      return;
    }
    if (name.trim().length < 3) {
      setError('Organization name must be at least 3 characters');
      return;
    }

    try {
      await onSubmit(name.trim(), description.trim());
      setName('');
      setDescription('');
      setError('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Organization</h3>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <Input
            placeholder="Organization name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            themeColor={themeColor}
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg resize-none"
            rows={3}
          />
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button onClick={onClose} disabled={loading} className="bg-gray-300 hover:bg-gray-400 text-gray-700">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !name.trim()} className={`bg-${themeColor} text-white`}>
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrganizationFormModal;