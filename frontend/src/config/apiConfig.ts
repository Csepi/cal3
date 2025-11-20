import { clientLogger } from '../utils/clientLogger';

/**
 * Centralized API Configuration
 *
 * This file provides a single source of truth for API URLs.
 * All components and services should import from here instead of hardcoding URLs.
 *
 * Runtime sources (in priority order):
 * 1. Global overrides (`window.BASE_URL`, `window.ENV.BASE_URL`, `globalThis.BASE_URL`, etc.)
 * 2. Meta tag overrides (`<meta name="primecal-backend-url" content="..." />`)
 * 3. Browser origin (with optional custom port override)
 * 4. Local development fallback (`http://localhost:8081`)
 */

const DEFAULT_PROTOCOL = typeof window !== 'undefined' ? window.location.protocol : 'https:';
const DEFAULT_BACKEND_PORT = '8081';

let lastResolutionSource: string = 'localhost fallback';
let lastPortOverride: string | null = null;

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const sanitizePort = (value: unknown): string | null => {
  if (!isNonEmptyString(value)) return null;
  const trimmed = value.trim().replace(/^:+/, '');
  return trimmed.length > 0 ? trimmed : null;
};

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

const normaliseBase = (value: string, portOverride?: string | null) => {
  const absolute = toAbsoluteUrl(value);
  const explicitPort = sanitizePort(portOverride) || new URL(absolute).port || DEFAULT_BACKEND_PORT;
  return applyPortIfMissing(absolute, explicitPort);
};

const readMetaContent = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const element = document.querySelector(`meta[name="${name}"]`);
  const content = element?.getAttribute('content');
  return isNonEmptyString(content) ? content : null;
};

const readBackendPortOverride = (): string | null => {
  const globalScope = globalThis as any;
  const candidates = [
    globalScope?.BACKEND_PORT,
    globalScope?.__BACKEND_PORT__,
    globalScope?.API_PORT,
    globalScope?.ENV?.BACKEND_PORT,
    globalScope?.ENV?.API_PORT,
    globalScope?.CONFIG?.BACKEND_PORT,
    globalScope?.process?.env?.BACKEND_PORT,
    readMetaContent('primecal-backend-port'),
    readMetaContent('primecal-api-port'),
  ];

  for (const candidate of candidates) {
    const port = sanitizePort(candidate);
    if (port) {
      return port;
    }
  }

  return null;
};

const readGlobalBaseUrl = (portOverride?: string | null): string | null => {
  const globalScope = globalThis as any;
  const candidates = [
    globalScope?.BASE_URL,
    globalScope?.API_URL,
    globalScope?.__BASE_URL__,
    globalScope?.__API_URL__,
    globalScope?.ENV?.BASE_URL,
    globalScope?.ENV?.API_URL,
    globalScope?.CONFIG?.BASE_URL,
    globalScope?.CONFIG?.API_URL,
    globalScope?.process?.env?.BASE_URL,
    globalScope?.process?.env?.API_URL,
  ];

  for (const candidate of candidates) {
    if (isNonEmptyString(candidate)) {
      return normaliseBase(candidate, portOverride);
    }
  }

  return null;
};

const readMetaBaseUrl = (portOverride?: string | null): string | null => {
  const candidates = [
    readMetaContent('primecal-backend-url'),
    readMetaContent('primecal-api-url'),
    readMetaContent('primecal-base-url'),
  ];

  for (const candidate of candidates) {
    if (candidate) {
      return normaliseBase(candidate, portOverride);
    }
  }

  return null;
};

const resolveBaseUrl = (): string => {
  const portOverride = readBackendPortOverride();
  lastPortOverride = portOverride;

  const globalOverride = readGlobalBaseUrl(portOverride);
  if (globalOverride) {
    lastResolutionSource = 'global override';
    return globalOverride;
  }

  const metaOverride = readMetaBaseUrl(portOverride);
  if (metaOverride) {
    lastResolutionSource = 'meta tag override';
    return metaOverride;
  }

  if (typeof window !== 'undefined') {
    const { origin, protocol, hostname, port } = window.location;

    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      if (isNonEmptyString(portOverride)) {
        lastResolutionSource = 'window.location (port override)';
        return `${protocol}//${hostname}:${portOverride}`;
      }

      if (isNonEmptyString(port)) {
        lastResolutionSource = 'window.location';
        return trimTrailingSlash(origin);
      }

      lastResolutionSource = 'window.location (default port)';
      return `${protocol}//${hostname}:${DEFAULT_BACKEND_PORT}`;
    }
  }

  lastResolutionSource = 'localhost fallback';
  const fallbackPort = sanitizePort(lastPortOverride) || DEFAULT_BACKEND_PORT;
  return `http://localhost:${fallbackPort}`;
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
  clientLogger.debug('api', 'API configuration resolved', {
    baseUrl: BASE_URL,
    backendPort: BACKEND_PORT,
    portOverride: lastPortOverride ?? 'none',
    source: lastResolutionSource,
  });
};
