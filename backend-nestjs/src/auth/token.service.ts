import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes, randomUUID, createHash } from 'crypto';
import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';

export interface TokenIssueResult {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
  refreshExpiresAt: Date;
  jti: string;
}

export interface WidgetTokenIssueResult {
  widgetToken: string;
  widgetExpiresIn: number;
  widgetExpiresAt: Date;
}

export interface TokenMetadata {
  ip?: string;
  userAgent?: string;
  replacedTokenId?: string;
}

@Injectable()
export class TokenService {
  private readonly accessTtlSeconds = parseInt(
    process.env.JWT_ACCESS_TTL ?? '900',
    10,
  );
  private readonly refreshTtlSeconds = parseInt(
    process.env.JWT_REFRESH_TTL ?? '1209600',
    10,
  ); // 14 days default
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
  ) {}

  async issueTokens(
    user: User,
    metadata: TokenMetadata = {},
  ): Promise<TokenIssueResult> {
    const jti = randomUUID();
    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
        jti,
      },
      {
        expiresIn: `${this.accessTtlSeconds}s`,
        issuer: this.issuer,
        audience: this.audience,
      },
    );

    const refreshTokenValue = this.createRefreshToken();
    const refreshTokenEntity = this.refreshRepository.create({
      userId: user.id,
      user,
      jti: randomUUID(),
      tokenHash: this.hashToken(refreshTokenValue),
      expiresAt: new Date(Date.now() + this.refreshTtlSeconds * 1000),
      ipAddress: metadata.ip,
      userAgent: metadata.userAgent,
      replacedByTokenId: null,
    });

    const savedToken = await this.refreshRepository.save(refreshTokenEntity);

    if (metadata.replacedTokenId) {
      await this.refreshRepository.update(metadata.replacedTokenId, {
        replacedByTokenId: savedToken.id,
        revoked: true,
        revokedAt: new Date(),
        revocationReason: 'rotated',
      });
    }

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      accessExpiresIn: this.accessTtlSeconds,
      refreshExpiresAt: savedToken.expiresAt,
      jti,
    };
  }

  async rotateRefreshToken(
    token: string,
    metadata: TokenMetadata = {},
  ): Promise<{ user: User } & TokenIssueResult> {
    const existing = await this.refreshRepository.findOne({
      where: { tokenHash: this.hashToken(token) },
      relations: ['user'],
    });

    if (
      !existing ||
      existing.revoked ||
      existing.expiresAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const result = await this.issueTokens(existing.user, {
      ...metadata,
      replacedTokenId: existing.id,
    });

    return { user: existing.user, ...result };
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
    await this.refreshRepository.update(
      { userId },
      {
        revoked: true,
        revokedAt: new Date(),
        revocationReason: reason,
      },
    );
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
}
