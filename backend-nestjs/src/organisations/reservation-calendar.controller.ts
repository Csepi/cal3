import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganisationAdminGuard } from '../auth/guards/organisation-admin.guard';
import {
  ReservationCalendarGuard,
  RequireReservationCalendarRole,
} from '../auth/guards/reservation-calendar.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../entities/user.entity';
import { ReservationCalendarRoleType } from '../entities/reservation-calendar-role.entity';
import { ReservationCalendarService } from './reservation-calendar.service';
import { CreateReservationCalendarDto, AssignRoleDto } from './dto';

/**
 * ReservationCalendarController
 *
 * Handles HTTP requests for reservation calendar management including:
 * - Creating reservation calendars (Org admin + Global admin)
 * - Managing user roles for reservation calendars (Org admin + Global admin)
 * - Retrieving user's accessible reservation calendars
 * - Managing calendar roles and permissions
 */
@Controller()
@UseGuards(JwtAuthGuard)
export class ReservationCalendarController {
  constructor(
    private readonly reservationCalendarService: ReservationCalendarService,
  ) {}

  /**
   * Create a new reservation calendar for an organisation
   * Accessible by global admins and organisation admins
   */
  @Post('organisations/:id/reservation-calendars')
  @UseGuards(OrganisationAdminGuard)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  async createReservationCalendar(
    @Param('id', ParseIntPipe) organisationId: number,
    @Body() createDto: CreateReservationCalendarDto,
    @GetUser() user: User,
  ) {
    const reservationCalendar =
      await this.reservationCalendarService.createReservationCalendar(
        organisationId,
        createDto,
        user,
      );

    return {
      message: 'Reservation calendar created successfully',
      data: reservationCalendar,
    };
  }

  /**
   * Get all reservation calendars for an organisation
   * Accessible by global admins and organisation admins
   */
  @Get('organisations/:id/reservation-calendars')
  @UseGuards(OrganisationAdminGuard)
  async getOrganisationReservationCalendars(
    @Param('id', ParseIntPipe) organisationId: number,
  ) {
    const calendars =
      await this.reservationCalendarService.getOrganisationReservationCalendars(
        organisationId,
      );

    return {
      message: 'Organisation reservation calendars retrieved successfully',
      data: calendars,
    };
  }

  /**
   * Assign a role to a user for a reservation calendar
   * Accessible by global admins and organisation admins
   */
  @Post('reservation-calendars/:id/roles')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  async assignCalendarRole(
    @Param('id', ParseIntPipe) reservationCalendarId: number,
    @Body() assignRoleDto: AssignRoleDto,
    @GetUser() user: User,
  ) {
    const role = await this.reservationCalendarService.assignCalendarRole(
      reservationCalendarId,
      assignRoleDto,
      user,
    );

    return {
      message: 'Calendar role assigned successfully',
      data: role,
    };
  }

  /**
   * Remove a role from a user for a reservation calendar
   * Accessible by global admins and organisation admins
   */
  @Delete('reservation-calendars/:id/roles/:userId')
  async removeCalendarRole(
    @Param('id', ParseIntPipe) reservationCalendarId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @GetUser() user: User,
  ) {
    await this.reservationCalendarService.removeCalendarRole(
      reservationCalendarId,
      userId,
      user,
    );

    return {
      message: 'Calendar role removed successfully',
    };
  }

  /**
   * Get all roles for a specific reservation calendar
   * Accessible by users with any role on the calendar, org admins, and global admins
   */
  @Get('reservation-calendars/:id/roles')
  @UseGuards(ReservationCalendarGuard)
  async getCalendarRoles(
    @Param('id', ParseIntPipe) reservationCalendarId: number,
  ) {
    const roles = await this.reservationCalendarService.getCalendarRoles(
      reservationCalendarId,
    );

    return {
      message: 'Calendar roles retrieved successfully',
      data: roles,
    };
  }

  /**
   * Get all reservation calendars that the current user has access to
   */
  @Get('users/reservation-calendars')
  async getUserReservationCalendars(@GetUser() user: User) {
    const calendars =
      await this.reservationCalendarService.getUserReservationCalendars(
        user.id,
      );

    return {
      message: 'User reservation calendars retrieved successfully',
      data: calendars,
    };
  }

  /**
   * Get user's role for a specific reservation calendar
   * Accessible by the user themselves, org admins, and global admins
   */
  @Get('reservation-calendars/:id/my-role')
  @UseGuards(ReservationCalendarGuard)
  async getUserCalendarRole(
    @Param('id', ParseIntPipe) reservationCalendarId: number,
    @GetUser() user: User,
  ) {
    const role = await this.reservationCalendarService.getUserCalendarRole(
      user.id,
      reservationCalendarId,
    );

    return {
      message: 'User calendar role retrieved successfully',
      data: role,
    };
  }

  /**
   * Check if user has a specific role for a reservation calendar
   * Accessible by the user themselves, org admins, and global admins
   */
  @Get('reservation-calendars/:id/has-role/:role')
  @UseGuards(ReservationCalendarGuard)
  async hasCalendarRole(
    @Param('id', ParseIntPipe) reservationCalendarId: number,
    @Param('role') role: ReservationCalendarRoleType,
    @GetUser() user: User,
  ) {
    const hasRole = await this.reservationCalendarService.hasCalendarRole(
      user.id,
      reservationCalendarId,
      role,
    );

    return {
      message: 'Role check completed successfully',
      data: { hasRole },
    };
  }

  /**
   * Example endpoint requiring editor role
   * This demonstrates how to use role-based authorization
   */
  @Post('reservation-calendars/:id/reservations')
  @UseGuards(ReservationCalendarGuard)
  @RequireReservationCalendarRole(ReservationCalendarRoleType.EDITOR)
  async createReservation(
    @Param('id', ParseIntPipe) reservationCalendarId: number,
    @Body() reservationData: any, // Replace with proper DTO
    @GetUser() user: User,
  ) {
    // This endpoint would create a reservation
    // Only users with editor role can access this

    return {
      message: 'Reservation creation endpoint - editors only',
      data: { reservationCalendarId, userId: user.id },
    };
  }

  /**
   * Example endpoint accessible by both editors and reviewers
   */
  @Get('reservation-calendars/:id/reservations')
  @UseGuards(ReservationCalendarGuard)
  @RequireReservationCalendarRole(
    ReservationCalendarRoleType.EDITOR,
    ReservationCalendarRoleType.REVIEWER,
  )
  async getReservations(
    @Param('id', ParseIntPipe) reservationCalendarId: number,
    @GetUser() user: User,
  ) {
    // This endpoint would return reservations
    // Both editors and reviewers can access this

    return {
      message: 'Reservations retrieved successfully',
      data: { reservationCalendarId, userRole: 'editor or reviewer' },
    };
  }

  /**
   * Example endpoint for reviewing/approving reservations
   * Accessible by both editors and reviewers
   */
  @Post('reservation-calendars/:id/reservations/:reservationId/approve')
  @UseGuards(ReservationCalendarGuard)
  @RequireReservationCalendarRole(
    ReservationCalendarRoleType.EDITOR,
    ReservationCalendarRoleType.REVIEWER,
  )
  async approveReservation(
    @Param('id', ParseIntPipe) reservationCalendarId: number,
    @Param('reservationId', ParseIntPipe) reservationId: number,
    @GetUser() user: User,
  ) {
    // This endpoint would approve a reservation
    // Both editors and reviewers can approve reservations

    return {
      message: 'Reservation approval endpoint',
      data: { reservationCalendarId, reservationId, approvedBy: user.id },
    };
  }
}
