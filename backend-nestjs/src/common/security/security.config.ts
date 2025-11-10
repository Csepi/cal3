import { Logger } from '@nestjs/common';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import helmet, { HelmetOptions } from 'helmet';

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

  return {
    contentSecurityPolicy: {
      directives: {
        ...DEFAULT_DIRECTIVES,
        connectSrc,
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
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

export function buildCorsOptions(
  allowedOrigins: string[],
): CorsOptions {
  const exactOrigins = allowedOrigins.filter((origin) => !origin.includes('*'));
  const wildcardOrigins = allowedOrigins
    .filter((origin) => origin.includes('*'))
    .map((origin) => wildcardToRegExp(origin));

  const allowedHeaders = [
    'Authorization',
    'Content-Type',
    'X-Requested-With',
    'X-Organisation-Id',
    'X-Idempotency-Key',
    'X-CSRF-Token',
  ];

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
