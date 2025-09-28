import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReservationCalendar } from '../entities/reservation-calendar.entity';
import { ReservationCalendarRole, ReservationCalendarRoleType } from '../entities/reservation-calendar-role.entity';
import { Calendar, CalendarVisibility } from '../entities/calendar.entity';
import { Organisation } from '../entities/organisation.entity';
import { User, UserRole } from '../entities/user.entity';
import { OrganisationAdminService } from './organisation-admin.service';
import { CreateReservationCalendarDto, AssignRoleDto } from './dto';

/**
 * ReservationCalendarService
 *
 * Handles all reservation calendar related operations including:
 * - Creating and managing reservation calendars
 * - Assigning and managing user roles (editor/reviewer)
 * - Enforcing organisation-specific access control
 * - Auto-managing roles for organisation admins
 */
@Injectable()
export class ReservationCalendarService {
  constructor(
    @InjectRepository(ReservationCalendar)
    private reservationCalendarRepository: Repository<ReservationCalendar>,
    @InjectRepository(ReservationCalendarRole)
    private reservationCalendarRoleRepository: Repository<ReservationCalendarRole>,
    @InjectRepository(Calendar)
    private calendarRepository: Repository<Calendar>,
    @InjectRepository(Organisation)
    private organisationRepository: Repository<Organisation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private organisationAdminService: OrganisationAdminService,
  ) {}

  /**
   * Create a new reservation calendar
   * Can be performed by global admins or organisation admins
   */
  async createReservationCalendar(
    organisationId: number,
    createDto: CreateReservationCalendarDto,
    createdBy: User,
  ): Promise<ReservationCalendar> {
    // Verify permission
    await this.verifyOrganisationAdminPermission(createdBy, organisationId);

    // Verify organisation exists
    const organisation = await this.organisationRepository.findOne({
      where: { id: organisationId },
    });
    if (!organisation) {
      throw new NotFoundException('Organisation not found');
    }

    // Create the base calendar first
    const calendar = this.calendarRepository.create({
      name: createDto.name,
      description: createDto.description || '',
      color: createDto.color || '#3b82f6',
      visibility: CalendarVisibility.PRIVATE,
      isReservationCalendar: true,
      organisationId,
      owner: createdBy,
      ownerId: createdBy.id,
    });

    const savedCalendar = await this.calendarRepository.save(calendar);

    // Create the reservation calendar configuration
    const reservationCalendar = this.reservationCalendarRepository.create({
      calendarId: savedCalendar.id,
      organisationId,
      createdById: createdBy.id,
      reservationRules: createDto.reservationRules ? JSON.stringify(createDto.reservationRules) : undefined,
      calendar: savedCalendar,
      organisation,
      createdBy,
    });

    const savedReservationCalendar = await this.reservationCalendarRepository.save(reservationCalendar);

    // Assign roles to specified users
    if (createDto.editorUserIds && createDto.editorUserIds.length > 0) {
      await this.assignMultipleRoles(
        savedReservationCalendar.id,
        createDto.editorUserIds,
        ReservationCalendarRoleType.EDITOR,
        createdBy,
      );
    }

    if (createDto.reviewerUserIds && createDto.reviewerUserIds.length > 0) {
      await this.assignMultipleRoles(
        savedReservationCalendar.id,
        createDto.reviewerUserIds,
        ReservationCalendarRoleType.REVIEWER,
        createdBy,
      );
    }

    // Auto-assign editor role to all organisation admins
    await this.autoAssignOrganisationAdmins(organisationId, savedReservationCalendar.id);

    return savedReservationCalendar;
  }

