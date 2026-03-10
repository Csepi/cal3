import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { createHmac } from 'crypto';
import { lookup } from 'dns/promises';
import { isIP } from 'net';

export interface SecureOutboundRequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
  maxResponseBytes?: number;
  signingSecret?: string | null;
}

export interface SecureOutboundResponse {
  status: number;
  ok: boolean;
  headers: Record<string, string>;
  bodyText: string;
  bodyJson?: unknown;
}

@Injectable()
export class OutboundRequestSecurityService {
  private readonly defaultTimeoutMs = this.readPositiveNumber(
    'OUTBOUND_TIMEOUT_MS',
    10_000,
  );
  private readonly defaultMaxResponseBytes = this.readPositiveNumber(
    'OUTBOUND_MAX_RESPONSE_BYTES',
    512 * 1024,
  );
  private readonly allowHttp =
    process.env.OUTBOUND_ALLOW_HTTP === 'true';
  private readonly allowPrivateNetworks =
    process.env.OUTBOUND_ALLOW_PRIVATE_NETWORKS === 'true';
  private readonly allowedHostPatterns = this.readStringList(
    'OUTBOUND_ALLOWED_HOSTS',
  );

  async send(options: SecureOutboundRequestOptions): Promise<SecureOutboundResponse> {
    const method = options.method ?? 'POST';
    const parsedUrl = this.parseAndValidateUrl(options.url);
    await this.assertDestinationAllowed(parsedUrl);

    const body = options.body ?? '';
    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
    const maxResponseBytes =
      options.maxResponseBytes ?? this.defaultMaxResponseBytes;

    const headers = new Headers(options.headers ?? {});
    if (body && !headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }
    headers.set('user-agent', headers.get('user-agent') ?? 'PrimeCal/1.0');

    this.applyRequestSigning(headers, options.signingSecret ?? null, {
      method,
      pathWithQuery: `${parsedUrl.pathname}${parsedUrl.search}`,
      body,
    });

    const response = await fetch(parsedUrl, {
      method,
      headers,
      body: body || undefined,
      redirect: 'error',
      signal: AbortSignal.timeout(timeoutMs),
    });

    const bodyText = await this.readBodyWithLimit(response, maxResponseBytes);
    let bodyJson: unknown;
    if (this.isJsonResponse(response)) {
      try {
        bodyJson = JSON.parse(bodyText);
      } catch {
        bodyJson = undefined;
      }
    }

    return {
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
      bodyText,
      bodyJson,
    };
  }

  parseAndValidateUrl(rawUrl: string): URL {
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      throw new BadRequestException('Outbound URL is invalid.');
    }

    if (!['https:', 'http:'].includes(parsed.protocol)) {
      throw new ForbiddenException(
        'Outbound URL must use http or https protocols.',
      );
    }

    if (parsed.protocol === 'http:' && !this.allowHttp) {
      throw new ForbiddenException(
        'HTTP outbound requests are disabled. Use HTTPS endpoints.',
      );
    }

    if (parsed.username || parsed.password) {
      throw new ForbiddenException(
        'Outbound URLs with embedded credentials are not allowed.',
      );
    }

    return parsed;
  }

  private async assertDestinationAllowed(url: URL): Promise<void> {
    const hostname = url.hostname.toLowerCase();

    if (hostname === 'localhost' || hostname.endsWith('.local')) {
      throw new ForbiddenException('Local destinations are not allowed.');
    }

    if (this.allowedHostPatterns.length > 0) {
      const allowed = this.allowedHostPatterns.some((pattern) =>
        this.hostMatchesPattern(hostname, pattern),
      );
      if (!allowed) {
        throw new ForbiddenException(
          `Destination host ${hostname} is not on the allowlist.`,
        );
      }
    }

    if (this.allowPrivateNetworks) {
      return;
    }

    const addresses = await lookup(hostname, { all: true, verbatim: true });
    const blockedAddress = addresses.find(({ address }) =>
      this.isPrivateOrInternalAddress(address),
    );
    if (blockedAddress) {
      throw new ForbiddenException(
        `Destination resolves to a private/internal network (${blockedAddress.address}).`,
      );
    }
  }

  private applyRequestSigning(
    headers: Headers,
    signingSecret: string | null,
    payload: {
      method: string;
      pathWithQuery: string;
      body: string;
    },
  ): void {
    if (!signingSecret) {
      return;
    }

    const timestamp = String(Math.floor(Date.now() / 1000));
    const canonical = `${timestamp}.${payload.method.toUpperCase()}.${payload.pathWithQuery}.${payload.body}`;
    const signature = createHmac('sha256', signingSecret)
      .update(canonical)
      .digest('hex');

    headers.set('x-primecal-timestamp', timestamp);
    headers.set('x-primecal-signature', `sha256=${signature}`);
  }

  private async readBodyWithLimit(
    response: Response,
    maxBytes: number,
  ): Promise<string> {
    const contentLength = Number(response.headers.get('content-length') ?? 0);
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      throw new ForbiddenException(
        `Outbound response exceeds allowed size (${maxBytes} bytes).`,
      );
    }

    if (!response.body) {
      return '';
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (!value) {
        continue;
      }
      total += value.byteLength;
      if (total > maxBytes) {
        throw new ForbiddenException(
          `Outbound response exceeds allowed size (${maxBytes} bytes).`,
        );
      }
      chunks.push(value);
    }

    const merged = new Uint8Array(total);
    let offset = 0;
    chunks.forEach((chunk) => {
      merged.set(chunk, offset);
      offset += chunk.byteLength;
    });
    return Buffer.from(merged).toString('utf8');
  }

  private isJsonResponse(response: Response): boolean {
    const contentType = response.headers.get('content-type') ?? '';
    return contentType.toLowerCase().includes('application/json');
  }

  private isPrivateOrInternalAddress(address: string): boolean {
    const version = isIP(address);
    if (version === 4) {
      return (
        address.startsWith('10.') ||
        address.startsWith('127.') ||
        address.startsWith('169.254.') ||
        address.startsWith('192.168.') ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(address) ||
        address === '0.0.0.0'
      );
    }
    if (version === 6) {
      const normalized = address.toLowerCase();
      return (
        normalized === '::1' ||
        normalized === '::' ||
        normalized.startsWith('fc') ||
        normalized.startsWith('fd') ||
        normalized.startsWith('fe80')
      );
    }
    return true;
  }

  private hostMatchesPattern(hostname: string, pattern: string): boolean {
    const normalizedPattern = pattern.toLowerCase();
    if (normalizedPattern.startsWith('*.')) {
      const suffix = normalizedPattern.slice(1);
      return hostname.endsWith(suffix);
    }
    return hostname === normalizedPattern;
  }

  private readStringList(envName: string): string[] {
    return (process.env[envName] ?? '')
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean);
  }

  private readPositiveNumber(envName: string, fallback: number): number {
    const parsed = Number(process.env[envName]);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }
}
