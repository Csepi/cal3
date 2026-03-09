import { UnauthorizedException } from '@nestjs/common';
import { RefreshTokenFamilyService } from './refresh-token-family.service';
import type { RefreshToken } from '../../entities/refresh-token.entity';
import type { SecurityAuditService } from '../../logging/security-audit.service';

describe('RefreshTokenFamilyService', () => {
  const repository = {
    findOne: jest.fn(),
    update: jest.fn(),
  };
  const securityAudit = {
    log: jest.fn(),
  } as unknown as SecurityAuditService;

  let service: RefreshTokenFamilyService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RefreshTokenFamilyService(
      repository as never,
      securityAudit,
    );
  });

  it('returns invalid when token hash is unknown', async () => {
    repository.findOne.mockResolvedValue(null);

    const result = await service.validateForRotation('hash');

    expect(result).toEqual({ ok: false, reason: 'invalid' });
  });

  it('revokes family and marks suspicious when fingerprint mismatches', async () => {
    const token = buildToken({
      fingerprintHash: 'expected-fp',
    });
    repository.findOne.mockResolvedValue(token);

    const result = await service.validateForRotation('hash', 'different-fp');

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('fingerprint_mismatch');
    expect(repository.update).toHaveBeenCalledWith(
      { familyId: token.familyId },
      expect.objectContaining({
        revoked: true,
        revocationReason: 'fingerprint_mismatch',
      }),
    );
    expect((securityAudit.log as jest.Mock).mock.calls[0][0]).toBe(
      'auth.refresh.suspicious',
    );
  });

  it('flags token reuse when an already rotated token is presented', async () => {
    const token = buildToken({
      revoked: true,
      replacedByTokenId: 'new-token-id',
      consumedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    repository.findOne.mockResolvedValue(token);

    const result = await service.validateForRotation('hash', token.fingerprintHash ?? undefined);

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('reused');
  });

  it('throws unauthorized for rejected rotations', () => {
    expect(() =>
      service.assertValidRotation({
        ok: false,
        reason: 'reused',
      }),
    ).toThrow(UnauthorizedException);
  });
});

function buildToken(overrides: Partial<RefreshToken> = {}): RefreshToken {
  return {
    id: 'token-id',
    userId: 1,
    user: {
      id: 1,
    },
    jti: 'refresh-jti',
    tokenHash: 'hash',
    familyId: 'family-id',
    parentTokenId: null,
    fingerprintHash: 'expected-fp',
    expiresAt: new Date('2027-02-01T00:00:00.000Z'),
    familyExpiresAt: new Date('2027-03-01T00:00:00.000Z'),
    revoked: false,
    revokedAt: null,
    revocationReason: null,
    replacedByTokenId: null,
    ipAddress: null,
    userAgent: null,
    consumedAt: null,
    lastUsedAt: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  } as RefreshToken;
}
