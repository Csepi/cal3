import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserPermissionsService } from '../common/services/user-permissions.service';
import type { RequestWithUser } from '../common/types/request-with-user';

@ApiTags('User Permissions')
@Controller('user-permissions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserPermissionsController {
  constructor(
    private readonly userPermissionsService: UserPermissionsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get current user permissions' })
  @ApiResponse({
    status: 200,
    description: 'User permissions retrieved successfully',
  })
  async getUserPermissions(@Req() req: RequestWithUser) {
    const permissions = await this.userPermissionsService.getUserPermissions(
      req.user.id,
    );

    // Convert function properties to boolean values for JSON serialization
    return {
      canAccessReservations: permissions.canAccessReservations,
      accessibleOrganizationIds: permissions.accessibleOrganizationIds,
      adminOrganizationIds: permissions.adminOrganizationIds,
      editableReservationCalendarIds:
        permissions.editableReservationCalendarIds,
      viewableReservationCalendarIds:
        permissions.viewableReservationCalendarIds,
      isSuperAdmin: this.userPermissionsService.isSuperAdmin(req.user),
    };
  }

  @Get('accessible-organizations')
  @ApiOperation({ summary: 'Get organizations accessible to current user' })
  @ApiResponse({
    status: 200,
    description: 'Accessible organizations retrieved successfully',
  })
  async getAccessibleOrganizations(@Req() req: RequestWithUser) {
    return await this.userPermissionsService.getUserAccessibleOrganizations(
      req.user.id,
    );
  }

  @Get('accessible-reservation-calendars')
  @ApiOperation({
    summary: 'Get reservation calendars accessible to current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Accessible reservation calendars retrieved successfully',
  })
  async getAccessibleReservationCalendars(@Req() req: RequestWithUser) {
    return await this.userPermissionsService.getUserAccessibleReservationCalendars(
      req.user.id,
    );
  }
}
