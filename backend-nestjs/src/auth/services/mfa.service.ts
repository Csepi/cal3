import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, createHash, timingSafeEqual } from 'crypto';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { TotpService } from './totp.service';
import { SecurityStoreService } from '../../api-security/services/security-store.service';
import { FieldEncryptionService } from '../../common/security/field-encryption.service';
import { SecurityAuditService } from '../../logging/security-audit.service';

import { bStatic } from '../../i18n/runtime';

const MFA_SETUP_TTL_SECONDS = 10 * 60;
const MFA_RECOVERY_CODES = 8;
const MFA_RECOVERY_SEGMENT_LENGTH = 5;

const normalizeRecoveryCode = (code: string): string =>
  code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

const hashRecoveryCode = (code: string): string =>
  createHash('sha256')
    .update(normalizeRecoveryCode(code))
    .digest('hex');

const createRecoveryCode = (): string => {
  const token = randomBytes(5).toString('hex').toUpperCase();
  return `${token.slice(0, MFA_RECOVERY_SEGMENT_LENGTH)}-${token.slice(MFA_RECOVERY_SEGMENT_LENGTH)}`;
};

@Injectable()
export class MfaService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly totpService: TotpService,
    private readonly securityStore: SecurityStoreService,
    private readonly fieldEncryptionService: FieldEncryptionService,
    private readonly securityAudit: SecurityAuditService,
  ) {}

  async getStatus(userId: number): Promise<{
    enabled: boolean;
    enrolledAt: string | null;
    recoveryCodesRemaining: number;
  }> {
    const user = await this.getUser(userId);
    const recoveryCodes = this.getRecoveryCodes(user);

    return {
      enabled: Boolean(user.mfaEnabled),
      enrolledAt: user.mfaEnrolledAt?.toISOString() ?? null,
      recoveryCodesRemaining: recoveryCodes.length,
    };
  }

  async createSetupChallenge(userId: number): Promise<{
    secret: string;
    otpAuthUrl: string;
    expiresInSeconds: number;
  }> {
    const user = await this.getUser(userId);
    const secret = this.totpService.createSecret();
    const accountLabel = user.email || user.username;
    const issuer = process.env.MFA_ISSUER || 'PrimeCal';
    const otpAuthUrl = this.totpService.generateOtpAuthUrl({
      issuer,
      accountName: accountLabel,
      secret,
    });

    await this.securityStore.setString(
      this.getSetupKey(userId),
      secret,
      MFA_SETUP_TTL_SECONDS,
    );

    await this.securityAudit.log('auth.mfa.setup', {
      userId,
      mfaAction: 'setup_challenge_created',
    });

    return {
      secret,
      otpAuthUrl,
      expiresInSeconds: MFA_SETUP_TTL_SECONDS,
    };
  }

  async enableMfa(userId: number, code: string): Promise<{ recoveryCodes: string[] }> {
    const secret = await this.securityStore.getString(this.getSetupKey(userId));
    if (!secret) {
      throw new BadRequestException(
        bStatic('errors.auto.backend.kfd4908a3510b'),
      );
    }

    if (!this.totpService.verifyCode(secret, code)) {
      throw new BadRequestException(bStatic('errors.auto.backend.k11e7d9f23e37'));
    }

    const user = await this.getUser(userId);
    const encrypted = this.fieldEncryptionService.encrypt(secret);
    const recoveryCodes = Array.from({ length: MFA_RECOVERY_CODES }, () =>
      createRecoveryCode(),
    );

    user.mfaEnabled = true;
    user.mfaSecret = encrypted.ciphertext;
    user.mfaKeyVersion = encrypted.keyVersion;
    user.mfaRecoveryCodes = recoveryCodes.map((value) => hashRecoveryCode(value));
    user.mfaEnrolledAt = new Date();

    await this.userRepository.save(user);
    await this.securityStore.delete(this.getSetupKey(userId));
    await this.securityAudit.log('auth.mfa.enabled', {
      userId,
      mfaAction: 'enabled',
    });

    return { recoveryCodes };
  }

  async disableMfa(
    userId: number,
    options: { code?: string; recoveryCode?: string },
  ): Promise<void> {
    const user = await this.getUser(userId);
    if (!user.mfaEnabled) {
      return;
    }

    const valid =
      (options.code ? this.verifyTotpForUser(user, options.code) : false) ||
      (options.recoveryCode
        ? this.consumeRecoveryCode(user, options.recoveryCode)
        : false);

    if (!valid) {
      throw new UnauthorizedException(bStatic('errors.auto.backend.kfa37b7d91796'));
    }

    user.mfaEnabled = false;
    user.mfaSecret = null;
    user.mfaKeyVersion = null;
    user.mfaRecoveryCodes = null;
    user.mfaEnrolledAt = null;

    await this.userRepository.save(user);
    await this.securityAudit.log('auth.mfa.disabled', {
      userId,
      mfaAction: 'disabled',
    });
  }

  async assertSecondFactor(
    user: User,
    code?: string,
    recoveryCode?: string,
  ): Promise<void> {
    if (!user.mfaEnabled) {
      return;
    }

    const hasTotp = typeof code === 'string' && code.trim().length > 0;
    const hasRecovery =
      typeof recoveryCode === 'string' && recoveryCode.trim().length > 0;
    if (!hasTotp && !hasRecovery) {
      throw new UnauthorizedException(bStatic('errors.auto.backend.k50f73ab2469a'));
    }

    let success = false;
    if (hasTotp && code) {
      success = this.verifyTotpForUser(user, code);
    }
    if (!success && hasRecovery && recoveryCode) {
      success = this.consumeRecoveryCode(user, recoveryCode);
      if (success) {
        await this.userRepository.save(user);
      }
    }

    if (!success) {
      throw new UnauthorizedException(bStatic('errors.auto.backend.k11e7d9f23e37'));
    }
  }

  private verifyTotpForUser(user: User, code: string): boolean {
    if (!user.mfaSecret) {
      return false;
    }

    const decrypted = this.fieldEncryptionService.decrypt(user.mfaSecret);
    return this.totpService.verifyCode(decrypted.plaintext, code);
  }

  private consumeRecoveryCode(user: User, recoveryCode: string): boolean {
    const existing = this.getRecoveryCodes(user);
    if (existing.length === 0) {
      return false;
    }

    const normalized = normalizeRecoveryCode(recoveryCode);
    const digest = Buffer.from(hashRecoveryCode(normalized), 'hex');

    let matchedIndex = -1;
    existing.forEach((storedHash, index) => {
      if (matchedIndex >= 0) {
        return;
      }
      const storedDigest = Buffer.from(storedHash, 'hex');
      if (
        storedDigest.length === digest.length &&
        timingSafeEqual(storedDigest, digest)
      ) {
        matchedIndex = index;
      }
    });

    if (matchedIndex < 0) {
      return false;
    }

    existing.splice(matchedIndex, 1);
    user.mfaRecoveryCodes = existing;
    return true;
  }

  private getRecoveryCodes(user: User): string[] {
    if (!Array.isArray(user.mfaRecoveryCodes)) {
      return [];
    }
    return user.mfaRecoveryCodes.filter(
      (entry): entry is string => typeof entry === 'string' && entry.length > 0,
    );
  }

  private getSetupKey(userId: number): string {
    return `mfa:setup:${userId}`;
  }

  private async getUser(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException(bStatic('errors.auto.backend.k9c986a39aaff'));
    }
    return user;
  }
}
