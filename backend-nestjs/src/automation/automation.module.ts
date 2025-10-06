import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutomationRule } from '../entities/automation-rule.entity';
import { AutomationCondition } from '../entities/automation-condition.entity';
import { AutomationAction } from '../entities/automation-action.entity';
import { AutomationAuditLog } from '../entities/automation-audit-log.entity';
import { Event } from '../entities/event.entity';
import { Calendar } from '../entities/calendar.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AutomationRule,
      AutomationCondition,
      AutomationAction,
      AutomationAuditLog,
      Event,
      Calendar,
    ]),
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class AutomationModule {}
