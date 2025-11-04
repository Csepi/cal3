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
import {
  NotificationRulesService,
  NotificationScopeMap,
} from './notification-rules.service';
import { ListNotificationsQueryDto } from './dto/list-notifications.query';
import { UpdateNotificationPreferencesDto } from './dto/update-preferences.dto';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { InboxRuleDto, UpdateInboxRulesDto } from './dto/inbox-rule.dto';

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
    return this.notificationsService
      .markMessageRead(req.user.id, +id)
      .then(() => ({ success: true }));
  }

  @Patch(':id/unread')
  markUnread(@Request() req, @Param('id') id: string) {
    return this.notificationsService
      .markMessageUnread(req.user.id, +id)
      .then(() => ({ success: true }));
  }

  @Post('read-all')
  markAllRead(@Request() req) {
    return this.notificationsService
      .markAllRead(req.user.id)
      .then(() => ({ success: true }));
  }

  @Get('catalog')
  getCatalog(@Request() req) {
    return this.notificationsService.getCatalog(req.user.id);
  }

  @Get('scopes')
  getScopeCatalog(
    @Request() req,
    @Query('type') type?: string,
  ): Promise<NotificationScopeMap> {
    const scopes = type
      ? type
          .split(',')
          .map((value) => value.trim())
          .filter((value) => value.length > 0)
      : undefined;
    return this.notificationRulesService.getNotificationScopeOptions(
      req.user.id,
      scopes,
    );
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
    return this.notificationsService
      .removeDevice(req.user.id, +deviceId)
      .then(() => ({ success: true }));
  }

  @Get('filters')
  getFilters(@Request() req) {
    return this.notificationRulesService.getUserInboxRules(req.user.id);
  }

  @Post('filters')
  saveFilter(@Request() req, @Body() filter: InboxRuleDto) {
    return this.notificationRulesService.upsertRule(req.user.id, filter);
  }

  @Patch('filters')
  reorderFilters(@Request() req, @Body() payload: UpdateInboxRulesDto) {
    return this.notificationRulesService.reorderRules(
      req.user.id,
      payload.rules,
    );
  }

  @Delete('filters/:id')
  removeFilter(@Request() req, @Param('id') id: string) {
    return this.notificationRulesService.deleteRule(req.user.id, +id);
  }

  /**
   * Temporary compatibility routes for legacy clients still using the
   * former "rules" terminology.
   */
  @Get('rules')
  getRules(@Request() req) {
    return this.notificationRulesService.getUserInboxRules(req.user.id);
  }

  @Post('rules')
  saveRule(@Request() req, @Body() payload: InboxRuleDto) {
    return this.notificationRulesService.upsertRule(req.user.id, payload);
  }

  @Patch('rules')
  reorderRulesAlias(@Request() req, @Body() payload: UpdateInboxRulesDto) {
    return this.notificationRulesService.reorderRules(
      req.user.id,
      payload.rules,
    );
  }

  @Delete('rules/:id')
  removeRule(@Request() req, @Param('id') id: string) {
    return this.notificationRulesService.deleteRule(req.user.id, +id);
  }
}
