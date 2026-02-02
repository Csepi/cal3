import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authApi } from '../services/authApi';
import { sessionManager } from '../services/sessionManager';

export type AuthUser = {
  id?: number;
  username?: string;
  email?: string;
  role?: string;
  themeColor?: string;
  [key: string]: unknown;
};

export type LoginCredentials = {
  username: string;
  password: string;
};

export type LoginPayload = {
  token: string;
  username?: string;
  role?: string;
  user?: AuthUser;
};

export type LoginInput = LoginCredentials | LoginPayload;

interface AuthContextValue {
  currentUser: AuthUser | null;
  token: string | null;
  login: (input: LoginInput) => Promise<AuthUser | null>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = sessionManager.subscribe((snapshot) => {
      setCurrentUser(snapshot.user ?? null);
      setIsAuthenticated(snapshot.isAuthenticated);
      setToken(sessionManager.peekAccessToken());
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    if ('password' in input) {
      const response = await authApi.login(input.username, input.password);
      return response.user ?? null;
    }

    sessionManager.setSessionFromJwt(input.token, {
      username: input.username,
      role: input.role,
      ...(input.user ?? {}),
    } as AuthUser);
    return input.user ?? sessionManager.getCurrentUser();
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      sessionManager.clearSession();
    }
  }, []);

  const contextValue = useMemo<AuthContextValue>(() => ({
    currentUser,
    token,
    login,
    logout,
    isAuthenticated,
  }), [currentUser, token, login, logout, isAuthenticated]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
