import React, { useState } from 'react';

interface CascadePreview {
  resourceTypes?: number;
  resources?: number;
  reservations?: number;
  users?: number;
}

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  itemName: string;
  itemType: 'organization' | 'resourceType' | 'resource' | 'reservation';
  cascadePreview?: CascadePreview;
  isLoading?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType,
  cascadePreview,
  isLoading = false
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expectedConfirmText = 'DELETE';
  const canDelete = confirmText === expectedConfirmText;

  const handleConfirm = async () => {
    if (!canDelete) return;

    try {
      setDeleting(true);
      setError(null);
      await onConfirm();
      // Success - modal will be closed by parent
      setConfirmText('');
    } catch (err: unknown) {
      setError(err.message || 'Failed to delete item');
      setDeleting(false);
    }
  };

  const handleClose = () => {
    if (!deleting) {
      setConfirmText('');
      setError(null);
      onClose();
    }
  };

  const getItemTypeLabel = () => {
    const labels = {
      organization: 'Organization',
      resourceType: 'Resource Type',
      resource: 'Resource',
      reservation: 'Reservation'
    };
    return labels[itemType] || 'Item';
  };

  const getWarningMessage = () => {
    if (!cascadePreview) return null;

    const warnings: string[] = [];

    if (itemType === 'organization') {
      if (cascadePreview.resourceTypes) {
        warnings.push(`${cascadePreview.resourceTypes} resource type${cascadePreview.resourceTypes !== 1 ? 's' : ''}`);
      }
      if (cascadePreview.resources) {
        warnings.push(`${cascadePreview.resources} resource${cascadePreview.resources !== 1 ? 's' : ''}`);
      }
      if (cascadePreview.reservations) {
        warnings.push(`${cascadePreview.reservations} reservation${cascadePreview.reservations !== 1 ? 's' : ''}`);
      }
      if (cascadePreview.users) {
        warnings.push(`${cascadePreview.users} user assignment${cascadePreview.users !== 1 ? 's' : ''}`);
      }
    } else if (itemType === 'resourceType') {
      if (cascadePreview.resources) {
        warnings.push(`${cascadePreview.resources} resource${cascadePreview.resources !== 1 ? 's' : ''}`);
      }
      if (cascadePreview.reservations) {
        warnings.push(`${cascadePreview.reservations} reservation${cascadePreview.reservations !== 1 ? 's' : ''}`);
      }
    } else if (itemType === 'resource') {
      if (cascadePreview.reservations) {
        warnings.push(`${cascadePreview.reservations} reservation${cascadePreview.reservations !== 1 ? 's' : ''}`);
      }
    }

    if (warnings.length === 0) return null;

    return (
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start">
          <svg className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <h4 className="text-yellow-900 font-semibold mb-2">⚠️ Cascade Deletion Warning</h4>
            <p className="text-yellow-800 text-sm mb-2">
              Deleting this {getItemTypeLabel().toLowerCase()} will also permanently delete:
            </p>
            <ul className="list-disc list-inside text-yellow-800 text-sm space-y-1">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-red-600 text-white px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-xl font-bold">{title}</h2>
            </div>
            {!deleting && (
              <button
                onClick={handleClose}
                className="text-white hover:text-red-100 transition"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading deletion preview...</p>
            </div>
          ) : (
            <>
              {/* Warning Message */}
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-900 font-semibold mb-2">
                  Are you sure you want to delete this {getItemTypeLabel().toLowerCase()}?
                </p>
                <p className="text-red-800 text-sm">
                  <strong>Name:</strong> {itemName}
                </p>
              </div>

              {/* Cascade Preview */}
              {getWarningMessage()}

              {/* Confirmation Input */}
              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type <code className="bg-gray-100 px-2 py-1 rounded text-red-600">{expectedConfirmText}</code> to confirm deletion:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  disabled={deleting}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Type DELETE to confirm"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2">
                  ⚠️ This action cannot be undone!
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                  <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!isLoading && (
          <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
            <button
              onClick={handleClose}
              disabled={deleting}
              className="px-4 py-2 text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canDelete || deleting}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center ${
                canDelete && !deleting
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {deleting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Permanently
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
