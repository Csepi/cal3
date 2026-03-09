import {
  ForbiddenException,
  Injectable,
  Logger,
  NestMiddleware,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  CsrfService,
} from '../security/csrf.service';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const CSRF_EXCLUDED_PATH_PREFIXES = [
  '/api/automation/webhook',
  '/automation/webhook',
  '/api/security/reports',
  '/security/reports',
] as const;

@Injectable()
export class CsrfProtectionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CsrfProtectionMiddleware.name);

  constructor(private readonly csrfService: CsrfService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const shouldValidate = this.shouldValidate(req);
    const headerToken = this.extractCsrfHeader(req);
    const csrfCookieToken = this.extractCsrfCookie(req);
    const activeToken =
      csrfCookieToken ??
      this.issueToken(req, res, shouldValidate ? headerToken : undefined);

    if (!shouldValidate) {
      next();
      return;
    }

    if (!headerToken || !this.csrfService.tokensMatch(activeToken, headerToken)) {
      this.logger.warn(
        `Rejected CSRF validation for ${req.method} ${req.originalUrl ?? req.url}`,
      );
      next(new ForbiddenException('Invalid CSRF token'));
      return;
    }

    next();
  }

  private shouldValidate(req: Request): boolean {
    if (!MUTATING_METHODS.has(req.method.toUpperCase())) {
      return false;
    }

    const path = req.path || req.url || '';
    if (CSRF_EXCLUDED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))) {
      return false;
    }

    const clientHeader = req.headers['x-primecal-client'];
    const clientType = Array.isArray(clientHeader)
      ? clientHeader[0]
      : clientHeader;
    if (typeof clientType === 'string' && clientType.toLowerCase() === 'mobile-native') {
      return false;
    }

    return Boolean(req.headers.cookie);
  }

  private issueToken(req: Request, res: Response, tokenOverride?: string): string {
    const token = tokenOverride ?? this.csrfService.generateToken();
    const sameSite = this.resolveSameSite(req);
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      secure: this.shouldUseSecureCookie(req, sameSite),
      sameSite,
      path: '/',
      maxAge: 180 * 24 * 60 * 60 * 1000,
    });
    return token;
  }

  private resolveSameSite(req: Request): 'strict' | 'none' {
    const clientHeader = req.headers['x-primecal-client'];
    const clientType = Array.isArray(clientHeader)
      ? clientHeader[0]
      : clientHeader;
    if (typeof clientType === 'string' && clientType.toLowerCase() === 'mobile-native') {
      return 'none';
    }
    return 'strict';
  }

  private shouldUseSecureCookie(
    req: Request,
    sameSite: 'strict' | 'none',
  ): boolean {
    const forwardedProto = req.headers['x-forwarded-proto'];
    const protocol = Array.isArray(forwardedProto)
      ? forwardedProto[0]
      : forwardedProto;
    const isHttps = req.secure || protocol === 'https';
    if (sameSite === 'none') {
      return true;
    }
    return process.env.NODE_ENV !== 'development' || isHttps;
  }

  private extractCsrfHeader(req: Request): string | undefined {
    const headerValue = req.headers[CSRF_HEADER_NAME];
    if (typeof headerValue === 'string') {
      return headerValue;
    }
    if (Array.isArray(headerValue)) {
      return headerValue[0];
    }
    return undefined;
  }

  private extractCsrfCookie(req: Request): string | undefined {
    const parsedCookie = req.cookies?.[CSRF_COOKIE_NAME];
    if (typeof parsedCookie === 'string' && parsedCookie.length > 0) {
      return parsedCookie;
    }

    const rawCookie = req.headers.cookie;
    if (!rawCookie || typeof rawCookie !== 'string') {
      return undefined;
    }

    const cookies = rawCookie.split(';');
    for (const cookie of cookies) {
      const [rawKey, ...rest] = cookie.trim().split('=');
      if (rawKey === CSRF_COOKIE_NAME) {
        return decodeURIComponent(rest.join('='));
      }
    }

    return undefined;
  }
}
