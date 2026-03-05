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
const WEB_IDLE_TIMEOUT_MS = 24 * 60 * 60 * 1000;
const ACTIVITY_PERSIST_THROTTLE_MS = 15_000;
const STORAGE_ACCESS_TOKEN_KEY = 'cal3_access_token';
const STORAGE_ACCESS_TOKEN_EXPIRY_KEY = 'cal3_access_token_expires_at';
const STORAGE_REFRESH_TOKEN_KEY = 'cal3_refresh_token';
const STORAGE_SESSION_USER_KEY = 'cal3_session_user';
const STORAGE_LAST_ACTIVITY_KEY = 'cal3_last_activity_at';
const WEB_ACTIVITY_EVENTS = [
  'pointerdown',
  'keydown',
  'touchstart',
  'scroll',
  'focus',
] as const;

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
  private lastActivityAt = 0;
  private lastPersistedActivityAt = 0;
  private activityTrackingStarted = false;
  private readonly handleWebActivity = () => {
    if (!this.accessToken && !this.refreshToken) {
      return;
    }
    this.recordActivity();
  };
  private readonly handleVisibilityChange = () => {
    if (typeof document === 'undefined') {
      return;
    }
    if (document.visibilityState === 'visible') {
      this.handleWebActivity();
    }
  };

  constructor() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      this.restorePersistedSession();
      this.startWebActivityTracking();
      ensureCsrfToken();
      if (this.hasActiveSession()) {
        this.recordActivity(Date.now(), true);
      }
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

  private shouldEnforceWebIdleTimeout(): boolean {
    return !isNativeClient();
  }

  private startWebActivityTracking(): void {
    if (
      this.activityTrackingStarted ||
      !this.shouldEnforceWebIdleTimeout() ||
      typeof window === 'undefined' ||
      typeof document === 'undefined'
    ) {
      return;
    }

    for (const eventName of WEB_ACTIVITY_EVENTS) {
      window.addEventListener(eventName, this.handleWebActivity, {
        passive: true,
      });
    }
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.activityTrackingStarted = true;
  }

  private recordActivity(timestamp = Date.now(), forcePersist = false): void {
    if (!this.shouldEnforceWebIdleTimeout()) {
      return;
    }
    this.lastActivityAt = timestamp;
    this.persistActivityTimestamp(forcePersist);
  }

  private persistActivityTimestamp(force = false): void {
    if (
      typeof localStorage === 'undefined' ||
      !this.shouldEnforceWebIdleTimeout()
    ) {
      return;
    }
    if (this.lastActivityAt <= 0) {
      localStorage.removeItem(STORAGE_LAST_ACTIVITY_KEY);
      this.lastPersistedActivityAt = 0;
      return;
    }

    if (
      force ||
      this.lastPersistedActivityAt <= 0 ||
      this.lastActivityAt - this.lastPersistedActivityAt >=
        ACTIVITY_PERSIST_THROTTLE_MS
    ) {
      localStorage.setItem(STORAGE_LAST_ACTIVITY_KEY, String(this.lastActivityAt));
      this.lastPersistedActivityAt = this.lastActivityAt;
    }
  }

  private isWebSessionExpiredByInactivity(referenceTime = Date.now()): boolean {
    if (!this.shouldEnforceWebIdleTimeout() || this.lastActivityAt <= 0) {
      return false;
    }
    return referenceTime - this.lastActivityAt >= WEB_IDLE_TIMEOUT_MS;
  }

  private clearExpiredWebSessionIfNeeded(): boolean {
    if (!this.isWebSessionExpiredByInactivity()) {
      return false;
    }
    clientLogger.info('[session] web session expired after inactivity window');
    this.clearSession();
    return true;
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

    if (this.shouldEnforceWebIdleTimeout()) {
      const persistedActivityRaw = localStorage.getItem(STORAGE_LAST_ACTIVITY_KEY);
      const persistedActivity = persistedActivityRaw
        ? Number.parseInt(persistedActivityRaw, 10)
        : 0;
      if (Number.isFinite(persistedActivity) && persistedActivity > 0) {
        this.lastActivityAt = persistedActivity;
        this.lastPersistedActivityAt = persistedActivity;
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

    if (this.clearExpiredWebSessionIfNeeded()) {
      return;
    }

    if (
      this.shouldEnforceWebIdleTimeout() &&
      (this.accessToken || this.refreshToken) &&
      this.lastActivityAt <= 0
    ) {
      this.recordActivity(Date.now(), true);
    }
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

    if (!this.accessToken && !this.refreshToken) {
      this.lastActivityAt = 0;
      this.lastPersistedActivityAt = 0;
    }
    this.persistActivityTimestamp(true);
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
    this.recordActivity(Date.now(), true);
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
    this.recordActivity(Date.now(), true);
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
    if (this.isWebSessionExpiredByInactivity()) {
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
      this.recordActivity();
      return this.accessToken;
    }
    if (this.clearExpiredWebSessionIfNeeded()) {
      return null;
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
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    const attempt = async (): Promise<string | null> => {
      if (typeof fetch === 'undefined') {
        return null;
      }
      if (this.clearExpiredWebSessionIfNeeded()) {
        return null;
      }

      const nativeClient = isNativeClient();
      const headers = new Headers({
        'Content-Type': 'application/json',
      });
      if (nativeClient) {
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
          if (!nativeClient) {
            this.clearSession();
          }
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
        if (!nativeClient) {
          this.clearSession();
        }
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
    this.lastActivityAt = 0;
    this.lastPersistedActivityAt = 0;
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

