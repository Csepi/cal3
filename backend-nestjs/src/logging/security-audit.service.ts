import { Injectable } from '@nestjs/common';
import { LoggingService } from './logging.service';

export type SecurityAuditEvent =
  | 'auth.login.success'
  | 'auth.login.failure'
  | 'auth.logout'
  | 'auth.register'
  | 'auth.refresh'
  | 'webhook.received'
  | 'automation.invocation';

@Injectable()
export class SecurityAuditService {
  constructor(private readonly loggingService: LoggingService) {}

  async log(event: SecurityAuditEvent, metadata: Record<string, unknown>) {
    await this.loggingService.persistLog(
      'log',
      `Security event: ${event}`,
      'SecurityAudit',
      null,
      metadata,
    );
  }
}
