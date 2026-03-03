import { BASE_URL } from '../config/apiConfig';
import { applyCsrfHeader, clearCsrfToken, ensureCsrfToken } from './csrf';
import { clientLogger } from '../utils/clientLogger';
import { clearWidgetToken, syncWidgetToken } from './widgetAuthStorage';
import {
  isNativeClient,
  NATIVE_CLIENT_HEADER,
  NATIVE_CLIENT_VALUE,
} from './clientPlatform';

interface SessionUser {
  id?: number;
  username?: string;
  email?: string;
  role?: string;
  themeColor?: string;
  [key: string]: unknown;
}

export interface AuthSessionPayload {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  refresh_expires_at?: string;
  issued_at?: string;
  user?: SessionUser;
}

interface SessionSnapshot {
  isAuthenticated: boolean;
  user: SessionUser | null;
  expiresAt: number;
}

const EXPIRY_BUFFER_MS = 5_000;
const STORAGE_ACCESS_TOKEN_KEY = 'cal3_access_token';
const STORAGE_ACCESS_TOKEN_EXPIRY_KEY = 'cal3_access_token_expires_at';
const STORAGE_REFRESH_TOKEN_KEY = 'cal3_refresh_token';
const STORAGE_SESSION_USER_KEY = 'cal3_session_user';

function runSafeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '=',
    );
    if (typeof atob === 'function') {
      return JSON.parse(atob(padded));
    }
    const buffer = Buffer.from(padded, 'base64').toString('utf-8');
    return JSON.parse(buffer);
  } catch {
    return null;
  }
};

interface JwtClaims {
  exp?: number;
  sub?: number;
  username?: string;
  role?: string;
}

type SessionListener = (snapshot: SessionSnapshot) => void;

class SessionManager {
  private accessToken: string | null = null;
  private accessTokenExpiresAt = 0;
  private refreshToken: string | null = null;
  private currentUser: SessionUser | null = null;
  private refreshPromise: Promise<string | null> | null = null;
  private listeners = new Set<SessionListener>();

