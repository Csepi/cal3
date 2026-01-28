import { Logger } from '@nestjs/common';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { type HelmetOptions } from 'helmet';

const logger = new Logger('SecurityConfig');

const DEFAULT_DIRECTIVES: Record<string, Iterable<string>> = {
  defaultSrc: ["'none'"],
  frameSrc: ["'none'"],
  frameAncestors: ["'none'"],
  scriptSrc: ["'self'"],
  connectSrc: ["'self'"],
  imgSrc: ["'self'", 'data:'],
  styleSrc: ["'self'"],
  fontSrc: ["'self'", 'data:'],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
};

const TRUSTED_LOCAL_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '[::1]',
]);
type CoopPolicy = 'same-origin' | 'same-origin-allow-popups' | 'unsafe-none';
const ALLOWED_COOP_POLICIES: Set<CoopPolicy> = new Set([
  'same-origin',
  'same-origin-allow-popups',
  'unsafe-none',
]);

export function resolveAllowedOrigins(): string[] {
  const envOrigins = (process.env.SECURITY_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const derived = [
    process.env.FRONTEND_URL,
    process.env.PUBLIC_APP_URL,
    process.env.BASE_URL,
    process.env.DASHBOARD_URL,
    process.env.WEB_URL,
    deriveOriginWithPort(
      process.env.BASE_URL,
      process.env.FRONTEND_HOST_PORT ?? process.env.FRONTEND_PORT,
    ),
  ].filter(Boolean) as string[];

const localDefaults = [
    'http://localhost:3000',
    'http://localhost:4200',
    'http://localhost:5173',
    'http://localhost:8080',
    `http://localhost:${process.env.FRONTEND_PORT ?? '3000'}`,
  ];

  const unique = new Set<string>();
  [...envOrigins, ...derived, ...localDefaults].forEach((origin) => {
    if (origin) {
      unique.add(normalizeOrigin(origin));
    }
  });

  return Array.from(unique);
}

export function buildHelmetOptions(
  allowedOrigins: string[],
): HelmetOptions {
  const connectSrc = Array.from(
    new Set([...allowedOrigins, "'self'"].filter(Boolean)),
  );
  const coopEnabled = shouldEnableCrossOriginOpenerPolicy(allowedOrigins);
  const coopPolicy = resolveCoopPolicy(process.env.SECURITY_COOP_POLICY);

  return {
    contentSecurityPolicy: {
      directives: {
        ...DEFAULT_DIRECTIVES,
        connectSrc,
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: coopEnabled
      ? { policy: coopPolicy }
      : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: {
      includeSubDomains: true,
      preload: true,
      maxAge: 31536000,
    },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    xssFilter: false,
  };
}

const BASE_ALLOWED_HEADERS = [
  'Authorization',
  'Content-Type',
  'X-Requested-With',
  'X-Organisation-Id',
  'X-Idempotency-Key',
  'X-CSRF-Token',
] as const;

export function getCorsAllowedHeaders(): string[] {
  return [...BASE_ALLOWED_HEADERS];
}

export function buildCorsOptions(
  allowedOrigins: string[],
): CorsOptions {
  const exactOrigins = allowedOrigins.filter((origin) => !origin.includes('*'));
  const wildcardOrigins = allowedOrigins
    .filter((origin) => origin.includes('*'))
    .map((origin) => wildcardToRegExp(origin));

  const allowedHeaders = getCorsAllowedHeaders();

  return {
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (exactOrigins.includes(origin)) {
        return callback(null, true);
      }

      if (wildcardOrigins.some((regex) => regex.test(origin))) {
        return callback(null, true);
      }

      logger.warn(`Blocked CORS request from origin ${origin}`);
      return callback(new Error('Origin not allowed by CORS'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders,
    exposedHeaders: ['x-request-id'],
    credentials: true,
    preflightContinue: true,
    optionsSuccessStatus: 204,
    maxAge: parseInt(process.env.SECURITY_CORS_MAX_AGE ?? '600', 10),
  };
}

export function applyPermissionsPolicy(res: {
  setHeader: (key: string, value: string) => void;
}): void {
  res.setHeader(
    'Permissions-Policy',
    [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'bluetooth=()',
      'fullscreen=(self)',
    ].join(', '),
  );
}

function normalizeOrigin(origin: string): string {
  try {
    const url = new URL(origin);
    return url.origin;
  } catch {
    return origin.replace(/\/+$/, '');
  }
}

function deriveOriginWithPort(
  origin?: string,
  port?: string,
): string | null {
  if (!origin) {
    return null;
  }
  const trimmedPort = port?.trim();
  if (!trimmedPort) {
    return null;
  }
  try {
    const url = new URL(origin);
    if (url.port === trimmedPort) {
      return url.origin;
    }
    if (url.protocol === 'http:' && trimmedPort === '80') {
      url.port = '';
    } else if (url.protocol === 'https:' && trimmedPort === '443') {
      url.port = '';
    } else {
      url.port = trimmedPort;
    }
    return url.origin;
  } catch {
    return `${origin.replace(/\/+$/, '')}:${trimmedPort}`;
  }
}

function wildcardToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  const regex = '^' + escaped.replace(/\\\*/g, '.*') + '$';
  return new RegExp(regex);
}

function isPotentiallyTrustworthyOrigin(origin?: string | null): boolean {
  if (!origin) {
    return false;
  }
  try {
    const url = new URL(origin);
    if (url.protocol === 'https:' || url.protocol === 'wss:') {
      return true;
    }
    if (
      url.protocol === 'http:' &&
      TRUSTED_LOCAL_HOSTS.has(url.hostname.toLowerCase())
    ) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

function shouldEnableCrossOriginOpenerPolicy(
  allowedOrigins: string[],
): boolean {
  const override = process.env.SECURITY_ENABLE_COOP?.toLowerCase();
  if (override === 'true') {
    return true;
  }
  if (override === 'false') {
    logger.log(
      'Cross-Origin-Opener-Policy explicitly disabled via SECURITY_ENABLE_COOP=false',
    );
    return false;
  }

  const candidateOrigins = [
    process.env.BACKEND_URL,
    process.env.FRONTEND_URL,
    process.env.BASE_URL,
    ...allowedOrigins,
  ].filter((origin): origin is string => Boolean(origin));

  const trustworthy = candidateOrigins.some((origin) =>
    isPotentiallyTrustworthyOrigin(origin),
  );

  if (!trustworthy) {
    logger.warn(
      'Cross-Origin-Opener-Policy header suppressed (origin not trustworthy). Use HTTPS or set SECURITY_ENABLE_COOP=true to override.',
    );
  }

  return trustworthy;
}

function resolveCoopPolicy(rawPolicy?: string | null): CoopPolicy {
  if (rawPolicy) {
    const normalized = rawPolicy.trim().toLowerCase();
    if (ALLOWED_COOP_POLICIES.has(normalized as CoopPolicy)) {
      return normalized as CoopPolicy;
    }
    logger.warn(
      `Unsupported SECURITY_COOP_POLICY="${rawPolicy}" provided. Falling back to "same-origin".`,
    );
  }
  return 'same-origin';
}
