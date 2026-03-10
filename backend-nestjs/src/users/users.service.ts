import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { toContainsLikePattern } from '../common/database/query-safety';
import { AuditEvent } from '../entities/audit-event.entity';
import { AutomationAuditLog } from '../entities/automation-audit-log.entity';
import { AuditTrailService } from '../logging/audit-trail.service';
import { PersonalAuditQueryDto } from './dto/personal-audit.query.dto';

export interface PersonalAutomationRun {
  id: number;
  ruleId: number;
  ruleName: string | null;
  status: string;
  triggerType: string;
  executionTimeMs: number;
  executedAt: string;
  executedByUserId: number | null;
}

export interface PersonalAuditSummary {
  totalEvents: number;
  loginSuccessCount: number;
  loginFailureCount: number;
  failedRequestCount: number;
  deniedRequestCount: number;
  apiKeyCallCount: number;
  mcpCallCount: number;
  automationRunCount: number;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(AuditEvent)
    private auditEventRepository: Repository<AuditEvent>,
    @InjectRepository(AutomationAuditLog)
    private automationAuditLogRepository: Repository<AutomationAuditLog>,
    private readonly auditTrailService: AuditTrailService,
  ) {}

  async findAll(search?: string): Promise<Partial<User>[]> {
    const baseQuery = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.username',
        'user.email',
        'user.firstName',
        'user.lastName',
      ])
      .where('user.isActive = :isActive', { isActive: true });

    if (search) {
      const pattern = toContainsLikePattern(search);
      baseQuery.andWhere(
        `(
          user.username ILIKE :pattern ESCAPE '\\'
          OR user.email ILIKE :pattern ESCAPE '\\'
          OR user.firstName ILIKE :pattern ESCAPE '\\'
          OR user.lastName ILIKE :pattern ESCAPE '\\'
        )`,
        { pattern },
      );
      baseQuery.take(20);
    } else {
      baseQuery.orderBy('user.username', 'ASC').take(50);
    }

    return baseQuery.getMany();
  }

  async findOne(id: number): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { id, isActive: true },
      select: [
        'id',
        'username',
        'email',
        'firstName',
        'lastName',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username, isActive: true },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email, isActive: true },
    });
  }

  async getPersonalAuditFeed(userId: number, query: PersonalAuditQueryDto) {
    const from = this.parseDate(query.from);
    const to = this.parseDate(query.to);
    const limit = Math.min(Math.max(query.limit ?? 100, 1), 500);
    const offset = Math.max(query.offset ?? 0, 0);

    const events = await this.auditTrailService.query({
      categories: query.categories as
        | Array<
            | 'security'
            | 'permission'
            | 'mutation'
            | 'api_error'
            | 'frontend_error'
            | 'system'
          >
        | undefined,
      severities: query.severities as Array<'info' | 'warn' | 'critical'> | undefined,
      outcomes: query.outcomes as Array<'success' | 'failure' | 'denied'> | undefined,
      actions: query.actions,
      userId,
      search: query.search,
      from,
      to,
      limit,
      offset,
    });

    const automationRuns =
      query.includeAutomation === false
        ? []
        : await this.getPersonalAutomationRuns(userId, from, to, limit);

    const summary = await this.getPersonalAuditSummary(userId, from, to);

    return {
      events: events.items,
      eventCount: events.count,
      automationRuns,
      summary,
    };
  }

  private async getPersonalAutomationRuns(
    userId: number,
    from: Date | undefined,
    to: Date | undefined,
    limit: number,
  ): Promise<PersonalAutomationRun[]> {
    const query = this.automationAuditLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.rule', 'rule')
      .where('(rule.createdById = :userId OR log.executedByUserId = :userId)', {
        userId,
      })
      .orderBy('log.executedAt', 'DESC')
      .take(Math.min(limit, 200));

    if (from) {
      query.andWhere('log.executedAt >= :from', { from: from.toISOString() });
    }
    if (to) {
      query.andWhere('log.executedAt <= :to', { to: to.toISOString() });
    }

    const runs = await query.getMany();
    return runs.map((log) => ({
      id: log.id,
      ruleId: log.ruleId,
      ruleName: log.rule?.name ?? null,
      status: log.status,
      triggerType: log.triggerType,
      executionTimeMs: log.executionTimeMs,
      executedAt: log.executedAt.toISOString(),
      executedByUserId: log.executedByUserId,
    }));
  }

  private async getPersonalAuditSummary(
    userId: number,
    from: Date | undefined,
    to: Date | undefined,
  ): Promise<PersonalAuditSummary> {
    const baseQuery = this.auditEventRepository
      .createQueryBuilder('event')
      .where('event.userId = :userId', { userId });

    if (from) {
      baseQuery.andWhere('event.createdAt >= :from', { from: from.toISOString() });
    }
    if (to) {
      baseQuery.andWhere('event.createdAt <= :to', { to: to.toISOString() });
    }

    const [
      totalEvents,
      loginSuccessCount,
      loginFailureCount,
      failedRequestCount,
      deniedRequestCount,
      apiKeyCallCount,
      mcpCallCount,
      automationRunCount,
    ] = await Promise.all([
      baseQuery.clone().getCount(),
      baseQuery
        .clone()
        .andWhere('event.action = :action', { action: 'auth.login.success' })
        .getCount(),
      baseQuery
        .clone()
        .andWhere('event.action = :action', { action: 'auth.login.failure' })
        .getCount(),
      baseQuery
        .clone()
        .andWhere('event.outcome = :outcome', { outcome: 'failure' })
        .getCount(),
      baseQuery
        .clone()
        .andWhere('event.outcome = :outcome', { outcome: 'denied' })
        .getCount(),
      baseQuery
        .clone()
        .andWhere('event.action = :action', { action: 'api_key.request' })
        .getCount(),
      baseQuery
        .clone()
        .andWhere('event.action = :action', { action: 'mcp.action.execute' })
        .getCount(),
      this.automationAuditLogRepository
        .createQueryBuilder('log')
        .leftJoin('log.rule', 'rule')
        .where('(rule.createdById = :userId OR log.executedByUserId = :userId)', {
          userId,
        })
        .andWhere(from ? 'log.executedAt >= :from' : '1=1', {
          from: from?.toISOString(),
        })
        .andWhere(to ? 'log.executedAt <= :to' : '1=1', {
          to: to?.toISOString(),
        })
        .getCount(),
    ]);

    return {
      totalEvents,
      loginSuccessCount,
      loginFailureCount,
      failedRequestCount,
      deniedRequestCount,
      apiKeyCallCount,
      mcpCallCount,
      automationRunCount,
    };
  }

  private parseDate(value?: string): Date | undefined {
    if (!value) {
      return undefined;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
}
