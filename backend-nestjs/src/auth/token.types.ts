import { UserRole } from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';

export interface AccessTokenClaims {
  sub: number;
  username: string;
  role: UserRole;
  jti: string;
  sid: string;
  fph?: string;
  scope?: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string | string[];
}

export interface TokenMetadata {
  ip?: string;
  userAgent?: string;
  fingerprint?: string;
  fingerprintHash?: string;
  replacedTokenId?: string;
  familyId?: string;
  parentTokenId?: string;
  familyExpiresAt?: Date;
}

export type RefreshValidationFailureReason =
  | 'invalid'
  | 'expired'
  | 'revoked'
  | 'reused'
  | 'fingerprint_mismatch';

export interface RefreshValidationResult {
  ok: boolean;
  token?: RefreshToken;
  reason?: RefreshValidationFailureReason;
}
