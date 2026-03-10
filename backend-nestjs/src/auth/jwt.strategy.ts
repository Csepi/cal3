import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import type { Request } from 'express';
import { JwtRevocationService } from './services/jwt-revocation.service';
import { TokenFingerprintService } from './services/token-fingerprint.service';
import type { AccessTokenClaims } from './token.types';

import { bStatic } from '../i18n/runtime';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private authService: AuthService,
    private readonly jwtRevocationService: JwtRevocationService,
    private readonly tokenFingerprintService: TokenFingerprintService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      passReqToCallback: true,
      secretOrKey:
        configService.get<string>('JWT_SECRET') || 'default-secret-key',
      audience: configService.get<string>('JWT_AUDIENCE') || 'cal3-users',
      issuer: configService.get<string>('JWT_ISSUER') || 'cal3-backend',
    });
  }

  async validate(req: Request, payload: AccessTokenClaims) {
    if (await this.jwtRevocationService.isRevoked(payload.jti)) {
      throw new UnauthorizedException(bStatic('errors.auto.backend.k61e6d7a773d2'));
    }

    if (payload.fph) {
      const fingerprint = this.tokenFingerprintService.extractFingerprint(req);
      if (!fingerprint) {
        throw new UnauthorizedException(bStatic('errors.auto.backend.k9764bc92306d'));
      }
      const fingerprintHash =
        this.tokenFingerprintService.hashFingerprint(fingerprint);
      if (fingerprintHash !== payload.fph) {
        throw new UnauthorizedException(bStatic('errors.auto.backend.kea6439506c54'));
      }
    }

    const userId = Number(payload.sub);
    if (!Number.isInteger(userId)) {
      throw new UnauthorizedException();
    }

    const user = await this.authService.validateUser(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return {
      ...user,
      tokenJti: payload.jti,
      sessionId: payload.sid,
    };
  }
}
