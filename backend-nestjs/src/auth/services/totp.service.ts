import { Injectable } from '@nestjs/common';
import { createHmac, randomBytes } from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const toCounterBuffer = (counter: number): Buffer => {
  const buffer = Buffer.alloc(8);
  let value = Math.floor(counter);
  for (let i = 7; i >= 0; i -= 1) {
    buffer[i] = value & 0xff;
    value = Math.floor(value / 256);
  }
  return buffer;
};

const base32Encode = (input: Buffer): string => {
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of input) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
};

const base32Decode = (input: string): Buffer => {
  const normalized = input
    .trim()
    .replace(/=+$/g, '')
    .toUpperCase()
    .replace(/\s+/g, '');

  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (const char of normalized) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) {
      throw new Error('Invalid base32 secret');
    }

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(output);
};

@Injectable()
export class TotpService {
  private readonly intervalSeconds = 30;
  private readonly digits = 6;

  createSecret(): string {
    return base32Encode(randomBytes(20));
  }

  generateOtpAuthUrl(options: {
    issuer: string;
    accountName: string;
    secret: string;
  }): string {
    const issuer = encodeURIComponent(options.issuer);
    const label = encodeURIComponent(`${options.issuer}:${options.accountName}`);
    const secret = encodeURIComponent(options.secret);

    return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=${this.digits}&period=${this.intervalSeconds}`;
  }

  verifyCode(secret: string, code: string, window = 1): boolean {
    const normalizedCode = code.trim().replace(/\s+/g, '');
    if (!/^\d{6}$/.test(normalizedCode)) {
      return false;
    }

    const currentStep = Math.floor(Date.now() / 1000 / this.intervalSeconds);
    for (let offset = -window; offset <= window; offset += 1) {
      const expected = this.generateCodeForStep(secret, currentStep + offset);
      if (expected === normalizedCode) {
        return true;
      }
    }
    return false;
  }

  generateCode(secret: string, timestampMs = Date.now()): string {
    const step = Math.floor(timestampMs / 1000 / this.intervalSeconds);
    return this.generateCodeForStep(secret, step);
  }

  private generateCodeForStep(secret: string, step: number): string {
    const key = base32Decode(secret);
    const counter = toCounterBuffer(step);
    const hmac = createHmac('sha1', key).update(counter).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);
    const code = binary % 10 ** this.digits;
    return String(code).padStart(this.digits, '0');
  }
}