  constructor() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      this.restorePersistedSession();
      ensureCsrfToken();
    }
  }

  subscribe(listener: SessionListener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const snapshot = this.snapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }

  private snapshot(): SessionSnapshot {
    return {
      isAuthenticated: this.hasActiveSession(),
      user: this.currentUser,
      expiresAt: this.accessTokenExpiresAt,
    };
  }

  private persistUserMetadata(user?: SessionUser | null): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    if (!user) {
      localStorage.removeItem('username');
      localStorage.removeItem('userRole');
      localStorage.removeItem('themeColor');
      localStorage.removeItem(STORAGE_SESSION_USER_KEY);
      return;
    }
    if (user.username) {
      localStorage.setItem('username', user.username);
    }
    if (user.role) {
      localStorage.setItem('userRole', user.role);
    }
    if (user.themeColor) {
      localStorage.setItem('themeColor', user.themeColor);
    }
    localStorage.setItem(STORAGE_SESSION_USER_KEY, JSON.stringify(user));
  }

  private restorePersistedSession(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const persistedUserRaw = localStorage.getItem(STORAGE_SESSION_USER_KEY);
    if (persistedUserRaw) {
      const parsedUser = runSafeJsonParse<SessionUser>(persistedUserRaw);
      if (parsedUser) {
        this.currentUser = parsedUser;
      }
    }

    if (!this.currentUser) {
      const username = localStorage.getItem('username') ?? undefined;
      const role = localStorage.getItem('userRole') ?? undefined;
      const themeColor = localStorage.getItem('themeColor') ?? undefined;
      if (username || role || themeColor) {
        this.currentUser = { username, role, themeColor };
      }
    }

    const persistedToken = localStorage.getItem(STORAGE_ACCESS_TOKEN_KEY);
    const persistedExpiryRaw = localStorage.getItem(STORAGE_ACCESS_TOKEN_EXPIRY_KEY);
    const persistedExpiry = persistedExpiryRaw ? Number.parseInt(persistedExpiryRaw, 10) : 0;
    if (
      persistedToken &&
      Number.isFinite(persistedExpiry) &&
      persistedExpiry > Date.now() + EXPIRY_BUFFER_MS
    ) {
      this.accessToken = persistedToken;
      this.accessTokenExpiresAt = persistedExpiry;
      void syncWidgetToken(persistedToken);
    } else {
      this.accessToken = null;
      this.accessTokenExpiresAt = 0;
      localStorage.removeItem(STORAGE_ACCESS_TOKEN_KEY);
      localStorage.removeItem(STORAGE_ACCESS_TOKEN_EXPIRY_KEY);
    }

    const persistedRefreshToken = localStorage.getItem(STORAGE_REFRESH_TOKEN_KEY);
    this.refreshToken = persistedRefreshToken && persistedRefreshToken.trim()
      ? persistedRefreshToken
      : null;
  }

  private persistSessionState(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    if (this.accessToken && this.accessTokenExpiresAt > 0) {
      localStorage.setItem(STORAGE_ACCESS_TOKEN_KEY, this.accessToken);
      localStorage.setItem(
        STORAGE_ACCESS_TOKEN_EXPIRY_KEY,
        String(this.accessTokenExpiresAt),
      );
    } else {
      localStorage.removeItem(STORAGE_ACCESS_TOKEN_KEY);
      localStorage.removeItem(STORAGE_ACCESS_TOKEN_EXPIRY_KEY);
    }

    if (this.refreshToken) {
      localStorage.setItem(STORAGE_REFRESH_TOKEN_KEY, this.refreshToken);
    } else {
      localStorage.removeItem(STORAGE_REFRESH_TOKEN_KEY);
    }
  }

  private applyToken(
    token: string,
    expiresInSeconds?: number,
    explicitExpiry?: number,
  ): void {
    this.accessToken = token;
    if (typeof explicitExpiry === 'number') {
      this.accessTokenExpiresAt = explicitExpiry;
      return;
    }
    const expiryMs =
      typeof expiresInSeconds === 'number'
        ? expiresInSeconds * 1000
        : 15 * 60 * 1000;
    this.accessTokenExpiresAt = Date.now() + expiryMs;
  }

  setSessionFromResponse(payload: AuthSessionPayload): void {
    this.applyToken(payload.access_token, payload.expires_in);
    this.refreshToken = payload.refresh_token ?? null;
    if (payload.user) {
      this.currentUser = { ...this.currentUser, ...payload.user };
      this.persistUserMetadata(this.currentUser);
    }
    this.persistSessionState();
    ensureCsrfToken();
    clientLogger.debug('[session] set session from response', {
      userId: payload.user?.id ?? null,
      expiresIn: payload.expires_in,
      hasRefreshToken: Boolean(this.refreshToken),
    });
    void syncWidgetToken(payload.access_token);
    this.notify();
  }

  setSessionFromJwt(token: string, fallback?: SessionUser): void {
    const decoded = decodeJwtPayload(token) as JwtClaims | null;
    const exp =
      typeof decoded?.exp === 'number' ? decoded.exp * 1000 : undefined;
    this.applyToken(token, undefined, exp);
    const resolvedUser: SessionUser = {
      ...fallback,
      ...this.currentUser,
      username: decoded?.username ?? fallback?.username ?? this.currentUser?.username,
      role: decoded?.role ?? fallback?.role ?? this.currentUser?.role,
      id: decoded?.sub ?? fallback?.id ?? this.currentUser?.id,
    };
    this.currentUser = resolvedUser;
    this.refreshToken = null;
    this.persistUserMetadata(resolvedUser);
    this.persistSessionState();
    ensureCsrfToken();
    clientLogger.debug('[session] set session from JWT', {
      userId: resolvedUser.id ?? null,
      username: resolvedUser.username,
      expiresAt: exp ? new Date(exp).toISOString() : null,
    });
    void syncWidgetToken(token);
    this.notify();
  }

  hasActiveSession(): boolean {
    if (!this.accessToken) {
      return false;
    }
    return Date.now() < this.accessTokenExpiresAt - EXPIRY_BUFFER_MS;
  }

  getCurrentUser(): SessionUser | null {
    return this.currentUser;
  }

  peekAccessToken(): string | null {
    return this.accessToken;
  }

  peekRefreshToken(): string | null {
    return this.refreshToken;
  }

  async getAccessToken(): Promise<string | null> {
    if (this.hasActiveSession()) {
      return this.accessToken;
    }
    return this.refreshAccessToken();
  }

  async requireAccessToken(): Promise<string> {
    const token = await this.getAccessToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    return token;
  }

  async refreshAccessToken(force = false): Promise<string | null> {
    if (this.refreshPromise && !force) {
      return this.refreshPromise;
    }
    const attempt = async (): Promise<string | null> => {
      if (typeof fetch === 'undefined') {
        return null;
      }
      const headers = new Headers({
        'Content-Type': 'application/json',
      });
      if (isNativeClient()) {
        headers.set(NATIVE_CLIENT_HEADER, NATIVE_CLIENT_VALUE);
      }
      applyCsrfHeader(headers, true);
      const refreshPayload = this.refreshToken
        ? { refreshToken: this.refreshToken }
        : {};
      try {
        clientLogger.debug('[session] requesting refresh token rotation', {
          force,
          hasRefreshToken: Boolean(this.refreshToken),
        });
        const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers,
          body: JSON.stringify(refreshPayload),
        });
        if (!response.ok) {
          const errorBody = await readErrorPayload(response);
          clientLogger.warn('[session] refresh failed', {
            status: response.status,
            body: errorBody,
          });
          this.clearSession();
          return null;
        }
        const data: AuthSessionPayload = await response.json();
        this.setSessionFromResponse(data);
        clientLogger.debug('[session] refresh succeeded', {
          expiresIn: data.expires_in,
        });
        return this.accessToken;
      } catch (error) {
        clientLogger.error('[session] failed to refresh access token', error);
        this.clearSession();
        return null;
      }
    };

    this.refreshPromise = attempt().finally(() => {
      this.refreshPromise = null;
    });
    return this.refreshPromise;
  }

  clearSession(): void {
    clientLogger.debug('[session] clearing session state');
    this.accessToken = null;
    this.accessTokenExpiresAt = 0;
    this.refreshToken = null;
    this.refreshPromise = null;
    this.currentUser = null;
    this.persistUserMetadata(null);
    this.persistSessionState();
    clearCsrfToken();
    void clearWidgetToken();
    this.notify();
  }

  snapshotUserMetadata(): SessionUser | null {
    return this.currentUser;
  }
}

export const sessionManager = new SessionManager();

const readErrorPayload = async (response: Response): Promise<string> => {
  try {
    const text = await response.text();
    return text.length > 500 ? `${text.slice(0, 500)}…` : text;
  } catch {
    return '[unavailable]';
  }
};

