import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AutomationAuditLog } from '../entities/automation-audit-log.entity';
import { AutomationRule } from '../entities/automation-rule.entity';

import { logError } from '../common/errors/error-logger';
import { buildErrorContext } from '../common/errors/error-context';
/**
 * Service for managing automation audit logs with circular buffer enforcement
 *
 * Features:
 * - Maintains max 1000 audit logs per rule (circular buffer)
 * - Daily cleanup of old logs beyond buffer limit
 * - Statistics aggregation
 */
@Injectable()
export class AutomationAuditService {
  private readonly logger = new Logger(AutomationAuditService.name);
  private readonly MAX_LOGS_PER_RULE = 1000;

  constructor(
    @InjectRepository(AutomationAuditLog)
    private readonly auditLogRepository: Repository<AutomationAuditLog>,
    @InjectRepository(AutomationRule)
    private readonly ruleRepository: Repository<AutomationRule>,
  ) {}

  /**
   * Daily cleanup job that enforces circular buffer limit
   * Runs every day at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldAuditLogs(): Promise<void> {
    this.logger.log('Starting audit log cleanup...');

    try {
      const rules = await this.ruleRepository.find({
        select: ['id'],
      });

      let totalDeleted = 0;

      for (const rule of rules) {
        const deleted = await this.enforceCircularBuffer(rule.id);
        totalDeleted += deleted;
      }

      this.logger.log(
        `Audit log cleanup completed. Deleted ${totalDeleted} old logs.`,
      );
    } catch (error) {
      logError(
        error,
        buildErrorContext({ action: 'automation-audit.service' }),
      );
      this.logger.error('Error during audit log cleanup:', error);
    }
  }

  /**
   * Enforce circular buffer limit for a specific rule
   * Keeps only the most recent MAX_LOGS_PER_RULE logs
   */
  async enforceCircularBuffer(ruleId: number): Promise<number> {
    try {
      // Count total logs for this rule
      const totalCount = await this.auditLogRepository.count({
        where: { ruleId },
      });

      if (totalCount <= this.MAX_LOGS_PER_RULE) {
        return 0; // Nothing to delete
      }

      // Calculate how many logs to delete
      const logsToDelete = totalCount - this.MAX_LOGS_PER_RULE;

      // Get the IDs of the oldest logs to delete
      const oldestLogs = await this.auditLogRepository
        .createQueryBuilder('log')
        .where('log.ruleId = :ruleId', { ruleId })
        .orderBy('log.executedAt', 'ASC')
        .limit(logsToDelete)
        .select(['log.id'])
        .getMany();

      if (oldestLogs.length === 0) {
        return 0;
      }

      const idsToDelete = oldestLogs.map((log) => log.id);

      // Delete the oldest logs
      const result = await this.auditLogRepository.delete(idsToDelete);

      this.logger.debug(
        `Deleted ${result.affected || 0} audit logs for rule ${ruleId} (circular buffer enforcement)`,
      );

      return result.affected || 0;
    } catch (error) {
      logError(
        error,
        buildErrorContext({ action: 'automation-audit.service' }),
      );
      this.logger.error(
        `Error enforcing circular buffer for rule ${ruleId}:`,
        error,
      );
      return 0;
    }
  }

  /**
   * Cleanup logs older than a specific date
   * Useful for manual cleanup or policy enforcement
   */
  async cleanupLogsOlderThan(date: Date): Promise<number> {
    try {
      const result = await this.auditLogRepository.delete({
        executedAt: LessThan(date),
      });

      this.logger.log(
        `Deleted ${result.affected || 0} audit logs older than ${date.toISOString()}`,
      );

      return result.affected || 0;
    } catch (error) {
      logError(
        error,
        buildErrorContext({ action: 'automation-audit.service' }),
      );
      this.logger.error('Error cleaning up old audit logs:', error);
      return 0;
    }
  }

  /**
   * Get total count of audit logs
   */
  async getTotalAuditLogsCount(): Promise<number> {
    return this.auditLogRepository.count();
  }

  /**
   * Get audit log count per rule
   */
  async getAuditLogCountByRule(ruleId: number): Promise<number> {
    return this.auditLogRepository.count({
      where: { ruleId },
    });
  }

  /**
   * Get oldest audit log date for a rule
   */
  async getOldestLogDate(ruleId: number): Promise<Date | null> {
    const oldestLog = await this.auditLogRepository.findOne({
      where: { ruleId },
      order: { executedAt: 'ASC' },
      select: ['executedAt'],
    });

    return oldestLog?.executedAt || null;
  }

  /**
   * Get newest audit log date for a rule
   */
  async getNewestLogDate(ruleId: number): Promise<Date | null> {
    const newestLog = await this.auditLogRepository.findOne({
      where: { ruleId },
      order: { executedAt: 'DESC' },
      select: ['executedAt'],
    });

    return newestLog?.executedAt || null;
  }

  /**
   * Check if circular buffer is near capacity
   * Returns true if > 90% full
   */
  async isBufferNearCapacity(ruleId: number): Promise<boolean> {
    const count = await this.getAuditLogCountByRule(ruleId);
    return count >= this.MAX_LOGS_PER_RULE * 0.9;
  }

  /**
   * Get buffer usage statistics for a rule
   */
  async getBufferStats(ruleId: number): Promise<{
    current: number;
    max: number;
    percentUsed: number;
    nearCapacity: boolean;
  }> {
    const current = await this.getAuditLogCountByRule(ruleId);
    const percentUsed = (current / this.MAX_LOGS_PER_RULE) * 100;
    const nearCapacity = current >= this.MAX_LOGS_PER_RULE * 0.9;

    return {
      current,
      max: this.MAX_LOGS_PER_RULE,
      percentUsed,
      nearCapacity,
    };
  }

  /**
   * Manually trigger cleanup for all rules
   * Useful for testing or immediate cleanup needs
   */
  async triggerManualCleanup(): Promise<{
    totalDeleted: number;
    rulesProcessed: number;
  }> {
    this.logger.log('Manual audit log cleanup triggered');

    const rules = await this.ruleRepository.find({
      select: ['id'],
    });

    let totalDeleted = 0;

    for (const rule of rules) {
      const deleted = await this.enforceCircularBuffer(rule.id);
      totalDeleted += deleted;
    }

    return {
      totalDeleted,
      rulesProcessed: rules.length,
    };
  }
}
