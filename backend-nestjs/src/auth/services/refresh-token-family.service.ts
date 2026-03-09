import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '../../entities/refresh-token.entity';
import { SecurityAuditService } from '../../logging/security-audit.service';
import type { RefreshValidationResult } from '../token.types';

@Injectable()
export class RefreshTokenFamilyService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly securityAudit: SecurityAuditService,
  ) {}

  async validateForRotation(
    tokenValueHash: string,
    fingerprintHash?: string,
  ): Promise<RefreshValidationResult> {
    const token = await this.refreshTokenRepository.findOne({
      where: { tokenHash: tokenValueHash },
      relations: ['user'],
    });

    if (!token) {
      return { ok: false, reason: 'invalid' };
    }

    const now = Date.now();
    if (token.expiresAt.getTime() <= now || token.familyExpiresAt.getTime() <= now) {
      return { ok: false, reason: 'expired', token };
    }

    if (
      token.fingerprintHash &&
      fingerprintHash &&
      token.fingerprintHash !== fingerprintHash
    ) {
      await this.revokeFamily(token.familyId, 'fingerprint_mismatch');
      await this.securityAudit.log('auth.refresh.suspicious', {
        userId: token.userId,
        tokenId: token.id,
        familyId: token.familyId,
        reason: 'fingerprint_mismatch',
      });
      return { ok: false, reason: 'fingerprint_mismatch', token };
    }

    if (token.revoked) {
      const isReuse = Boolean(token.replacedByTokenId || token.consumedAt);
      if (isReuse) {
        await this.revokeFamily(token.familyId, 'token_reuse_detected');
        await this.securityAudit.log('auth.refresh.suspicious', {
          userId: token.userId,
          tokenId: token.id,
          familyId: token.familyId,
          reason: 'token_reuse_detected',
        });
        return { ok: false, reason: 'reused', token };
      }
      return { ok: false, reason: 'revoked', token };
    }

    return { ok: true, token };
  }

  async markTokenRotated(previousTokenId: string, nextTokenId: string): Promise<void> {
    await this.refreshTokenRepository.update(previousTokenId, {
      revoked: true,
      revokedAt: new Date(),
      revocationReason: 'rotated',
      replacedByTokenId: nextTokenId,
      consumedAt: new Date(),
      lastUsedAt: new Date(),
    });
  }

  async revokeFamily(familyId: string, reason: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { familyId },
      {
        revoked: true,
        revokedAt: new Date(),
        revocationReason: reason,
      },
    );
  }

  async revokeUserFamilies(userId: number, reason: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId },
      {
        revoked: true,
        revokedAt: new Date(),
        revocationReason: reason,
      },
    );
  }

  assertValidRotation(result: RefreshValidationResult): asserts result is {
    ok: true;
    token: RefreshToken;
  } {
    if (result.ok && result.token) {
      return;
    }

    switch (result.reason) {
      case 'expired':
      case 'revoked':
      case 'reused':
      case 'fingerprint_mismatch':
        throw new UnauthorizedException('Refresh token rejected');
      case 'invalid':
      default:
        throw new UnauthorizedException('Invalid refresh token');
    }
  }
}

