import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { LessThan, MoreThan, Repository } from 'typeorm';
import {
  AuditEvent,
  type AuditEventCategory,
  type AuditEventOutcome,
  type AuditEventSeverity,
} from '../entities/audit-event.entity';
import { RequestContextService } from '../common/services/request-context.service';

export interface AuditEventInput {
  category: AuditEventCategory;
  action: string;
  severity?: AuditEventSeverity;
  outcome?: AuditEventOutcome;
  userId?: number | null;
  organisationId?: number | null;
  resourceType?: string | null;
  resourceId?: string | number | null;
  method?: string | null;
  path?: string | null;
  ip?: string | null;
  requestId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  beforeSnapshot?: Record<string, unknown> | null;
  afterSnapshot?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

export interface AuditEventQuery {
  categories?: AuditEventCategory[];
  severities?: AuditEventSeverity[];
  outcomes?: AuditEventOutcome[];
  actions?: string[];
  userId?: number;
  organisationId?: number;
  search?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}

@Injectable()
export class AuditTrailService {
  private readonly logger = new Logger(AuditTrailService.name);

  constructor(
    @InjectRepository(AuditEvent)
    private readonly repository: Repository<AuditEvent>,
    private readonly requestContext: RequestContextService,
  ) {}

  async log(input: AuditEventInput): Promise<AuditEvent> {
    const context = this.requestContext.getContext();
    const severity = input.severity ?? this.deriveSeverity(input);
    const outcome = input.outcome ?? this.deriveOutcome(input);

    const event = this.repository.create({
      category: input.category,
      action: input.action,
      severity,
      outcome,
      requestId: input.requestId ?? context?.requestId ?? null,
      userId: input.userId ?? context?.userId ?? null,
      organisationId: input.organisationId ?? context?.organisationId ?? null,
      resourceType: input.resourceType ?? context?.resourceType ?? null,
      resourceId:
        typeof input.resourceId === 'number'
          ? String(input.resourceId)
          : input.resourceId ?? context?.resourceId ?? null,
      ip: input.ip ?? context?.ip ?? null,
      method: input.method ?? context?.method ?? null,
      path: input.path ?? context?.path ?? null,
      errorCode: input.errorCode ?? null,
      errorMessage: input.errorMessage ?? null,
      beforeSnapshot: input.beforeSnapshot ?? null,
      afterSnapshot: input.afterSnapshot ?? null,
      metadata: input.metadata ?? null,
      fingerprint: this.buildFingerprint(input, context?.path ?? null),
    });

    const saved = await this.repository.save(event);
    if (saved.severity === 'critical') {
      this.logger.warn(
        `Critical audit event recorded: ${saved.action} req=${saved.requestId ?? 'n/a'} code=${saved.errorCode ?? 'n/a'}`,
      );
    }
    return saved;
  }

  async logSecurityEvent(
    action: string,
    metadata: Record<string, unknown>,
    input: Partial<AuditEventInput> = {},
  ): Promise<AuditEvent> {
    return this.log({
      category: 'security',
      action,
      metadata,
      ...input,
    });
  }

  async logPermissionCheck(input: {
    action: string;
    allowed: boolean;
    userId?: number | null;
    organisationId?: number | null;
    metadata?: Record<string, unknown>;
  }): Promise<AuditEvent> {
    return this.log({
      category: 'permission',
      action: input.action,
      userId: input.userId ?? null,
      organisationId: input.organisationId ?? null,
      outcome: input.allowed ? 'success' : 'denied',
      severity: input.allowed ? 'info' : 'warn',
      metadata: {
        allowed: input.allowed,
        ...(input.metadata ?? {}),
      },
    });
  }

  async logDataMutation(input: {
    action: string;
    userId?: number | null;
    organisationId?: number | null;
    resourceType?: string;
    resourceId?: string | number | null;
    beforeSnapshot?: Record<string, unknown> | null;
    afterSnapshot?: Record<string, unknown> | null;
    metadata?: Record<string, unknown>;
  }): Promise<AuditEvent> {
    return this.log({
      category: 'mutation',
      action: input.action,
      userId: input.userId ?? null,
      organisationId: input.organisationId ?? null,
      resourceType: input.resourceType ?? null,
      resourceId: input.resourceId ?? null,
      beforeSnapshot: input.beforeSnapshot ?? null,
      afterSnapshot: input.afterSnapshot ?? null,
      metadata: input.metadata ?? null,
    });
  }

  async logApiError(input: {
    action: string;
    errorCode?: string;
    errorMessage?: string;
    statusCode?: number;
    metadata?: Record<string, unknown>;
  }): Promise<AuditEvent> {
    return this.log({
      category: 'api_error',
      action: input.action,
      severity: input.statusCode && input.statusCode >= 500 ? 'critical' : 'warn',
      outcome: 'failure',
      errorCode: input.errorCode ?? null,
      errorMessage: input.errorMessage ?? null,
      metadata: {
        statusCode: input.statusCode ?? null,
        ...(input.metadata ?? {}),
      },
    });
  }

