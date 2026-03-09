import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { LogEntry, LogLevel } from '../entities/log-entry.entity';
import { LogSettings } from '../entities/log-settings.entity';
import { toContainsLikePattern } from '../common/database/query-safety';

export interface LogQueryOptions {
  levels?: LogLevel[];
  contexts?: string[];
  search?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}

export interface ClearLogsOptions {
  before?: Date;
}

@Injectable()
export class LoggingService {
  private readonly defaultRetentionDays = parseInt(
    process.env.LOG_RETENTION_DAYS_DEFAULT || '30',
    10,
  );

  constructor(
    @InjectRepository(LogEntry)
    private readonly logRepository: Repository<LogEntry>,
    @InjectRepository(LogSettings)
    private readonly settingsRepository: Repository<LogSettings>,
  ) {}

  async persistLog(
    level: LogLevel,
    message: string,
    context?: string,
    stack?: string | null,
    metadata?: Record<string, unknown> | null,
  ): Promise<void> {
    const entry = this.logRepository.create({
      level: this.normalizeLevel(level),
      message: this.redactSecrets(message),
      context,
      stack: stack ? this.redactSecrets(stack) : null,
      metadata: metadata ? this.redactObject(metadata) : null,
    });

    await this.logRepository.save(entry);
  }

  async findLogs(
    options: LogQueryOptions = {},
  ): Promise<{ items: LogEntry[]; total: number }> {
    const {
      levels,
      contexts,
      search,
      from,
      to,
      limit = 200,
      offset = 0,
    } = options;

    const qb = this.logRepository
      .createQueryBuilder('log')
      .orderBy('log.createdAt', 'DESC');

    if (levels && levels.length > 0) {
      qb.andWhere('log.level IN (:...levels)', { levels });
    }

    if (contexts && contexts.length > 0) {
      qb.andWhere('log.context IN (:...contexts)', { contexts });
    }

    if (search) {
      const likeSearch = toContainsLikePattern(search);
      qb.andWhere(
        "(LOWER(log.message) LIKE :search ESCAPE '\\\\' OR LOWER(COALESCE(log.stack, '')) LIKE :search ESCAPE '\\\\')",
        { search: likeSearch },
      );
    }

    if (from) {
      qb.andWhere('log.createdAt >= :from', { from: from.toISOString() });
    }

    if (to) {
      qb.andWhere('log.createdAt <= :to', { to: to.toISOString() });
    }

    qb.skip(offset).take(Math.min(limit, 500));

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async clearLogs(options: ClearLogsOptions = {}): Promise<number> {
    const { before } = options;

    if (before) {
      const result = await this.logRepository.delete({
        createdAt: LessThan(before),
      });
      return result.affected || 0;
    }

    const result = await this.logRepository
      .createQueryBuilder()
      .delete()
      .execute();
    return result.affected || 0;
  }

  async getSettings(): Promise<LogSettings> {
    let settings = await this.settingsRepository.findOne({ where: { id: 1 } });

    if (!settings) {
      settings = this.settingsRepository.create({
        id: 1,
        retentionDays: this.defaultRetentionDays,
        autoCleanupEnabled: true,
        realtimeCriticalAlertsEnabled: true,
        errorRateAlertThresholdPerMinute: 25,
        p95LatencyAlertThresholdMs: 1500,
        metricsRetentionHours: 72,
      });
      await this.settingsRepository.save(settings);
    }

    return settings;
  }

  async updateSettings(
    partial: Partial<
      Pick<
        LogSettings,
        | 'retentionDays'
        | 'autoCleanupEnabled'
        | 'realtimeCriticalAlertsEnabled'
        | 'errorRateAlertThresholdPerMinute'
        | 'p95LatencyAlertThresholdMs'
        | 'metricsRetentionHours'
      >
    >,
  ): Promise<LogSettings> {
    const settings = await this.getSettings();

    if (
      typeof partial.retentionDays === 'number' &&
      partial.retentionDays >= 0
    ) {
      settings.retentionDays = partial.retentionDays;
    }

    if (typeof partial.autoCleanupEnabled === 'boolean') {
      settings.autoCleanupEnabled = partial.autoCleanupEnabled;
    }

    if (typeof partial.realtimeCriticalAlertsEnabled === 'boolean') {
      settings.realtimeCriticalAlertsEnabled =
        partial.realtimeCriticalAlertsEnabled;
    }

    if (typeof partial.errorRateAlertThresholdPerMinute === 'number') {
      settings.errorRateAlertThresholdPerMinute =
        partial.errorRateAlertThresholdPerMinute;
    }

    if (typeof partial.p95LatencyAlertThresholdMs === 'number') {
      settings.p95LatencyAlertThresholdMs = partial.p95LatencyAlertThresholdMs;
    }

    if (typeof partial.metricsRetentionHours === 'number') {
      settings.metricsRetentionHours = partial.metricsRetentionHours;
    }

    return this.settingsRepository.save(settings);
  }

  async purgeExpiredLogs(reference = new Date()): Promise<number> {
    const settings = await this.getSettings();

    if (!settings.autoCleanupEnabled || settings.retentionDays <= 0) {
      return 0;
    }

    const threshold = new Date(
      reference.getTime() - settings.retentionDays * 24 * 60 * 60 * 1000,
    );
    const deleteResult = await this.logRepository.delete({
      createdAt: LessThan(threshold),
    });

    return deleteResult.affected || 0;
  }

  private redactSecrets(input: string): string {
    let output = input;
    output = output.replace(
      /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
      'Bearer [REDACTED]',
    );
    output = output.replace(/("password"\s*:\s*")([^"]+)/gi, '$1[REDACTED]');
    output = output.replace(/(api[_-]?key"?\s*:\s*")([^"]+)/gi, '$1[REDACTED]');
    output = output.replace(
      /(refresh[_-]?token"?\s*:\s*")([^"]+)/gi,
      '$1[REDACTED]',
    );
    output = output.replace(
      /(access[_-]?token"?\s*:\s*")([^"]+)/gi,
      '$1[REDACTED]',
    );
    return output;
  }

  private normalizeLevel(level: LogLevel): LogLevel {
    if (level === 'log') {
      return 'info';
    }
    if (level === 'verbose') {
      return 'trace';
    }
    return level;
  }

  private redactObject(
    value: Record<string, unknown>,
  ): Record<string, unknown> {
    const output: Record<string, unknown> = {};

    for (const [key, raw] of Object.entries(value)) {
      const lowered = key.toLowerCase();
      if (
        lowered.includes('password') ||
        lowered.includes('token') ||
        lowered.includes('secret') ||
        lowered.includes('authorization') ||
        lowered.includes('cookie')
      ) {
        output[key] = '[REDACTED]';
        continue;
      }

      if (typeof raw === 'string') {
        output[key] = this.redactSecrets(raw);
        continue;
      }

      if (
        raw &&
        typeof raw === 'object' &&
        !Array.isArray(raw) &&
        !(raw instanceof Date)
      ) {
        output[key] = this.redactObject(raw as Record<string, unknown>);
        continue;
      }

      if (Array.isArray(raw)) {
        output[key] = raw.map((entry) =>
          typeof entry === 'string'
            ? this.redactSecrets(entry)
            : entry &&
                typeof entry === 'object' &&
                !Array.isArray(entry) &&
                !(entry instanceof Date)
              ? this.redactObject(entry as Record<string, unknown>)
              : entry,
        );
        continue;
      }

      output[key] = raw;
    }

    return output;
  }
}

