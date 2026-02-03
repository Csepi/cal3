import { Request } from 'express';
import { User } from '../../entities/user.entity';

/**
 * Express request shape after auth guards populate `request.user`.
 */
export interface RequestWithUser extends Request {
  user: User & {
    userId?: number;
    organisationId?: number;
  };
}
