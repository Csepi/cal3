import { Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import type { Request } from 'express';

export const DEVICE_FINGERPRINT_COOKIE = 'cal3_device_fgp';
export const DEVICE_FINGERPRINT_HEADER = 'x-device-fingerprint';

@Injectable()
export class TokenFingerprintService {
  createFingerprint(): string {
    return randomBytes(32).toString('base64url');
  }

  hashFingerprint(fingerprint: string): string {
    return createHash('sha256').update(fingerprint).digest('hex');
  }

  extractFingerprint(request: Request): string | undefined {
    const fromCookie = request.cookies?.[DEVICE_FINGERPRINT_COOKIE];
    if (typeof fromCookie === 'string' && fromCookie.length > 0) {
      return fromCookie;
    }

    const headerValue = request.headers[DEVICE_FINGERPRINT_HEADER];
    if (typeof headerValue === 'string' && headerValue.length > 0) {
      return headerValue;
    }
    if (Array.isArray(headerValue) && typeof headerValue[0] === 'string') {
      return headerValue[0];
    }
    return undefined;
  }
}

