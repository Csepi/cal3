import type { RequestWithUser as RequestWithUserBase } from '../common/types/request-with-user';
import type { UserRole } from './domain.types';

/**
 * JWT payload carried by access tokens.
 */
export interface JwtPayload {
  readonly sub: number | string;
  readonly username?: string;
  readonly role?: UserRole | string;
  readonly iat?: number;
  readonly exp?: number;
  readonly iss?: string;
  readonly aud?: string;
}

/**
 * Credentials accepted by username/password login endpoints.
 */
export interface AuthCredentials {
  readonly username: string;
  readonly password: string;
}

/**
 * Request shape populated by auth guards.
 */
export type RequestWithUser = RequestWithUserBase;
