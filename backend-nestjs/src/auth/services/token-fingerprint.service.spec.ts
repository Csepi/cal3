import type { Request } from 'express';
import {
  DEVICE_FINGERPRINT_COOKIE,
  DEVICE_FINGERPRINT_HEADER,
  TokenFingerprintService,
} from './token-fingerprint.service';

describe('TokenFingerprintService', () => {
  let service: TokenFingerprintService;

  beforeEach(() => {
    service = new TokenFingerprintService();
  });

  it('creates random fingerprints', () => {
    const one = service.createFingerprint();
    const two = service.createFingerprint();

    expect(one).toBeTruthy();
    expect(two).toBeTruthy();
    expect(one).not.toEqual(two);
  });

  it('hashes fingerprints deterministically', () => {
    const hashA = service.hashFingerprint('sample-fingerprint');
    const hashB = service.hashFingerprint('sample-fingerprint');

    expect(hashA).toEqual(hashB);
    expect(hashA).toHaveLength(64);
  });

  it('extracts fingerprint from cookie before header', () => {
    const req = {
      cookies: {
        [DEVICE_FINGERPRINT_COOKIE]: 'cookie-value',
      },
      headers: {
        [DEVICE_FINGERPRINT_HEADER]: 'header-value',
      },
    } as unknown as Request;

    expect(service.extractFingerprint(req)).toBe('cookie-value');
  });

  it('extracts fingerprint from header when cookie is missing', () => {
    const req = {
      cookies: {},
      headers: {
        [DEVICE_FINGERPRINT_HEADER]: 'header-value',
      },
    } as unknown as Request;

    expect(service.extractFingerprint(req)).toBe('header-value');
  });
});

