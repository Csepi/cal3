import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { LogEntry, LogLevel } from '../entities/log-entry.entity';
import { LogSettings } from '../entities/log-settings.entity';

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
      level,
      message: this.redactSecrets(message),
      context,
      stack,
      metadata,
    });

    await this.logRepository.save(entry);
  }

  async findLogs(options: LogQueryOptions = {}): Promise<LogEntry[]> {
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
      const likeSearch = `%${search.toLowerCase()}%`;
      qb.andWhere(
        "(LOWER(log.message) LIKE :search OR LOWER(COALESCE(log.stack, '')) LIKE :search)",
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

    return qb.getMany();
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
      });
      await this.settingsRepository.save(settings);
    }

    return settings;
  }

  async updateSettings(
    partial: Partial<Pick<LogSettings, 'retentionDays' | 'autoCleanupEnabled'>>,
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
    return output;
  }
}
