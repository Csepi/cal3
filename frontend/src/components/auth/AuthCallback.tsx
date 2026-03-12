import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { clientLogger } from '../../utils/clientLogger';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import { sessionManager } from '../../services/sessionManager';

import { tStatic } from '../../i18n';

const AuthCallback: React.FC = () => {
  const location = useLocation();
  const { login } = useAuth();

  type JwtPayload = { username?: string; role?: string; [key: string]: unknown };

  const decodeTokenPayload = (jwt: string): JwtPayload | null => {
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
      return JSON.parse(decoded) as JwtPayload;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const parseBooleanQueryValue = (value: string | null): boolean | undefined => {
      if (!value) {
        return undefined;
      }
      const normalized = value.trim().toLowerCase();
      if (normalized === '1' || normalized === 'true') {
        return true;
      }
      if (normalized === '0' || normalized === 'false') {
        return false;
      }
      return undefined;
    };

    const parseNumberQueryValue = (value: string | null): number | undefined => {
      if (!value) {
        return undefined;
      }
      const parsed = Number.parseInt(value, 10);
      return Number.isFinite(parsed) ? parsed : undefined;
    };

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
      const queryUsername = urlParams.get('username');
      const queryRole = urlParams.get('role');
      const username = queryUsername || payload?.username || `${provider}_user`;
      const role = queryRole || payload?.role || 'user';
      const callbackUser = {
        id: parseNumberQueryValue(urlParams.get('id')),
        username,
        role,
        email: urlParams.get('email') || undefined,
        firstName: urlParams.get('firstName') || undefined,
        lastName: urlParams.get('lastName') || undefined,
        themeColor: urlParams.get('themeColor') || undefined,
        onboardingCompleted: parseBooleanQueryValue(
          urlParams.get('onboardingCompleted'),
        ),
      };
      clientLogger.info('auth-callback', 'session initialised from callback', {
        username,
        role,
        provider,
      });
      void login({
        token,
        username,
        role,
        user: callbackUser,
      }).then(async () => {
        if (typeof callbackUser.onboardingCompleted !== 'boolean') {
          try {
            const authProfile = await apiService.getAuthProfile();
            sessionManager.updateUser(authProfile);
          } catch (error) {
            clientLogger.warn(
              'auth-callback',
              'failed to fetch auth profile after callback',
              error,
            );
          }
        }
      }).finally(() => {
        window.location.href = '/app';
      });
    } else {
      clientLogger.warn('auth-callback', 'missing token in callback response', {
        provider,
      });
      // Redirect to login page if no token
      window.location.href = '/app';
    }
  }, [location, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900">{tStatic('common:auto.frontend.k23d0b96943f5')}</h2>
        <p className="text-gray-600">{tStatic('common:auto.frontend.k75977da923d0')}</p>
      </div>
    </div>
  );
};

export default AuthCallback;
