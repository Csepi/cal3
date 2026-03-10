import { Injectable, Logger } from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';

const ENVELOPE_PREFIX = 'enc';
const ENVELOPE_PARTS = 5;
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const KEY_SIZE_BYTES = 32;

interface ParsedEnvelope {
  keyVersion: string;
  iv: Buffer;
  authTag: Buffer;
  payload: Buffer;
}

@Injectable()
export class FieldEncryptionService {
  private readonly logger = new Logger(FieldEncryptionService.name);
  private readonly activeKeyVersion = (
    process.env.FIELD_ENCRYPTION_ACTIVE_KEY_VERSION || 'v1'
  ).trim();
  private readonly keys = this.loadKeys();

  encrypt(plaintext: string): { ciphertext: string; keyVersion: string } {
    const keyVersion = this.activeKeyVersion;
    const key = this.resolveKey(keyVersion);
    const iv = randomBytes(12);
    const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    const envelope = [
      ENVELOPE_PREFIX,
      keyVersion,
      iv.toString('base64url'),
      authTag.toString('base64url'),
      encrypted.toString('base64url'),
    ].join(':');

    return {
      ciphertext: envelope,
      keyVersion,
    };
  }

  decrypt(ciphertext: string): { plaintext: string; keyVersion: string } {
    const parsed = this.parseEnvelope(ciphertext);
    const key = this.resolveKey(parsed.keyVersion);

    const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, parsed.iv);
    decipher.setAuthTag(parsed.authTag);

    const decrypted = Buffer.concat([
      decipher.update(parsed.payload),
      decipher.final(),
    ]);

    return {
      plaintext: decrypted.toString('utf8'),
      keyVersion: parsed.keyVersion,
    };
  }

  isReady(): boolean {
    return this.keys.size > 0;
  }

  getActiveKeyVersion(): string {
    return this.activeKeyVersion;
  }

  getLoadedKeyVersions(): string[] {
    return Array.from(this.keys.keys()).sort((a, b) => a.localeCompare(b));
  }

  private parseEnvelope(ciphertext: string): ParsedEnvelope {
    const parts = ciphertext.split(':');
    if (parts.length !== ENVELOPE_PARTS || parts[0] !== ENVELOPE_PREFIX) {
      throw new Error('Unsupported encrypted payload format');
    }

    const [, keyVersion, ivRaw, authTagRaw, payloadRaw] = parts;
    return {
      keyVersion,
      iv: Buffer.from(ivRaw, 'base64url'),
      authTag: Buffer.from(authTagRaw, 'base64url'),
      payload: Buffer.from(payloadRaw, 'base64url'),
    };
  }

  private resolveKey(version: string): Buffer {
    const key = this.keys.get(version);
    if (!key) {
      throw new Error(
        `No encryption key loaded for version "${version}". Set FIELD_ENCRYPTION_KEY_${version.toUpperCase()}.`,
      );
    }
    return key;
  }

  private loadKeys(): Map<string, Buffer> {
    const keys = new Map<string, Buffer>();
    const parsedMap = this.parseJsonKeyMap();

    for (const [version, candidate] of parsedMap.entries()) {
      const normalized = this.normalizeKey(candidate);
      if (normalized) {
        keys.set(version, normalized);
      }
    }

    const fallbackEnvKey =
      process.env.FIELD_ENCRYPTION_KEY_V1 || process.env.FIELD_ENCRYPTION_KEY;
    if (!keys.has('v1') && fallbackEnvKey) {
      const normalized = this.normalizeKey(fallbackEnvKey);
      if (normalized) {
        keys.set('v1', normalized);
      }
    }

    if (!keys.has(this.activeKeyVersion)) {
      const envName = `FIELD_ENCRYPTION_KEY_${this.activeKeyVersion.toUpperCase()}`;
      const configured = process.env[envName];
      const normalized = configured ? this.normalizeKey(configured) : null;
      if (normalized) {
        keys.set(this.activeKeyVersion, normalized);
      }
    }

    if (keys.size === 0) {
      const emergencySource =
        process.env.JWT_SECRET || process.env.SESSION_SECRET || 'primecal-dev-key';
      const derived = createHash('sha256').update(emergencySource).digest();
      keys.set('v1', derived);
      this.logger.warn(
        'FIELD_ENCRYPTION_KEY_* is not configured. Using derived fallback key. Configure managed keys for production.',
      );
    }

    return keys;
  }

  private parseJsonKeyMap(): Map<string, string> {
    const map = new Map<string, string>();
    const raw = process.env.FIELD_ENCRYPTION_KEYS_JSON;
    if (!raw) {
      return map;
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return map;
      }
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === 'string' && key.trim().length > 0) {
          map.set(key.trim(), value.trim());
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Failed to parse FIELD_ENCRYPTION_KEYS_JSON. ${message}`,
      );
    }

    return map;
  }

  private normalizeKey(raw: string): Buffer | null {
    const trimmed = raw.trim();
    if (!trimmed) {
      return null;
    }

    const asBase64Url = this.tryDecode(trimmed, 'base64url');
    if (asBase64Url && asBase64Url.length === KEY_SIZE_BYTES) {
      return asBase64Url;
    }

    const asBase64 = this.tryDecode(trimmed, 'base64');
    if (asBase64 && asBase64.length === KEY_SIZE_BYTES) {
      return asBase64;
    }

    if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
      return Buffer.from(trimmed, 'hex');
    }

    if (trimmed.length >= 32) {
      return createHash('sha256').update(trimmed).digest();
    }

    return null;
  }

  private tryDecode(
    value: string,
    encoding: BufferEncoding,
  ): Buffer | null {
    try {
      return Buffer.from(value, encoding);
    } catch {
      return null;
    }
  }
}