  /**
   * Assign a role to a user for a reservation calendar
   */
  async assignCalendarRole(
    reservationCalendarId: number,
    assignRoleDto: AssignRoleDto,
    assignedBy: User,
  ): Promise<ReservationCalendarRole> {
    // Get reservation calendar with organisation info
    const reservationCalendar = await this.reservationCalendarRepository.findOne({
      where: { id: reservationCalendarId },
      relations: ['organisation'],
    });
    if (!reservationCalendar) {
      throw new NotFoundException('Reservation calendar not found');
    }

    // Verify permission
    await this.verifyOrganisationAdminPermission(assignedBy, reservationCalendar.organisationId);

    // Verify user exists and is in the organisation
    const user = await this.userRepository.findOne({
      where: { id: assignRoleDto.userId },
      relations: ['organisations'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isOrgMember = user.organisations.some(org => org.id === reservationCalendar.organisationId);
    if (!isOrgMember) {
      throw new BadRequestException('User must be a member of the organisation');
    }

    // Check if role already exists
    const existingRole = await this.reservationCalendarRoleRepository.findOne({
      where: {
        reservationCalendarId,
        userId: assignRoleDto.userId,
      },
    });

    if (existingRole) {
      // Update existing role
      existingRole.role = assignRoleDto.role;
      existingRole.assignedById = assignedBy.id;
      return this.reservationCalendarRoleRepository.save(existingRole);
    } else {
      // Create new role
      const role = this.reservationCalendarRoleRepository.create({
        reservationCalendarId,
        userId: assignRoleDto.userId,
        role: assignRoleDto.role,
        assignedById: assignedBy.id,
        isOrganisationAdmin: false, // Manually assigned role
        reservationCalendar,
        user,
        assignedBy,
      });
      return this.reservationCalendarRoleRepository.save(role);
    }
  }

  /**
   * Remove a role from a user for a reservation calendar
   */
  async removeCalendarRole(
    reservationCalendarId: number,
    userId: number,
    removedBy: User,
  ): Promise<void> {
    // Get reservation calendar with organisation info
    const reservationCalendar = await this.reservationCalendarRepository.findOne({
      where: { id: reservationCalendarId },
      relations: ['organisation'],
    });
    if (!reservationCalendar) {
      throw new NotFoundException('Reservation calendar not found');
    }

    // Verify permission
    await this.verifyOrganisationAdminPermission(removedBy, reservationCalendar.organisationId);

    // Find the role
    const role = await this.reservationCalendarRoleRepository.findOne({
      where: {
        reservationCalendarId,
        userId,
      },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Cannot remove auto-assigned organisation admin roles
    if (role.isOrganisationAdmin) {
      throw new BadRequestException('Cannot remove auto-assigned organisation admin role');
    }

    await this.reservationCalendarRoleRepository.remove(role);
  }

  /**
   * Get all reservation calendars that a user has access to
   */
  async getUserReservationCalendars(userId: number): Promise<ReservationCalendar[]> {
    const roles = await this.reservationCalendarRoleRepository.find({
      where: { userId },
      relations: ['reservationCalendar', 'reservationCalendar.calendar', 'reservationCalendar.organisation'],
    });

    return roles.map(role => role.reservationCalendar);
  }

  /**
   * Get all roles for a specific reservation calendar
   */
  async getCalendarRoles(reservationCalendarId: number): Promise<ReservationCalendarRole[]> {
    return this.reservationCalendarRoleRepository.find({
      where: { reservationCalendarId },
      relations: ['user', 'assignedBy'],
    });
  }

  /**
   * Get all reservation calendars for an organisation
   */
  async getOrganisationReservationCalendars(organisationId: number): Promise<ReservationCalendar[]> {
    return this.reservationCalendarRepository.find({
      where: { organisationId },
      relations: ['calendar', 'createdBy'],
    });
  }

  /**
   * Check if a user has a specific role for a reservation calendar
   */
  async hasCalendarRole(
    userId: number,
    reservationCalendarId: number,
    role?: ReservationCalendarRoleType,
  ): Promise<boolean> {
    const userRole = await this.reservationCalendarRoleRepository.findOne({
      where: {
        userId,
        reservationCalendarId,
        ...(role && { role }),
      },
    });
    return !!userRole;
  }

  /**
   * Get user's role for a specific reservation calendar
   */
  async getUserCalendarRole(
    userId: number,
    reservationCalendarId: number,
  ): Promise<ReservationCalendarRole | null> {
    return this.reservationCalendarRoleRepository.findOne({
      where: { userId, reservationCalendarId },
      relations: ['user', 'reservationCalendar'],
    });
  }

  /**
   * Auto-assign editor role to a new reservation calendar for all organisation admins
   */
  async autoAssignOrganisationAdmins(
    organisationId: number,
    reservationCalendarId: number,
  ): Promise<void> {
    const orgAdmins = await this.organisationAdminService.getOrganisationAdmins(organisationId);

    for (const orgAdmin of orgAdmins) {
      // Check if role already exists
      const existingRole = await this.reservationCalendarRoleRepository.findOne({
        where: {
          reservationCalendarId,
          userId: orgAdmin.userId,
        },
      });

      if (!existingRole) {
        const role = this.reservationCalendarRoleRepository.create({
          reservationCalendarId,
          userId: orgAdmin.userId,
          role: ReservationCalendarRoleType.EDITOR,
          isOrganisationAdmin: true, // Mark as auto-assigned
        });
        await this.reservationCalendarRoleRepository.save(role);
      }
    }
  }

  /**
   * Assign multiple roles at once
   */
  private async assignMultipleRoles(
    reservationCalendarId: number,
    userIds: number[],
    role: ReservationCalendarRoleType,
    assignedBy: User,
  ): Promise<void> {
    for (const userId of userIds) {
      try {
        await this.assignCalendarRole(
          reservationCalendarId,
          { userId, role },
          assignedBy,
        );
      } catch (error) {
        // Log error but continue with other assignments
        console.warn(`Failed to assign role to user ${userId}:`, error.message);
      }
    }
  }

  /**
   * Verify that a user has organisation admin permission for a specific organisation
   */
  private async verifyOrganisationAdminPermission(user: User, organisationId: number): Promise<void> {
    // Global admins have permission everywhere
    if (user.role === UserRole.ADMIN) {
      return;
    }

    // Check if user is organisation admin for this organisation
    const isOrgAdmin = await this.organisationAdminService.isOrganisationAdmin(user.id, organisationId);
    if (!isOrgAdmin) {
      throw new ForbiddenException('Insufficient permissions for this organisation');
    }
  }
}