import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganisationAdmin } from '../entities/organisation-admin.entity';
import { Organisation } from '../entities/organisation.entity';
import { User, UserRole } from '../entities/user.entity';
import { bStatic } from '../i18n/runtime';

// Temporarily removed reservation calendar imports
// import { ReservationCalendarRole, ReservationCalendarRoleType } from '../entities/reservation-calendar-role.entity';
// import { ReservationCalendar } from '../entities/reservation-calendar.entity';

/**
 * OrganisationAdminService
 *
 * Handles all organisation admin related operations including:
 * - Assigning and removing organisation admins
 * - Managing organisation users
 * - Auto-assigning editor roles to reservation calendars
 * - Enforcing business rules for organisation admin privileges
 */
@Injectable()
export class OrganisationAdminService {
  constructor(
    @InjectRepository(OrganisationAdmin)
    private organisationAdminRepository: Repository<OrganisationAdmin>,
    @InjectRepository(Organisation)
    private organisationRepository: Repository<Organisation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    // Temporarily removed reservation calendar repositories
    // @InjectRepository(ReservationCalendarRole)
    // private reservationCalendarRoleRepository: Repository<ReservationCalendarRole>,
    // @InjectRepository(ReservationCalendar)
    // private reservationCalendarRepository: Repository<ReservationCalendar>,
  ) {}

  /**
   * Assign a user as an organisation admin
   * Only global admins can perform this action
   */
  async assignOrganisationAdmin(
    organisationId: number,
    userId: number,
    assignedBy: User,
  ): Promise<OrganisationAdmin> {
    // Verify that the assigning user is a global admin
    if (assignedBy.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        bStatic('errors.auto.backend.kea571d465678'),
      );
    }

    // Verify organisation exists
    const organisation = await this.organisationRepository.findOne({
      where: { id: organisationId },
    });
    if (!organisation) {
      throw new NotFoundException(bStatic('errors.auto.backend.k4d405a7f53bf'));
    }

