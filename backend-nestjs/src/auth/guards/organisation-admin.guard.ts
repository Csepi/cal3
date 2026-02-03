import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Request } from 'express';
import { OrganisationAdmin } from '../../entities/organisation-admin.entity';
import { User, UserRole } from '../../entities/user.entity';

/**
 * Organisation Admin Guard
 *
 * Verifies that the current user has organisation admin privileges for
 * the organisation specified in the request parameters.
 *
 * Usage:
 * @UseGuards(JwtAuthGuard, OrganisationAdminGuard)
 * @Post('organisations/:id/some-action')
 *
 * The guard will:
 * 1. Allow global admins to access every organisation
 * 2. Allow organisation admins to access only their assigned organisations
 * 3. Deny access to regular users
 */
@Injectable()
export class OrganisationAdminGuard implements CanActivate {
  constructor(
    @InjectRepository(OrganisationAdmin)
    private organisationAdminRepository: Repository<OrganisationAdmin>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: User }>();
    const user: User = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Global admins have access to all organisations
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Get organisation ID from request parameters
    const organisationId = this.getOrganisationIdFromRequest(request);
    if (!organisationId) {
      throw new ForbiddenException('Organisation ID not found in request');
    }

    // Check if user is an organisation admin for this specific organisation
    const orgAdmin = await this.organisationAdminRepository.findOne({
      where: {
        userId: user.id,
        organisationId: parseInt(organisationId, 10),
      },
    });

    if (!orgAdmin) {
      throw new ForbiddenException(
        'Insufficient permissions for this organisation',
      );
    }

    return true;
  }

  /**
   * Extract organisation ID from request parameters
   * Supports various parameter names: id, organisationId, orgId
   */
  private getOrganisationIdFromRequest(request: Request): string | null {
    const params = request.params;

    // Try different parameter names
    return params.id || params.organisationId || params.orgId || null;
  }
}
