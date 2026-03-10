import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { firstValueFrom, Observable, of } from 'rxjs';
import {
  SKIP_IDEMPOTENCY_KEY,
} from '../decorators/skip-idempotency.decorator';
import { IdempotencyService } from '../services/idempotency.service';

import { bStatic } from '../../i18n/runtime';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

type IdempotentRequest = {
  method: string;
  path?: string;
  baseUrl?: string;
  route?: { path?: string };
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  user?: { id?: number };
  apiKey?: { userId?: number };
  body?: unknown;
  query?: unknown;
  params?: unknown;
};

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly strictMode =
    process.env.IDEMPOTENCY_REQUIRE_KEY_FOR_MUTATIONS === 'true';
  private readonly excludedPathPrefixes = (
    process.env.IDEMPOTENCY_EXCLUDED_PATH_PREFIXES ??
    '/api/auth,/auth,/api/security/reports,/security/reports,/api/security/honeypot,/security/honeypot'
  )
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  private readonly ttlSeconds = this.readNumber(
    'IDEMPOTENCY_DEFAULT_TTL_SEC',
    3600,
  );

  constructor(
    private readonly reflector: Reflector,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    if (
      this.reflector.getAllAndOverride<boolean>(SKIP_IDEMPOTENCY_KEY, [
        context.getHandler(),
        context.getClass(),
      ])
    ) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<IdempotentRequest>();
    const response = context.switchToHttp().getResponse<{
      setHeader: (name: string, value: string) => void;
    }>();
    const method = request.method.toUpperCase();

    if (!MUTATING_METHODS.has(method)) {
      return next.handle();
    }

    const scopePath = this.buildScopePath(request);
    if (this.shouldSkipPath(scopePath)) {
      return next.handle();
    }

    const userId = request.user?.id ?? request.apiKey?.userId;
    if (!userId) {
      return next.handle();
    }

    const key = this.extractIdempotencyKey(request);
    if (!key && this.strictMode) {
      throw new BadRequestException(
        bStatic('errors.auto.backend.ka9b53864b9d1'),
      );
    }

    if (!key) {
      return next.handle();
    }

    response.setHeader('X-Idempotency-Key', key);
    const payload = {
      body: request.body ?? null,
      query: request.query ?? null,
      params: request.params ?? null,
      path: scopePath,
      method,
    };

    const result = await this.idempotencyService.execute(
      {
        key,
        scope: `${method}:${scopePath}`,
        userId,
        ttlSeconds: this.ttlSeconds,
        payload,
      },
      () => firstValueFrom(next.handle()),
    );

    return of(result);
  }

  private shouldSkipPath(path: string): boolean {
    return this.excludedPathPrefixes.some((prefix) => path.startsWith(prefix));
  }

  private buildScopePath(request: IdempotentRequest): string {
    const routePath = request.route?.path ?? request.path ?? request.url ?? '';
    const base = request.baseUrl ?? '';
    return `${base}${routePath}` || '/';
  }

  private extractIdempotencyKey(request: IdempotentRequest): string | undefined {
    const header =
      request.headers['idempotency-key'] ??
      request.headers['x-idempotency-key'];
    const value = Array.isArray(header) ? header[0] : header;
    if (!value || typeof value !== 'string') {
      return undefined;
    }
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
  }

  private readNumber(name: string, fallback: number): number {
    const parsed = Number(process.env[name]);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }
}
