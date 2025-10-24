/**
 * Simple Modal Component
 *
 * A reliable modal component that will definitely work without complex styling conflicts
 */

import React, { useEffect } from 'react';

export interface SimpleModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullScreenOnMobile?: boolean;
}

export const SimpleModal: React.FC<SimpleModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  fullScreenOnMobile = false
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex ${fullScreenOnMobile ? 'md:items-center md:justify-center' : 'items-center justify-center'}`}
      style={{ zIndex: 9999 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={`
          relative bg-white shadow-xl w-full overflow-hidden
          ${fullScreenOnMobile
            ? 'h-full md:h-auto md:rounded-lg md:mx-4 md:max-h-[90vh] md:' + sizeClasses[size]
            : 'rounded-lg mx-4 max-h-[90vh] ' + sizeClasses[size]
          }
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className={`flex items-center justify-between border-b border-gray-200 ${fullScreenOnMobile ? 'p-4 md:p-6' : 'p-6'}`}>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Body */}
        <div className={`overflow-y-auto ${fullScreenOnMobile ? 'h-[calc(100%-80px)] p-4 md:p-6 md:max-h-[70vh]' : 'p-6 max-h-[70vh]'}`}>
          {children}
        </div>
      </div>
    </div>
  );
};