  async query(query: AuditEventQuery): Promise<{ items: AuditEvent[]; count: number }> {
    const qb = this.repository
      .createQueryBuilder('event')
      .orderBy('event.createdAt', 'DESC');

    if (query.categories?.length) {
      qb.andWhere('event.category IN (:...categories)', {
        categories: query.categories,
      });
    }
    if (query.actions?.length) {
      qb.andWhere('event.action IN (:...actions)', {
        actions: query.actions,
      });
    }
    if (query.severities?.length) {
      qb.andWhere('event.severity IN (:...severities)', {
        severities: query.severities,
      });
    }
    if (query.outcomes?.length) {
      qb.andWhere('event.outcome IN (:...outcomes)', {
        outcomes: query.outcomes,
      });
    }
    if (query.search) {
      const search = `%${query.search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(event.action) LIKE :search OR LOWER(COALESCE(event.errorMessage, \'\')) LIKE :search OR LOWER(COALESCE(event.errorCode, \'\')) LIKE :search)',
        { search },
      );
    }
    if (query.from) {
      qb.andWhere('event.createdAt >= :from', { from: query.from.toISOString() });
    }
    if (query.to) {
      qb.andWhere('event.createdAt <= :to', { to: query.to.toISOString() });
    }
    if (typeof query.userId === 'number') {
      qb.andWhere('event.userId = :userId', { userId: query.userId });
    }
    if (typeof query.organisationId === 'number') {
      qb.andWhere('event.organisationId = :organisationId', {
        organisationId: query.organisationId,
      });
    }

    const offset = Math.max(query.offset ?? 0, 0);
    const limit = Math.min(Math.max(query.limit ?? 100, 1), 500);
    qb.skip(offset).take(limit);

    const [items, count] = await qb.getManyAndCount();
    return { items, count };
  }

  async getErrorSummary(hours = 24): Promise<{
    criticalCount: number;
    failureCount: number;
    topErrorCodes: Array<{ code: string; count: number }>;
    trend: Array<{ hour: string; count: number }>;
  }> {
    const windowStart = new Date(Date.now() - Math.max(hours, 1) * 60 * 60 * 1000);

    const criticalCount = await this.repository.count({
      where: {
        createdAt: MoreThan(windowStart),
        severity: 'critical',
      },
    });

    const failureCount = await this.repository.count({
      where: {
        createdAt: MoreThan(windowStart),
        outcome: 'failure',
      },
    });

    const errorCodeRows = await this.repository
      .createQueryBuilder('event')
      .select('COALESCE(event.errorCode, \'UNKNOWN\')', 'code')
      .addSelect('COUNT(*)', 'count')
      .where('event.createdAt >= :from', { from: windowStart.toISOString() })
      .andWhere('event.outcome = :outcome', { outcome: 'failure' })
      .groupBy('code')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany<{ code: string; count: string }>();

    const trendRows = await this.repository
      .createQueryBuilder('event')
      .select("TO_CHAR(event.createdAt, 'YYYY-MM-DD HH24:00')", 'hour')
      .addSelect('COUNT(*)', 'count')
      .where('event.createdAt >= :from', { from: windowStart.toISOString() })
      .groupBy('hour')
      .orderBy('hour', 'ASC')
      .getRawMany<{ hour: string; count: string }>();

    return {
      criticalCount,
      failureCount,
      topErrorCodes: errorCodeRows.map((row) => ({
        code: row.code,
        count: Number(row.count),
      })),
      trend: trendRows.map((row) => ({
        hour: row.hour,
        count: Number(row.count),
      })),
    };
  }

  async purgeOlderThan(days: number): Promise<number> {
    const threshold = new Date(
      Date.now() - Math.max(days, 1) * 24 * 60 * 60 * 1000,
    );
    const result = await this.repository.delete({
      createdAt: LessThan(threshold),
    });
    return result.affected ?? 0;
  }

  private deriveSeverity(input: AuditEventInput): AuditEventSeverity {
    if (input.category === 'api_error') {
      return 'warn';
    }
    return 'info';
  }

  private deriveOutcome(input: AuditEventInput): AuditEventOutcome {
    if (input.errorCode || input.errorMessage) {
      return 'failure';
    }
    return 'success';
  }

  private buildFingerprint(
    input: AuditEventInput,
    contextPath: string | null,
  ): string {
    const payload = [
      input.category,
      input.action,
      input.errorCode ?? '',
      input.errorMessage ?? '',
      input.path ?? contextPath ?? '',
    ].join('|');
    return createHash('sha256').update(payload).digest('hex').slice(0, 48);
  }
}
