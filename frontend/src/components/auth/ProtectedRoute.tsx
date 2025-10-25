/**
 * ProtectedRoute Component
 *
 * Security guard for protected routes
 * Ensures only authenticated users can access protected content
 *
 * Security features:
 * - Checks for valid authentication token
 * - Validates token format (basic JWT validation)
 * - Redirects to login if unauthorized
 * - Prevents rendering of protected content until auth is verified
 * - Saves intended destination for post-login redirect
 */

import React, { useEffect, useState } from 'react';
import { authErrorHandler } from '../../services/authErrorHandler';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean; // Default true
  fallback?: React.ReactNode; // What to show while checking auth
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  fallback = (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Verifying authentication...</p>
      </div>
    </div>
  ),
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    // If auth is not required, skip validation
    if (!requireAuth) {
      setIsAuthenticated(true);
      setIsValidating(false);
      return;
    }

    // Validate authentication
    validateAuth();
  }, [requireAuth]);

  const validateAuth = () => {
    try {
      // Check if user has a token
      const hasAuth = authErrorHandler.isAuthenticated();

      if (!hasAuth) {
        // No token - redirect to login
        redirectToLogin('no_token');
        return;
      }

      // Check if token has valid format
      const hasValidFormat = authErrorHandler.hasValidTokenFormat();

      if (!hasValidFormat) {
        // Invalid token format - clear and redirect
        console.warn('[SECURITY] Invalid token format detected');
        authErrorHandler.handleAuthError(401);
        return;
      }

      // Token exists and has valid format
      setIsAuthenticated(true);
      setIsValidating(false);
    } catch (error) {
      console.error('[SECURITY] Error validating auth:', error);
      redirectToLogin('validation_error');
    }
  };

  const redirectToLogin = (reason: string) => {
    setIsAuthenticated(false);
    setIsValidating(false);

    // Save current path for return after login
    const currentPath = window.location.pathname + window.location.search;
    const returnUrl = currentPath !== '/login' ? currentPath : '/';

    // Redirect to login
    window.location.replace(`/login?reason=${reason}&returnUrl=${encodeURIComponent(returnUrl)}`);
  };

  // Still validating
  if (isValidating) {
    return <>{fallback}</>;
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null; // Will redirect, don't show anything
  }

  // Authenticated - render protected content
  return <>{children}</>;
};
