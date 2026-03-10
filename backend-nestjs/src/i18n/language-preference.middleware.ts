import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

const SUPPORTED_LANGUAGES = new Set(['en', 'hu', 'de', 'fr']);

const normalizeLanguage = (input: string | null | undefined): string | null => {
  if (!input) {
    return null;
  }
  const base = input.toLowerCase().trim().split('-')[0];
  return SUPPORTED_LANGUAGES.has(base) ? base : null;
};

const readLanguageFromJwt = (request: Request): string | null => {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  try {
    const payloadRaw = Buffer.from(parts[1], 'base64url').toString('utf8');
    const payload = JSON.parse(payloadRaw) as {
      language?: string;
      preferredLanguage?: string;
      lang?: string;
    };

    return (
      normalizeLanguage(payload.preferredLanguage) ??
      normalizeLanguage(payload.language) ??
      normalizeLanguage(payload.lang)
    );
  } catch {
    return null;
  }
};

const readLanguageFromBody = (request: Request): string | null => {
  const body = request.body as
    | { lang?: string; language?: string; preferredLanguage?: string }
    | undefined;

  return (
    normalizeLanguage(body?.preferredLanguage) ??
    normalizeLanguage(body?.language) ??
    normalizeLanguage(body?.lang)
  );
};

const readLanguageFromQuery = (request: Request): string | null => {
  const queryLang = request.query?.lang;
  const resolved = Array.isArray(queryLang) ? queryLang[0] : queryLang;
  return typeof resolved === 'string' ? normalizeLanguage(resolved) : null;
};

@Injectable()
export class LanguagePreferenceMiddleware implements NestMiddleware {
  use(request: Request, _response: Response, next: NextFunction): void {
    const resolvedLanguage =
      readLanguageFromBody(request) ??
      readLanguageFromQuery(request) ??
      readLanguageFromJwt(request);

    if (resolvedLanguage) {
      request.headers['x-user-language'] = resolvedLanguage;
      (
        request as Request & { locale?: string; preferredLanguage?: string }
      ).locale = resolvedLanguage;
    }

    next();
  }
}
