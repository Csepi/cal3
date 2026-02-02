import { AuthProvider } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import { PermissionsProvider } from './PermissionsContext';
import { FeatureFlagsProvider } from './FeatureFlagsContext';
import { NotificationsProvider } from './NotificationsContext';
import { sessionManager } from '../services/sessionManager';
import { useEffect, type ReactNode } from 'react';

export const AppContextProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    if (!sessionManager.hasActiveSession()) {
      sessionManager.refreshAccessToken().catch(() => null);
    }
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <FeatureFlagsProvider>
          <PermissionsProvider>
            <NotificationsProvider>
              {children}
            </NotificationsProvider>
          </PermissionsProvider>
        </FeatureFlagsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};
