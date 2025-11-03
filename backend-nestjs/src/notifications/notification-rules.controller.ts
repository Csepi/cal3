import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationRulesService } from './notification-rules.service';
import { InboxRuleDto, UpdateInboxRulesDto } from './dto/inbox-rule.dto';

@Controller('notifications/rules')
@UseGuards(JwtAuthGuard)
export class NotificationRulesController {
  constructor(
    private readonly notificationRulesService: NotificationRulesService,
  ) {}

  @Get()
  list(@Request() req) {
    return this.notificationRulesService.getUserInboxRules(req.user.id);
  }

  @Post()
  create(@Request() req, @Body() rule: InboxRuleDto) {
    return this.notificationRulesService.upsertRule(req.user.id, rule);
  }

  @Patch()
  bulkUpdate(@Request() req, @Body() payload: UpdateInboxRulesDto) {
    return this.notificationRulesService.reorderRules(
      req.user.id,
      payload.rules,
    );
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.notificationRulesService.deleteRule(req.user.id, +id);
  }
}
