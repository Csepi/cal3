import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from '../entities/user.entity';
import { AuditEvent } from '../entities/audit-event.entity';
import { AutomationAuditLog } from '../entities/automation-audit-log.entity';
import { AutomationRule } from '../entities/automation-rule.entity';
import { LoggingModule } from '../logging/logging.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, AuditEvent, AutomationAuditLog, AutomationRule]),
    LoggingModule,
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
