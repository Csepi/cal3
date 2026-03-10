import { Request } from 'express';
import { User } from '../../entities/user.entity';
import type { ApiKeyAuthContext } from '../../api-security/types';

/**
 * Express request shape after auth guards populate `request.user`.
 */
export interface RequestWithUser extends Request {
  user: User & {
    userId?: number;
    organisationId?: number;
    tokenJti?: string;
    sessionId?: string;
  };
  apiKey?: ApiKeyAuthContext;
}