    // Verify user exists and is not already an org admin for this organisation
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(bStatic('errors.auto.backend.k01eb94695483'));
    }

    // Check if user is already an org admin for this organisation
    const existingAdmin = await this.organisationAdminRepository.findOne({
      where: { organisationId, userId },
    });
    if (existingAdmin) {
      throw new BadRequestException(
        bStatic('errors.auto.backend.kbb6563f8824e'),
      );
    }

    // Create organisation admin role
    const orgAdmin = this.organisationAdminRepository.create({
      organisationId,
      userId,
      assignedById: assignedBy.id,
      organisation,
      user,
      assignedBy,
    });

    const savedOrgAdmin = await this.organisationAdminRepository.save(orgAdmin);

    // TODO: Auto-assign editor role to all existing reservation calendars in this organisation
    // await this.autoAssignEditorRoleToReservationCalendars(organisationId, userId);

    return savedOrgAdmin;
  }

  /**
   * Remove a user from organisation admin role
   * Only global admins can perform this action
   */
  async removeOrganisationAdmin(
    organisationId: number,
    userId: number,
    removedBy: User,
  ): Promise<void> {
    // Verify that the removing user is a global admin
    if (removedBy.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        bStatic('errors.auto.backend.kfdd2f2d8e234'),
      );
    }

    // Find the organisation admin role
    const orgAdmin = await this.organisationAdminRepository.findOne({
      where: { organisationId, userId },
    });
    if (!orgAdmin) {
      throw new NotFoundException(bStatic('errors.auto.backend.kff65b32df65d'));
    }

    // TODO: Remove all auto-assigned reservation calendar roles for this user in this organisation
    // await this.removeAutoAssignedReservationCalendarRoles(organisationId, userId);

    // Remove the organisation admin role
    await this.organisationAdminRepository.remove(orgAdmin);
  }

  /**
   * Get all organisation admins for a specific organisation
   */
  async getOrganisationAdmins(
    organisationId: number,
  ): Promise<OrganisationAdmin[]> {
    return this.organisationAdminRepository.find({
      where: { organisationId },
      relations: ['user', 'assignedBy'],
    });
  }

  /**
   * Add a user to an organisation
   * Can be performed by global admins or organisation admins
   */
  async addUserToOrganisation(
    organisationId: number,
    userId: number,
    addedBy: User,
  ): Promise<void> {
    // Verify permission
    await this.verifyOrganisationAdminPermission(addedBy, organisationId);

    // Verify organisation exists
    const organisation = await this.organisationRepository.findOne({
      where: { id: organisationId },
      relations: ['users'],
    });
    if (!organisation) {
      throw new NotFoundException(bStatic('errors.auto.backend.k4d405a7f53bf'));
    }

    // Verify user exists
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organisations'],
    });
    if (!user) {
      throw new NotFoundException(bStatic('errors.auto.backend.k01eb94695483'));
    }

    // Check if user is already in the organisation
    const isAlreadyMember = user.organisations.some(
      (org) => org.id === organisationId,
    );
    if (isAlreadyMember) {
      throw new BadRequestException(
        bStatic('errors.auto.backend.kbc7264071c91'),
      );
    }

    // Add user to organisation
    user.organisations.push(organisation);
    await this.userRepository.save(user);
  }

  /**
   * Remove a user from an organisation
   * Can be performed by global admins or organisation admins
   */
  async removeUserFromOrganisation(
    organisationId: number,
    userId: number,
    removedBy: User,
  ): Promise<void> {
    // Verify permission
    await this.verifyOrganisationAdminPermission(removedBy, organisationId);

    // Verify user exists and is in the organisation
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organisations'],
    });
    if (!user) {
      throw new NotFoundException(bStatic('errors.auto.backend.k01eb94695483'));
    }

    const isOrgMember = user.organisations.some(
      (org) => org.id === organisationId,
    );
    if (!isOrgMember) {
      throw new BadRequestException(
        bStatic('errors.auto.backend.k9c56238d267c'),
      );
    }

    // Cannot remove if user is an organisation admin (must remove admin role first)
    const isOrgAdmin = await this.isOrganisationAdmin(userId, organisationId);
    if (isOrgAdmin) {
      throw new BadRequestException(
        bStatic('errors.auto.backend.k3d1eb39fc4c4'),
      );
    }

    // Remove user from organisation
    user.organisations = user.organisations.filter(
      (org) => org.id !== organisationId,
    );
    await this.userRepository.save(user);

    // TODO: Remove reservation calendar roles for this user in this organisation
    // await this.removeAllReservationCalendarRoles(organisationId, userId);
  }

  /**
   * Get all users in an organisation
   */
  async getOrganisationUsers(organisationId: number): Promise<User[]> {
    const organisation = await this.organisationRepository.findOne({
      where: { id: organisationId },
      relations: ['users'],
    });
    if (!organisation) {
      throw new NotFoundException(bStatic('errors.auto.backend.k4d405a7f53bf'));
    }

    return organisation.users;
  }

  /**
   * Check if a user is an organisation admin for a specific organisation
   */
  async isOrganisationAdmin(
    userId: number,
    organisationId: number,
  ): Promise<boolean> {
    const orgAdmin = await this.organisationAdminRepository.findOne({
      where: { userId, organisationId },
    });
    return !!orgAdmin;
  }

  /**
   * Get all organisations where a user is an admin
   */
  async getUserOrganisationAdminRoles(
    userId: number,
  ): Promise<OrganisationAdmin[]> {
    return this.organisationAdminRepository.find({
      where: { userId },
      relations: ['organisation'],
    });
  }

  /**
   * Verify that a user has organisation admin permission for a specific organisation
   * (Either global admin or organisation admin for this specific organisation)
   */
  private async verifyOrganisationAdminPermission(
    user: User,
    organisationId: number,
  ): Promise<void> {
    // Global admins have permission everywhere
    if (user.role === UserRole.ADMIN) {
      return;
    }

    // Check if user is organisation admin for this organisation
    const isOrgAdmin = await this.isOrganisationAdmin(user.id, organisationId);
    if (!isOrgAdmin) {
      throw new ForbiddenException(
        bStatic('errors.auto.backend.k55a553adc5c5'),
      );
    }
  }

  /**
   * Auto-assign editor role to all reservation calendars in an organisation
   * Called when a user becomes an organisation admin
   * TODO: Re-enable when reservation calendar system is integrated
   */
  /*
  private async autoAssignEditorRoleToReservationCalendars(
    organisationId: number,
    userId: number,
  ): Promise<void> {
    const reservationCalendars = await this.reservationCalendarRepository.find({
      where: { organisationId },
    });

    for (const reservationCalendar of reservationCalendars) {
      // Check if role already exists
      const existingRole = await this.reservationCalendarRoleRepository.findOne({
        where: {
          reservationCalendarId: reservationCalendar.id,
          userId,
        },
      });

      if (!existingRole) {
        const role = this.reservationCalendarRoleRepository.create({
          reservationCalendarId: reservationCalendar.id,
          userId,
          role: ReservationCalendarRoleType.EDITOR,
          isOrganisationAdmin: true, // Mark as auto-assigned
        });
        await this.reservationCalendarRoleRepository.save(role);
      }
    }
  }
  */

  /**
   * Remove auto-assigned reservation calendar roles when user is no longer org admin
   * TODO: Re-enable when reservation calendar system is integrated
   */
  /*
  private async removeAutoAssignedReservationCalendarRoles(
    organisationId: number,
    userId: number,
  ): Promise<void> {
    const reservationCalendars = await this.reservationCalendarRepository.find({
      where: { organisationId },
    });

    for (const reservationCalendar of reservationCalendars) {
      await this.reservationCalendarRoleRepository.delete({
        reservationCalendarId: reservationCalendar.id,
        userId,
        isOrganisationAdmin: true, // Only remove auto-assigned roles
      });
    }
  }

  /**
   * Remove all reservation calendar roles for a user in an organisation
   */
  /*
  private async removeAllReservationCalendarRoles(
    organisationId: number,
    userId: number,
  ): Promise<void> {
    const reservationCalendars = await this.reservationCalendarRepository.find({
      where: { organisationId },
    });

    for (const reservationCalendar of reservationCalendars) {
      await this.reservationCalendarRoleRepository.delete({
        reservationCalendarId: reservationCalendar.id,
        userId,
      });
    }
  }
  */
}
