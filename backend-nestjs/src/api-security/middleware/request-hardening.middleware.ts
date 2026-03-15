import {
  BadRequestException,
  Injectable,
  NestMiddleware,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { isIP } from 'net';
import type { NextFunction, Request, Response } from 'express';

import { bStatic } from '../../i18n/runtime';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const URL_FIELD_PATTERN = /(url|uri|webhook)/i;
const DEFAULT_ALLOWED_UPLOAD_PATH_PREFIXES = [
  '/api/user/profile-picture',
  '/user/profile-picture',
] as const;

interface JsonShapeStats {
  maxDepth: number;
  nodeCount: number;
  maxArrayLength: number;
}

@Injectable()
export class RequestHardeningMiddleware implements NestMiddleware {
  private readonly maxRequestBytes = this.readNumber(
    'REQUEST_MAX_BYTES',
    1024 * 1024,
  );
  private readonly maxUploadBytes = this.readNumber(
    'UPLOAD_MAX_BYTES',
    5 * 1024 * 1024,
  );
  private readonly maxJsonDepth = this.readNumber('REQUEST_MAX_JSON_DEPTH', 12);
  private readonly maxJsonNodes = this.readNumber('REQUEST_MAX_JSON_NODES', 2000);
  private readonly maxJsonArrayLength = this.readNumber(
    'REQUEST_MAX_JSON_ARRAY_LENGTH',
    1000,
  );
  private readonly allowedUploadPathPrefixes = Array.from(
    new Set([
      ...DEFAULT_ALLOWED_UPLOAD_PATH_PREFIXES,
      ...(process.env.SECURITY_ALLOWED_UPLOAD_PATHS ?? '')
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean),
    ]),
  );
  private readonly allowPrivateWebhookUrls =
    process.env.SECURITY_ALLOW_PRIVATE_WEBHOOK_URLS === 'true';

  use(req: Request, _res: Response, next: NextFunction): void {
    try {
      this.validateRequestSize(req);
      this.validateContentType(req);
      this.validateJsonShape(req.body);
      this.validateWebhookUrls(req.body);
      next();
    } catch (error) {
      next(error);
    }
  }

  private validateRequestSize(req: Request): void {
    const contentLengthHeader = req.headers['content-length'];
    const contentLengthRaw = Array.isArray(contentLengthHeader)
      ? contentLengthHeader[0]
      : contentLengthHeader;
    const contentLength = Number(contentLengthRaw);

    if (Number.isFinite(contentLength) && contentLength > this.maxRequestBytes) {
      throw new PayloadTooLargeException(bStatic('errors.auto.backend.kf17ebe05ab58'));
    }

    if (this.isMultipart(req) && Number.isFinite(contentLength)) {
      if (contentLength > this.maxUploadBytes) {
        throw new PayloadTooLargeException(bStatic('errors.auto.backend.k9ccded2d1d1c'));
      }
    }
  }

  private validateContentType(req: Request): void {
    if (!MUTATING_METHODS.has(req.method.toUpperCase())) {
      return;
    }

    if (!this.hasBody(req)) {
      return;
    }

    const header = req.headers['content-type'];
    const rawContentType = Array.isArray(header) ? header[0] : header;
    if (!rawContentType) {
      throw new UnsupportedMediaTypeException(
        bStatic('errors.auto.backend.k0d177c9a02f4'),
      );
    }

    const contentType = rawContentType.split(';')[0].trim().toLowerCase();
    const isJson = contentType === 'application/json';
    const isForm = contentType === 'application/x-www-form-urlencoded';
    const isMultipart = contentType === 'multipart/form-data';

    if (!isJson && !isForm && !isMultipart) {
      throw new UnsupportedMediaTypeException(
        `Unsupported Content-Type: ${contentType}`,
      );
    }

    const requestPath = this.resolveRequestPath(req);
    if (isMultipart && !this.isUploadPathAllowed(requestPath)) {
      throw new UnsupportedMediaTypeException(
        bStatic('errors.auto.backend.k8b135a6ebfca'),
      );
    }
  }

  private validateJsonShape(body: unknown): void {
    if (!body || typeof body !== 'object') {
      return;
    }

    const stats = this.inspectJsonShape(body, 0, new Set<unknown>());
    if (stats.maxDepth > this.maxJsonDepth) {
      throw new BadRequestException(
        `JSON depth exceeds maximum of ${this.maxJsonDepth}.`,
      );
    }
    if (stats.nodeCount > this.maxJsonNodes) {
      throw new BadRequestException(
        `JSON complexity exceeds maximum nodes (${this.maxJsonNodes}).`,
      );
    }
    if (stats.maxArrayLength > this.maxJsonArrayLength) {
      throw new BadRequestException(
        `JSON array length exceeds maximum of ${this.maxJsonArrayLength}.`,
      );
    }
  }

  private validateWebhookUrls(body: unknown): void {
    if (!body || typeof body !== 'object') {
      return;
    }

    const stack: unknown[] = [body];
    const visited = new Set<unknown>();

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current || typeof current !== 'object') {
        continue;
      }
      if (visited.has(current)) {
        continue;
      }
      visited.add(current);

      if (Array.isArray(current)) {
        current.forEach((entry) => stack.push(entry));
        continue;
      }

      const record = current as Record<string, unknown>;
      for (const [key, value] of Object.entries(record)) {
        if (typeof value === 'string' && URL_FIELD_PATTERN.test(key)) {
          if (!this.isSafeWebhookUrl(value)) {
            throw new BadRequestException(
              `Unsafe URL detected in field "${key}".`,
            );
          }
        } else if (value && typeof value === 'object') {
          stack.push(value);
        }
      }
    }
  }

  private inspectJsonShape(
    value: unknown,
    depth: number,
    visited: Set<unknown>,
  ): JsonShapeStats {
    if (!value || typeof value !== 'object') {
      return { maxDepth: depth, nodeCount: 1, maxArrayLength: 0 };
    }
    if (visited.has(value)) {
      return { maxDepth: depth, nodeCount: 0, maxArrayLength: 0 };
    }
    visited.add(value);

    if (Array.isArray(value)) {
      let maxDepth = depth;
      let nodeCount = 1;
      let maxArrayLength = value.length;
      value.forEach((entry) => {
        const child = this.inspectJsonShape(entry, depth + 1, visited);
        maxDepth = Math.max(maxDepth, child.maxDepth);
        nodeCount += child.nodeCount;
        maxArrayLength = Math.max(maxArrayLength, child.maxArrayLength);
      });
      return { maxDepth, nodeCount, maxArrayLength };
    }

    const record = value as Record<string, unknown>;
    let maxDepth = depth;
    let nodeCount = 1;
    let maxArrayLength = 0;
    Object.values(record).forEach((entry) => {
      const child = this.inspectJsonShape(entry, depth + 1, visited);
      maxDepth = Math.max(maxDepth, child.maxDepth);
      nodeCount += child.nodeCount;
      maxArrayLength = Math.max(maxArrayLength, child.maxArrayLength);
    });
    return { maxDepth, nodeCount, maxArrayLength };
  }

  private isSafeWebhookUrl(value: string): boolean {
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      return false;
    }

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    if (this.allowPrivateWebhookUrls) {
      return true;
    }

    if (hostname === 'localhost' || hostname.endsWith('.local')) {
      return false;
    }

    const ipVersion = isIP(hostname);
    if (ipVersion === 4) {
      if (
        hostname.startsWith('10.') ||
        hostname.startsWith('127.') ||
        hostname.startsWith('169.254.') ||
        hostname.startsWith('192.168.')
      ) {
        return false;
      }
      if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) {
        return false;
      }
    }

    if (ipVersion === 6) {
      if (
        hostname === '::1' ||
        hostname.startsWith('fc') ||
        hostname.startsWith('fd') ||
        hostname.startsWith('fe80')
      ) {
        return false;
      }
    }

    return true;
  }

  private hasBody(req: Request): boolean {
    if (req.body && typeof req.body === 'object') {
      if (Array.isArray(req.body)) {
        return req.body.length > 0;
      }
      return Object.keys(req.body as Record<string, unknown>).length > 0;
    }
    if (typeof req.body === 'string') {
      return req.body.length > 0;
    }

    const contentLengthHeader = req.headers['content-length'];
    const contentLengthRaw = Array.isArray(contentLengthHeader)
      ? contentLengthHeader[0]
      : contentLengthHeader;
    const contentLength = Number(contentLengthRaw);
    return Number.isFinite(contentLength) && contentLength > 0;
  }

  private isMultipart(req: Request): boolean {
    const header = req.headers['content-type'];
    const rawContentType = Array.isArray(header) ? header[0] : header;
    if (!rawContentType) {
      return false;
    }
    return rawContentType.toLowerCase().startsWith('multipart/form-data');
  }

  private isUploadPathAllowed(path: string): boolean {
    if (this.allowedUploadPathPrefixes.length === 0) {
      return false;
    }
    return this.allowedUploadPathPrefixes.some((prefix) =>
      path.startsWith(prefix),
    );
  }

  private resolveRequestPath(req: Request): string {
    const candidatePaths = [
      typeof req.originalUrl === 'string' ? req.originalUrl : '',
      typeof req.baseUrl === 'string' && typeof req.path === 'string'
        ? `${req.baseUrl}${req.path}`
        : '',
      typeof req.path === 'string' ? req.path : '',
      typeof req.url === 'string' ? req.url : '',
    ];

    for (const candidate of candidatePaths) {
      const normalized = candidate.split('?')[0].trim();
      if (normalized.length > 0 && normalized !== '/') {
        return normalized;
      }
    }

    return '/';
  }

  private readNumber(name: string, fallback: number): number {
    const parsed = Number(process.env[name]);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }
}
