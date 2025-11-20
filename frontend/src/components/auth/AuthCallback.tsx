import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { sessionManager } from '../../services/sessionManager';
import { clientLogger } from '../../utils/clientLogger';

interface AuthCallbackProps {
  onLogin: (username: string, token?: string, role?: string) => void;
}

const AuthCallback: React.FC<AuthCallbackProps> = ({ onLogin }) => {
  const location = useLocation();

  const decodeTokenPayload = (jwt: string): Record<string, any> | null => {
    if (typeof atob !== 'function') {
      return null;
    }
    try {
      const [, payload] = jwt.split('.');
      if (!payload) return null;
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(
        normalized.length + ((4 - (normalized.length % 4)) % 4),
        '=',
      );
      const decoded = atob(padded);
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get('token');
    const provider = urlParams.get('provider');

    clientLogger.info('auth-callback', 'received OAuth response', {
      provider,
      hasToken: Boolean(token),
      rawQuery: location.search,
    });

    if (token) {
      clientLogger.debug('auth-callback', 'processing JWT payload', {
        provider,
      });
      const payload = decodeTokenPayload(token);
      const username = payload?.username || `${provider}_user`;
      const role = payload?.role || 'user';
      sessionManager.setSessionFromJwt(token, { username, role });
      clientLogger.info('auth-callback', 'session initialised from callback', {
        username,
        role,
        provider,
      });
      onLogin(username, token, role);
    } else {
      clientLogger.warn('auth-callback', 'missing token in callback response', {
        provider,
      });
      // Redirect to login page if no token
      window.location.href = '/';
    }
  }, [location, onLogin]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900">Completing authentication...</h2>
        <p className="text-gray-600">Please wait while we log you in.</p>
      </div>
    </div>
  );
};

export default AuthCallback;
