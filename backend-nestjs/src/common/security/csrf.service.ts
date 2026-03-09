import { Injectable } from '@nestjs/common';
import { randomBytes, timingSafeEqual } from 'crypto';

export const CSRF_COOKIE_NAME = 'cal3_csrf_token';
export const CSRF_HEADER_NAME = 'x-csrf-token';

@Injectable()
export class CsrfService {
  generateToken(byteLength = 32): string {
    return randomBytes(byteLength).toString('base64url');
  }

  tokensMatch(expected: string, received: string): boolean {
    try {
      const expectedBuffer = Buffer.from(expected, 'utf8');
      const receivedBuffer = Buffer.from(received, 'utf8');
      if (expectedBuffer.length !== receivedBuffer.length) {
        return false;
      }
      return timingSafeEqual(expectedBuffer, receivedBuffer);
    } catch {
      return false;
    }
  }
}

