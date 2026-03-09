import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes, randomUUID, createHash } from 'crypto';
import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { RefreshTokenFamilyService } from './services/refresh-token-family.service';
import type { TokenMetadata } from './token.types';

export interface TokenIssueResult {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
  refreshExpiresAt: Date;
  jti: string;
  sessionId: string;
  refreshTokenId: string;
}

export interface WidgetTokenIssueResult {
  widgetToken: string;
  widgetExpiresIn: number;
  widgetExpiresAt: Date;
}

@Injectable()
export class TokenService {
  private readonly accessTtlSeconds = parseInt(
    process.env.JWT_ACCESS_TTL ?? '900',
    10,
  );
  private readonly refreshSlidingTtlSeconds = parseInt(
    process.env.JWT_REFRESH_SLIDING_TTL ?? process.env.JWT_REFRESH_TTL ?? '1209600',
    10,
  );
  private readonly refreshAbsoluteTtlSeconds = parseInt(
    process.env.JWT_REFRESH_ABSOLUTE_TTL ?? '2592000',
    10,
  ); // 30 days default
  private readonly widgetTtlSeconds = parseInt(
    process.env.JWT_WIDGET_TTL ?? '86400',
    10,
  ); // 24 hours default
  private readonly issuer = process.env.JWT_ISSUER ?? 'cal3-backend';
  private readonly audience = process.env.JWT_AUDIENCE ?? 'cal3-users';

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private readonly refreshRepository: Repository<RefreshToken>,
    private readonly refreshTokenFamilyService: RefreshTokenFamilyService,
  ) {}

  async issueTokens(
    user: User,
    metadata: TokenMetadata = {},
  ): Promise<TokenIssueResult> {
    const sessionId = metadata.familyId ?? randomUUID();
    const jti = randomUUID();
    const accessClaims = {
      sub: user.id,
      username: user.username,
      role: user.role,
      jti,
      sid: sessionId,
      ...(metadata.fingerprintHash ? { fph: metadata.fingerprintHash } : {}),
    };
    const accessToken = await this.jwtService.signAsync(
      accessClaims,
      {
        expiresIn: `${this.accessTtlSeconds}s`,
        issuer: this.issuer,
        audience: this.audience,
      },
    );

    const refreshTokenValue = this.createRefreshToken();
    const familyExpiry = this.resolveFamilyExpiration(metadata);
    const refreshExpiry = this.resolveRefreshExpiration(familyExpiry);
    const refreshTokenEntity = this.refreshRepository.create({
      userId: user.id,
      user,
      jti: randomUUID(),
      tokenHash: this.hashToken(refreshTokenValue),
      familyId: sessionId,
      parentTokenId: metadata.parentTokenId ?? null,
      fingerprintHash: metadata.fingerprintHash ?? null,
      expiresAt: refreshExpiry,
      familyExpiresAt: familyExpiry,
      ipAddress: metadata.ip,
      userAgent: metadata.userAgent,
      consumedAt: null,
      lastUsedAt: new Date(),
      replacedByTokenId: null,
    });

    const savedToken = await this.refreshRepository.save(refreshTokenEntity);

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      accessExpiresIn: this.accessTtlSeconds,
      refreshExpiresAt: savedToken.expiresAt,
      jti,
      sessionId,
      refreshTokenId: savedToken.id,
    };
  }

  async rotateRefreshToken(
    token: string,
    metadata: TokenMetadata = {},
  ): Promise<{ user: User } & TokenIssueResult> {
    const validation = await this.refreshTokenFamilyService.validateForRotation(
      this.hashToken(token),
      metadata.fingerprintHash,
    );
    this.refreshTokenFamilyService.assertValidRotation(validation);

    const currentToken = validation.token;
    const result = await this.issueTokens(currentToken.user, {
      ...metadata,
      familyId: currentToken.familyId,
      parentTokenId: currentToken.id,
      familyExpiresAt: currentToken.familyExpiresAt,
    });
    await this.refreshTokenFamilyService.markTokenRotated(
      currentToken.id,
      result.refreshTokenId,
    );

    return { user: currentToken.user, ...result };
  }

  async revokeToken(token: string | null, reason = 'logout'): Promise<void> {
    if (!token) {
      return;
    }
    const hash = this.hashToken(token);
    const existing = await this.refreshRepository.findOne({
      where: { tokenHash: hash },
    });
    if (!existing) {
      return;
    }
    existing.revoked = true;
    existing.revokedAt = new Date();
    existing.revocationReason = reason;
    await this.refreshRepository.save(existing);
  }

  async revokeAllForUser(userId: number, reason = 'logout'): Promise<void> {
    await this.refreshTokenFamilyService.revokeUserFamilies(userId, reason);
  }

  async revokeTokenFamily(familyId: string, reason = 'security_event'): Promise<void> {
    await this.refreshTokenFamilyService.revokeFamily(familyId, reason);
  }

  async issueWidgetToken(user: User): Promise<WidgetTokenIssueResult> {
    const jti = randomUUID();
    const widgetToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
        scope: 'widget',
        jti,
      },
      {
        expiresIn: `${this.widgetTtlSeconds}s`,
        issuer: this.issuer,
        audience: this.audience,
      },
    );
    const widgetExpiresAt = new Date(Date.now() + this.widgetTtlSeconds * 1000);

    return {
      widgetToken,
      widgetExpiresIn: this.widgetTtlSeconds,
      widgetExpiresAt,
    };
  }

  private createRefreshToken(): string {
    return randomBytes(64).toString('base64url');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private resolveFamilyExpiration(metadata: TokenMetadata): Date {
    if (metadata.familyExpiresAt) {
      return metadata.familyExpiresAt;
    }
    return new Date(Date.now() + this.refreshAbsoluteTtlSeconds * 1000);
  }

  private resolveRefreshExpiration(familyExpiresAt: Date): Date {
    const slidingExpiry = new Date(
      Date.now() + this.refreshSlidingTtlSeconds * 1000,
    );
    return slidingExpiry.getTime() <= familyExpiresAt.getTime()
      ? slidingExpiry
      : familyExpiresAt;
  }
}
