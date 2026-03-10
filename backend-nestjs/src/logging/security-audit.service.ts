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
  | 'auth.mfa.setup'
  | 'auth.mfa.enabled'
  | 'auth.mfa.disabled'
  | 'webhook.received'
  | 'automation.invocation';

@Injectable()
export class SecurityAuditService {
  constructor(
    private readonly loggingService: LoggingService,
    private readonly auditTrailService: AuditTrailService,
  ) {}

  async log(event: SecurityAuditEvent, metadata: Record<string, unknown>) {
    const userIdRaw = metadata.userId;
    const orgIdRaw = metadata.organisationId ?? metadata.organizationId;
    const userId =
      typeof userIdRaw === 'number' && Number.isFinite(userIdRaw)
        ? userIdRaw
        : null;
    const organisationId =
      typeof orgIdRaw === 'number' && Number.isFinite(orgIdRaw)
        ? orgIdRaw
        : null;

    await this.loggingService.persistLog(
      'info',
      `Security event: ${event}`,
      'SecurityAudit',
      null,
      metadata,
    );
    await this.auditTrailService.logSecurityEvent(event, metadata, {
      userId,
      organisationId,
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
