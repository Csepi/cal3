import { BASE_URL } from '../config/apiConfig';
import { applyCsrfHeader, clearCsrfToken, ensureCsrfToken } from './csrf';

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

const decodeJwtPayload = (token: string): Record<string, any> | null => {
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

type SessionListener = (snapshot: SessionSnapshot) => void;

class SessionManager {
  private accessToken: string | null = null;
  private accessTokenExpiresAt = 0;
  private currentUser: SessionUser | null = null;
  private refreshPromise: Promise<string | null> | null = null;
  private listeners = new Set<SessionListener>();

  constructor() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const username = localStorage.getItem('username') ?? undefined;
      const role = localStorage.getItem('userRole') ?? undefined;
      const themeColor = localStorage.getItem('themeColor') ?? undefined;
      if (username || role || themeColor) {
        this.currentUser = { username, role, themeColor };
      }
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
      if (typeof localStorage === 'undefined' || !user) {
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
    if (payload.user) {
      this.currentUser = { ...this.currentUser, ...payload.user };
      this.persistUserMetadata(this.currentUser);
    }
    ensureCsrfToken();
    this.notify();
  }

  setSessionFromJwt(token: string, fallback?: SessionUser): void {
    const decoded = decodeJwtPayload(token);
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
    this.persistUserMetadata(resolvedUser);
    ensureCsrfToken();
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
      applyCsrfHeader(headers, true);
      try {
        const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers,
          body: JSON.stringify({}),
        });
        if (!response.ok) {
          this.clearSession();
          return null;
        }
        const data: AuthSessionPayload = await response.json();
        this.setSessionFromResponse(data);
        return this.accessToken;
      } catch (error) {
        console.warn('[session] failed to refresh access token', error);
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
    this.accessToken = null;
    this.accessTokenExpiresAt = 0;
    this.refreshPromise = null;
    this.currentUser = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('username');
      localStorage.removeItem('userRole');
      localStorage.removeItem('themeColor');
    }
    clearCsrfToken();
    this.notify();
  }

  snapshotUserMetadata(): SessionUser | null {
    return this.currentUser;
  }
}

export const sessionManager = new SessionManager();
