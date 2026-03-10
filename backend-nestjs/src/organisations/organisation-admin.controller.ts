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
import { AdminGuard } from '../auth/guards/admin.guard';
import { OrganisationAdminGuard } from '../auth/guards/organisation-admin.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../entities/user.entity';
import { OrganisationAdminService } from './organisation-admin.service';
import { AssignOrganisationAdminDto, AddUserToOrganisationDto } from './dto';

import { bStatic } from '../i18n/runtime';

/**
 * OrganisationAdminController
 *
 * Handles HTTP requests for organisation admin management including:
 * - Assigning and removing organisation admins (Global admin only)
 * - Adding and removing users from organisations (Org admin + Global admin)
 * - Listing organisation admins and users
 */
@Controller('organisations')
@UseGuards(JwtAuthGuard)
export class OrganisationAdminController {
  constructor(
    private readonly organisationAdminService: OrganisationAdminService,
  ) {}

  /**
   * Assign a user as organisation admin
   * Only global admins can perform this action
   */
  @Post(':id/admins')
  @UseGuards(AdminGuard)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  async assignOrganisationAdmin(
    @Param('id', ParseIntPipe) organisationId: number,
    @Body() assignAdminDto: AssignOrganisationAdminDto,
    @GetUser() user: User,
  ) {
    const orgAdmin =
      await this.organisationAdminService.assignOrganisationAdmin(
        organisationId,
        assignAdminDto.userId,
        user,
      );

    return {
      message: bStatic('errors.auto.backend.k8b032ce1343e'),
      data: orgAdmin,
    };
  }

  /**
   * Remove a user from organisation admin role
   * Only global admins can perform this action
   */
  @Delete(':id/admins/:userId')
  @UseGuards(AdminGuard)
  async removeOrganisationAdmin(
    @Param('id', ParseIntPipe) organisationId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @GetUser() user: User,
  ) {
    await this.organisationAdminService.removeOrganisationAdmin(
      organisationId,
      userId,
      user,
    );

    return {
      message: bStatic('errors.auto.backend.k19ab10bf79eb'),
    };
  }

  /**
   * Get all organisation admins for a specific organisation
   * Accessible by global admins and organisation admins
   */
  @Get(':id/admins')
  @UseGuards(OrganisationAdminGuard)
  async getOrganisationAdmins(
    @Param('id', ParseIntPipe) organisationId: number,
  ) {
    const admins =
      await this.organisationAdminService.getOrganisationAdmins(organisationId);

    return {
      message: bStatic('errors.auto.backend.kedd85645eab2'),
      data: admins,
    };
  }

  /**
   * Add a user to an organisation
   * Accessible by global admins and organisation admins
   */
  @Post(':id/users')
  @UseGuards(OrganisationAdminGuard)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  async addUserToOrganisation(
    @Param('id', ParseIntPipe) organisationId: number,
    @Body() addUserDto: AddUserToOrganisationDto,
    @GetUser() user: User,
  ) {
    await this.organisationAdminService.addUserToOrganisation(
      organisationId,
      addUserDto.userId,
      user,
    );

    return {
      message: bStatic('errors.auto.backend.k8f4fed72aa18'),
    };
  }

  /**
   * Remove a user from an organisation
   * Accessible by global admins and organisation admins
   */
  @Delete(':id/users/:userId')
  @UseGuards(OrganisationAdminGuard)
  async removeUserFromOrganisation(
    @Param('id', ParseIntPipe) organisationId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @GetUser() user: User,
  ) {
    await this.organisationAdminService.removeUserFromOrganisation(
      organisationId,
      userId,
      user,
    );

    return {
      message: bStatic('errors.auto.backend.k9d4b095fcd4d'),
    };
  }

  /**
   * Get all users in an organisation
   * Accessible by global admins and organisation admins
   */
  @Get(':id/users')
  @UseGuards(OrganisationAdminGuard)
  async getOrganisationUsers(
    @Param('id', ParseIntPipe) organisationId: number,
  ) {
    const users =
      await this.organisationAdminService.getOrganisationUsers(organisationId);

    return {
      message: bStatic('errors.auto.backend.kf0dee69a9ca2'),
      data: users,
    };
  }

  /**
   * Get all organisations where the current user is an admin
   */
  @Get('admin-roles')
  async getUserOrganisationAdminRoles(@GetUser() user: User) {
    const adminRoles =
      await this.organisationAdminService.getUserOrganisationAdminRoles(
        user.id,
      );

    return {
      message: bStatic('errors.auto.backend.k6d2b5d4462e1'),
      data: adminRoles,
    };
  }

  /**
   * Check if the current user is an admin for a specific organisation
   */
  @Get(':id/admin-status')
  async checkOrganisationAdminStatus(
    @Param('id', ParseIntPipe) organisationId: number,
    @GetUser() user: User,
  ) {
    const isAdmin = await this.organisationAdminService.isOrganisationAdmin(
      user.id,
      organisationId,
    );

    return {
      message: bStatic('errors.auto.backend.kafdf4ca7d587'),
      data: { isAdmin },
    };
  }
}
