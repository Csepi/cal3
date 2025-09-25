import React, { useEffect } from 'react';
import { getThemeConfig } from '../../constants';

/**
 * Reusable Modal component with theme support and accessibility features
 *
 * This component provides a consistent modal interface across the application
 * with proper theme integration, backdrop handling, and keyboard navigation.
 */

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Function to call when modal should be closed */
  onClose: () => void;
  /** Modal content */
  children: React.ReactNode;
  /** Modal title */
  title?: string;
  /** Theme color for styling */
  themeColor?: string;
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Whether clicking backdrop should close modal */
  closeOnBackdropClick?: boolean;
  /** Whether pressing Escape should close modal */
  closeOnEscapePress?: boolean;
  /** Additional CSS classes for modal content */
  className?: string;
  /** Custom footer content */
  footer?: React.ReactNode;
}

/**
 * Flexible Modal component that provides consistent styling and behavior
 * across the application with proper accessibility support.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  themeColor,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscapePress = true,
  className = '',
  footer
}) => {
  // Get theme configuration
  const themeConfig = themeColor ? getThemeConfig(themeColor) : null;

  // Handle escape key press
  useEffect(() => {
    if (!isOpen || !closeOnEscapePress) return;

    const handleEscapePress = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapePress);
    return () => document.removeEventListener('keydown', handleEscapePress);
  }, [isOpen, onClose, closeOnEscapePress]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Don't render if not open
  if (!isOpen) return null;

  // Size-specific classes
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && closeOnBackdropClick) {
      onClose();
    }
  };

  // Modal content classes
  const modalClasses = [
    'relative',
    'bg-white',
    'rounded-xl',
    'shadow-2xl',
    'max-h-[90vh]',
    'overflow-hidden',
    'flex',
    'flex-col',
    sizeClasses[size],
    'w-full',
    className
  ].join(' ');

  // Header classes with theme support
  const getHeaderClasses = () => {
    const baseHeader = 'flex items-center justify-between p-6 border-b';
    if (themeConfig) {
      return `${baseHeader} border-${themeConfig.border} bg-gradient-to-r ${themeConfig.gradient.background}`;
    }
    return `${baseHeader} border-gray-200 bg-gray-50`;
  };

  // Title classes with theme support
  const getTitleClasses = () => {
    const baseTitle = 'text-lg font-semibold';
    if (themeConfig) {
      return `${baseTitle} text-${themeConfig.text}`;
    }
    return `${baseTitle} text-gray-900`;
  };

  // Close button classes with theme support
  const getCloseButtonClasses = () => {
    const baseClose = 'p-1 rounded-md hover:bg-opacity-20 transition-colors duration-200';
    if (themeConfig) {
      return `${baseClose} text-${themeConfig.text} hover:bg-${themeConfig.primary}`;
    }
    return `${baseClose} text-gray-400 hover:bg-gray-500 hover:text-gray-600`;
  };

  // Footer classes with theme support
  const getFooterClasses = () => {
    const baseFooter = 'px-6 py-4 border-t bg-gray-50 flex items-center justify-end space-x-3';
    if (themeConfig) {
      return `${baseFooter} border-${themeConfig.border}`;
    }
    return `${baseFooter} border-gray-200`;
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby={title ? 'modal-title' : undefined}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0"
        onClick={handleBackdropClick}
      >
        <div
          className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75"
          aria-hidden="true"
        />

        {/* Center alignment trick */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        {/* Modal content */}
        <div className={modalClasses}>
          {/* Header */}
          {(title || showCloseButton) && (
            <div className={getHeaderClasses()}>
              <div className="flex items-center">
                {title && (
                  <h3 id="modal-title" className={getTitleClasses()}>
                    {title}
                  </h3>
                )}
              </div>

              {/* Close button */}
              {showCloseButton && (
                <button
                  type="button"
                  className={getCloseButtonClasses()}
                  onClick={onClose}
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div className="flex-1 p-6 overflow-y-auto">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className={getFooterClasses()}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * ModalHeader component for consistent header styling
 */
export interface ModalHeaderProps {
  children: React.ReactNode;
  onClose?: () => void;
  themeColor?: string;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ children, onClose, themeColor }) => {
  const themeConfig = themeColor ? getThemeConfig(themeColor) : null;

  const getHeaderClasses = () => {
    const baseHeader = 'flex items-center justify-between p-6 border-b';
    if (themeConfig) {
      return `${baseHeader} border-${themeConfig.border} bg-gradient-to-r ${themeConfig.gradient.background}`;
    }
    return `${baseHeader} border-gray-200 bg-gray-50`;
  };

  return (
    <div className={getHeaderClasses()}>
      {children}
      {onClose && (
        <button
          type="button"
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          onClick={onClose}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

/**
 * ModalFooter component for consistent footer styling
 */
export interface ModalFooterProps {
  children: React.ReactNode;
  themeColor?: string;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({ children, themeColor }) => {
  const themeConfig = themeColor ? getThemeConfig(themeColor) : null;

  const getFooterClasses = () => {
    const baseFooter = 'px-6 py-4 border-t bg-gray-50 flex items-center justify-end space-x-3';
    if (themeConfig) {
      return `${baseFooter} border-${themeConfig.border}`;
    }
    return `${baseFooter} border-gray-200`;
  };

  return (
    <div className={getFooterClasses()}>
      {children}
    </div>
  );
};