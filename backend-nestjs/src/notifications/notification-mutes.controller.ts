import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationRulesService } from './notification-rules.service';
import { ScopeMuteDto } from './dto/scope-mute.dto';

@Controller('notifications/mutes')
@UseGuards(JwtAuthGuard)
export class NotificationMutesController {
  constructor(
    private readonly notificationRulesService: NotificationRulesService,
  ) {}

  @Get()
  list(@Request() req) {
    return this.notificationRulesService.getScopeMutes(req.user.id);
  }

  @Post()
  async upsert(@Request() req, @Body() payload: ScopeMuteDto) {
    if (payload.isMuted) {
      const mute = await this.notificationRulesService.setScopeMute(
        req.user.id,
        payload.scopeType,
        payload.scopeId,
        true,
      );
      return { success: true, mute };
    }

    await this.notificationRulesService.removeScopeMute(
      req.user.id,
      payload.scopeType,
      payload.scopeId,
    );
    return { success: true, mute: null };
  }

  @Delete(':scopeType/:scopeId')
  async remove(
    @Request() req,
    @Param('scopeType') scopeType: string,
    @Param('scopeId') scopeId: string,
  ) {
    await this.notificationRulesService.removeScopeMute(
      req.user.id,
      scopeType,
      scopeId,
    );
    return { success: true };
  }
}
