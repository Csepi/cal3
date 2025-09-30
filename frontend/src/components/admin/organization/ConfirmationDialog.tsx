/**
 * ConfirmationDialog - Reusable confirmation modal for destructive actions
 */

import React from 'react';
import { Button } from '../../ui';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
  loading = false,
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: '⚠️',
      confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      icon: '⚠️',
      confirmClass: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    },
    info: {
      icon: 'ℹ️',
      confirmClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  };

  const style = variantStyles[variant];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-start mb-4">
          <span className="text-3xl mr-3">{style.icon}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-gray-600 mt-2">{message}</p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button
            onClick={onCancel}
            disabled={loading}
            className="bg-gray-300 hover:bg-gray-400 text-gray-700"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={style.confirmClass}
          >
            {loading ? 'Processing...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;