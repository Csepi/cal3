/**
 * Centralized API Configuration
 *
 * This file provides a single source of truth for API URLs.
 * All components and services should import from here instead of hardcoding URLs.
 *
 * Runtime sources (in priority order):
 * 1. Global overrides (`window.BASE_URL`, `window.ENV.BASE_URL`, `globalThis.BASE_URL`, `process.env.BASE_URL`)
 * 2. Browser origin (with optional custom port override)
 * 3. Local development fallback (`http://localhost:8081`)
 *
 * No Vite-prefixed environment variables are required.
 */

const DEFAULT_PROTOCOL = typeof window !== 'undefined' ? window.location.protocol : 'https:';
const DEFAULT_BACKEND_PORT = '8081';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const toAbsoluteUrl = (value: string): string => {
  const trimmed = value.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    return trimTrailingSlash(trimmed);
  }

  const sanitized = trimmed.replace(/^\/+/, '');
  return trimTrailingSlash(`${DEFAULT_PROTOCOL}//${sanitized}`);
};

const applyPortIfMissing = (url: string, port: string): string => {
  const parsedUrl = new URL(url);
  if (!parsedUrl.port) {
    parsedUrl.port = port;
  }
  return trimTrailingSlash(parsedUrl.toString());
};

const readGlobalBaseUrl = (): string | null => {
  const globalScope = globalThis as any;
  const candidates = [
    globalScope?.BASE_URL,
    globalScope?.__BASE_URL__,
    globalScope?.ENV?.BASE_URL,
    globalScope?.CONFIG?.BASE_URL,
    globalScope?.process?.env?.BASE_URL,
  ];

  for (const candidate of candidates) {
    if (isNonEmptyString(candidate)) {
      return toAbsoluteUrl(candidate);
    }
  }

  return null;
};

const resolveBaseUrl = (): string => {
  const override = readGlobalBaseUrl();
  if (override) {
    return applyPortIfMissing(override, new URL(override).port || DEFAULT_BACKEND_PORT);
  }

  if (typeof window !== 'undefined') {
    const { origin, protocol, hostname, port } = window.location;

    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      if (isNonEmptyString(port)) {
        return trimTrailingSlash(origin);
      }
      return `${protocol}//${hostname}:${DEFAULT_BACKEND_PORT}`;
    }
  }

  return `http://localhost:${DEFAULT_BACKEND_PORT}`;
};

export const BASE_URL = trimTrailingSlash(resolveBaseUrl());
export const BACKEND_PORT = new URL(BASE_URL).port || DEFAULT_BACKEND_PORT;

/**
 * Convenience helper for building API URLs
 * @param endpoint - The API endpoint (e.g., '/api/users', 'api/events')
 */
export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${BASE_URL}${cleanEndpoint}`;
};

/**
 * Log the current API configuration (for debugging)
 */
export const logApiConfig = () => {
  console.log('API Configuration:', {
    BASE_URL,
    BACKEND_PORT,
    source:
      readGlobalBaseUrl() !== null
        ? 'global override'
        : typeof window !== 'undefined' && window.location.hostname !== 'localhost'
          ? 'window.location'
          : 'localhost fallback',
  });
};

