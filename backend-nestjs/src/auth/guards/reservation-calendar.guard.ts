import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ReservationCalendarRole,
  ReservationCalendarRoleType,
} from '../../entities/reservation-calendar-role.entity';
import { ReservationCalendar } from '../../entities/reservation-calendar.entity';
import { OrganisationAdmin } from '../../entities/organisation-admin.entity';
import { User, UserRole } from '../../entities/user.entity';

// Metadata key for required roles
export const RESERVATION_CALENDAR_ROLES_KEY = 'reservationCalendarRoles';

// Decorator to specify required roles
export const RequireReservationCalendarRole = (
  ...roles: ReservationCalendarRoleType[]
) => SetMetadata(RESERVATION_CALENDAR_ROLES_KEY, roles);

/**
 * Reservation Calendar Guard
 *
 * Verifies that the current user has the required role for the specified
 * reservation calendar. Supports checking for specific roles (editor/reviewer)
 * or every role if none is specified.
 *
 * Usage:
 * @UseGuards(JwtAuthGuard, ReservationCalendarGuard)
 * @RequireReservationCalendarRole(ReservationCalendarRoleType.EDITOR)
 * @Post('reservation-calendars/:id/reservations')
 *
 * The guard will:
 * 1. Allow global admins to access every reservation calendar
 * 2. Allow organisation admins to access reservation calendars in their organisations
 * 3. Allow users with appropriate roles to access specific reservation calendars
 * 4. Deny access to users without proper roles
 */
@Injectable()
export class ReservationCalendarGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(ReservationCalendarRole)
    private reservationCalendarRoleRepository: Repository<ReservationCalendarRole>,
    @InjectRepository(ReservationCalendar)
    private reservationCalendarRepository: Repository<ReservationCalendar>,
    @InjectRepository(OrganisationAdmin)
    private organisationAdminRepository: Repository<OrganisationAdmin>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Global admins have access to all reservation calendars
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Get reservation calendar ID from request parameters
    const reservationCalendarId =
      this.getReservationCalendarIdFromRequest(request);
    if (!reservationCalendarId) {
      throw new ForbiddenException(
        'Reservation calendar ID not found in request',
      );
    }

    // Get the reservation calendar to check organisation
    const reservationCalendar =
      await this.reservationCalendarRepository.findOne({
        where: { id: parseInt(reservationCalendarId, 10) },
      });

    if (!reservationCalendar) {
      throw new ForbiddenException('Reservation calendar not found');
    }

    // Check if user is organisation admin for this reservation calendar's organisation
    const isOrgAdmin = await this.organisationAdminRepository.findOne({
      where: {
        userId: user.id,
        organisationId: reservationCalendar.organisationId,
      },
    });

    if (isOrgAdmin) {
      return true; // Organisation admins have full access
    }

    // Get required roles from metadata
    const requiredRoles = this.reflector.getAllAndOverride<
      ReservationCalendarRoleType[]
    >(RESERVATION_CALENDAR_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Check user's role for this reservation calendar
    const userRole = await this.reservationCalendarRoleRepository.findOne({
      where: {
        userId: user.id,
        reservationCalendarId: parseInt(reservationCalendarId, 10),
      },
    });

    if (!userRole) {
      throw new ForbiddenException('No access to this reservation calendar');
    }

    // If specific roles are required, check if user has one of them
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.includes(userRole.role);
      if (!hasRequiredRole) {
        throw new ForbiddenException(
          `Required role: ${requiredRoles.join(' or ')}, User has: ${userRole.role}`,
        );
      }
    }

    // If no specific roles required, a role is sufficient
    return true;
  }

  /**
   * Extract reservation calendar ID from request parameters
   * Supports various parameter names: id, reservationCalendarId, calendarId
   */
  private getReservationCalendarIdFromRequest(request: any): string | null {
    const params = request.params;

    // Try different parameter names
    return (
      params.id || params.reservationCalendarId || params.calendarId || null
    );
  }
}
