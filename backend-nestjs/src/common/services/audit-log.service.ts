import { Injectable, Logger } from '@nestjs/common';

export type AuditLogEntry = {
  action: string;
  actorId?: number | string;
  targetId?: number | string;
  metadata?: Record<string, any>;
  timestamp?: Date;
};

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  record(entry: AuditLogEntry): void {
    const payload = {
      ...entry,
      timestamp: entry.timestamp ?? new Date(),
    };

    this.logger.log(JSON.stringify(payload));
  }
}
