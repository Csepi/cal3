import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutomationRule } from '../entities/automation-rule.entity';
import { AutomationCondition } from '../entities/automation-condition.entity';
import { AutomationAction } from '../entities/automation-action.entity';
import { AutomationAuditLog } from '../entities/automation-audit-log.entity';
import { Event } from '../entities/event.entity';
import { Calendar } from '../entities/calendar.entity';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { AutomationEvaluatorService } from './automation-evaluator.service';
import { AutomationSchedulerService } from './automation-scheduler.service';
import { ActionExecutorRegistry } from './executors/action-executor-registry';
import { SetEventColorExecutor } from './executors/set-event-color.executor';

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
  controllers: [AutomationController],
  providers: [
    AutomationService,
    AutomationEvaluatorService,
    AutomationSchedulerService,
    ActionExecutorRegistry,
    SetEventColorExecutor,
  ],
  exports: [AutomationService, AutomationEvaluatorService],
})
export class AutomationModule {}
