/**
 * LogoutButton Component
 *
 * Secure logout button with confirmation
 * Handles complete session cleanup and redirect
 */

import React, { useState } from 'react';
import { authErrorHandler } from '../../services/authErrorHandler';
import { TouchableArea } from '../mobile/atoms/TouchableArea';
import { useScreenSize } from '../../hooks/useScreenSize';

interface LogoutButtonProps {
  variant?: 'button' | 'link' | 'icon';
  className?: string;
  confirmLogout?: boolean; // Show confirmation dialog
  onLogoutStart?: () => void; // Callback before logout
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  variant = 'button',
  className = '',
  confirmLogout = true,
  onLogoutStart,
}) => {
  const { isMobile } = useScreenSize();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogoutClick = () => {
    if (confirmLogout) {
      setShowConfirm(true);
    } else {
      performLogout();
    }
  };

  const performLogout = () => {
    setIsLoggingOut(true);

    // Call pre-logout callback
    if (onLogoutStart) {
      onLogoutStart();
    }

    // Small delay to show loading state
    setTimeout(() => {
      authErrorHandler.logout();
    }, 300);
  };

  const renderButton = () => {
    const baseClasses = isLoggingOut
      ? 'opacity-50 cursor-not-allowed'
      : 'hover:opacity-80 active:opacity-60';

    if (variant === 'icon') {
      return (
        <TouchableArea
          onClick={handleLogoutClick}
          className={`p-2 rounded-lg text-gray-600 hover:bg-gray-100 ${baseClasses} ${className}`}
          minSize="lg"
          ariaLabel="Logout"
          disabled={isLoggingOut}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </TouchableArea>
      );
    }

    if (variant === 'link') {
      return (
        <button
          onClick={handleLogoutClick}
          disabled={isLoggingOut}
          className={`text-sm text-red-600 hover:text-red-700 underline ${baseClasses} ${className}`}
        >
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>
      );
    }

    return (
      <button
        onClick={handleLogoutClick}
        disabled={isLoggingOut}
        className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ${baseClasses} ${className} ${isMobile ? 'w-full' : ''}`}
      >
        {isLoggingOut ? (
          <span className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Logging out...
          </span>
        ) : (
          'Logout'
        )}
      </button>
    );
  };

  return (
    <>
      {renderButton()}

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Confirm Logout
              </h3>
              <p className="text-gray-600 text-sm">
                Are you sure you want to log out? You'll need to sign in again to access your calendar.
              </p>
            </div>

            <div className={`flex gap-3 ${isMobile ? 'flex-col' : 'flex-row-reverse'}`}>
              <button
                onClick={performLogout}
                className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ${isMobile ? 'w-full' : ''}`}
              >
                Yes, Logout
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className={`px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors ${isMobile ? 'w-full' : ''}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
