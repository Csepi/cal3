import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { NotificationRulesService } from './notification-rules.service';
import { ListNotificationsQueryDto } from './dto/list-notifications.query';
import { UpdateNotificationPreferencesDto } from './dto/update-preferences.dto';
import { RegisterDeviceDto } from './dto/register-device.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationRulesService: NotificationRulesService,
  ) {}

  @Get()
  list(@Request() req, @Query() query: ListNotificationsQueryDto) {
    return this.notificationsService.listMessages(req.user.id, query);
  }

  @Patch(':id/read')
  markRead(@Request() req, @Param('id') id: string) {
    return this.notificationsService.markMessageRead(req.user.id, +id);
  }

  @Patch(':id/unread')
  markUnread(@Request() req, @Param('id') id: string) {
    return this.notificationsService.markMessageUnread(req.user.id, +id);
  }

  @Post('read-all')
  markAllRead(@Request() req) {
    return this.notificationsService.markAllRead(req.user.id);
  }

  @Get('preferences')
  getPreferences(@Request() req) {
    return this.notificationRulesService.getUserPreferences(req.user.id);
  }

  @Put('preferences')
  updatePreferences(
    @Request() req,
    @Body() body: UpdateNotificationPreferencesDto,
  ) {
    return this.notificationRulesService.updateUserPreferences(
      req.user.id,
      body.preferences,
    );
  }

  @Post('devices')
  registerDevice(@Request() req, @Body() body: RegisterDeviceDto) {
    return this.notificationsService.registerDevice(
      req.user.id,
      body.platform,
      body.token,
      body.userAgent,
    );
  }

  @Delete('devices/:deviceId')
  deleteDevice(@Request() req, @Param('deviceId') deviceId: string) {
    return this.notificationsService.removeDevice(req.user.id, +deviceId);
  }
}
