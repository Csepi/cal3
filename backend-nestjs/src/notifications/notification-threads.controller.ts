import {
  Controller,
  Get,
  Param,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationThreadsService } from './notification-threads.service';

@Controller('notifications/threads')
@UseGuards(JwtAuthGuard)
export class NotificationThreadsController {
  constructor(
    private readonly notificationThreadsService: NotificationThreadsService,
  ) {}

  @Get()
  list(@Request() req) {
    return this.notificationThreadsService.listThreads(req.user.id);
  }

  @Patch(':id/mute')
  mute(@Request() req, @Param('id') id: string) {
    return this.notificationThreadsService
      .setThreadMuted(req.user.id, +id, true)
      .then(() => ({ success: true }));
  }

  @Patch(':id/unmute')
  unmute(@Request() req, @Param('id') id: string) {
    return this.notificationThreadsService
      .setThreadMuted(req.user.id, +id, false)
      .then(() => ({ success: true }));
  }

  @Patch(':id/archive')
  archive(@Request() req, @Param('id') id: string) {
    return this.notificationThreadsService
      .setThreadArchived(req.user.id, +id, true)
      .then(() => ({ success: true }));
  }

  @Patch(':id/unarchive')
  unarchive(@Request() req, @Param('id') id: string) {
    return this.notificationThreadsService
      .setThreadArchived(req.user.id, +id, false)
      .then(() => ({ success: true }));
  }
}
