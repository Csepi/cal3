import { Injectable } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { AuditTrailService } from './audit-trail.service';

export type SecurityAuditEvent =
  | 'auth.login.success'
  | 'auth.login.failure'
  | 'auth.logout'
  | 'auth.register'
  | 'auth.refresh'
  | 'auth.refresh.suspicious'
  | 'webhook.received'
  | 'automation.invocation';

@Injectable()
export class SecurityAuditService {
  constructor(
    private readonly loggingService: LoggingService,
    private readonly auditTrailService: AuditTrailService,
  ) {}

  async log(event: SecurityAuditEvent, metadata: Record<string, unknown>) {
    await this.loggingService.persistLog(
      'info',
      `Security event: ${event}`,
      'SecurityAudit',
      null,
      metadata,
    );
    await this.auditTrailService.logSecurityEvent(event, metadata, {
      severity:
        event.includes('failure') || event.includes('suspicious')
          ? 'warn'
          : 'info',
      outcome:
        event.includes('failure') || event.includes('suspicious')
          ? 'failure'
          : 'success',
    });
  }
}
