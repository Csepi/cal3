import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  AutomationRule,
  TriggerType,
} from '../entities/automation-rule.entity';
import { Event } from '../entities/event.entity';
import { AutomationService } from './automation.service';

import { logError } from '../common/errors/error-logger';
import { buildErrorContext } from '../common/errors/error-context';
/**
 * Scheduler service for time-based automation triggers
 * Handles cron-based scheduling and event proximity checks
 */
@Injectable()
export class AutomationSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(AutomationSchedulerService.name);

  private getErrorMessage(error: any): string {
    return error instanceof Error ? error.message : String(error);
  }

  constructor(
    @InjectRepository(AutomationRule)
    private readonly ruleRepository: Repository<AutomationRule>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    private readonly automationService: AutomationService,
  ) {}

  onModuleInit() {
    this.logger.log('Automation Scheduler Service initialized');
  }

  /**
   * Check for time-based triggers every minute
   * Handles: event.starts_in, event.ends_in, scheduled.time
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async checkTimeBasedTriggers() {
    try {
      // Get all enabled time-based rules with retry logic for connection errors
      let rules;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          rules = await this.ruleRepository.find({
            where: [
              { isEnabled: true, triggerType: TriggerType.EVENT_STARTS_IN },
              { isEnabled: true, triggerType: TriggerType.EVENT_ENDS_IN },
              { isEnabled: true, triggerType: TriggerType.SCHEDULED_TIME },
            ],
            relations: ['conditions', 'actions'],
          });
          break; // Success, exit retry loop
        } catch (dbError) {
          logError(
            dbError,
            buildErrorContext({ action: 'automation-scheduler.service' }),
          );
          retryCount++;
          if (retryCount >= maxRetries) {
            throw dbError; // Rethrow after max retries
          }
          // Wait before retry (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * retryCount),
          );
          this.logger.warn(`Database query retry ${retryCount}/${maxRetries}`);
        }
      }

      if (!rules || rules.length === 0) {
        return;
      }

      this.logger.debug(`Checking ${rules.length} time-based rules`);

      for (const rule of rules) {
        await this.processTimeBasedRule(rule);
      }
    } catch (error: any) {
      logError(
        error,
        buildErrorContext({ action: 'automation-scheduler.service' }),
      );
      // Only log error if it's not a connection termination during idle time
      if (
        this.getErrorMessage(error) &&
        !this.getErrorMessage(error).includes(
          'Connection terminated unexpectedly',
        )
      ) {
        this.logger.error(
          `Error in time-based trigger check: ${this.getErrorMessage(error)}`,
          error instanceof Error ? error.stack : undefined,
        );
      } else {
        // Silent fail for connection termination - will reconnect on next run
        this.logger.debug(
          'Database connection temporarily unavailable, will retry on next cycle',
        );
      }
    }
  }

  /**
   * Process a time-based rule
   */
  private async processTimeBasedRule(rule: AutomationRule): Promise<void> {
    try {
      switch (rule.triggerType) {
        case TriggerType.EVENT_STARTS_IN:
          await this.checkEventStartsIn(rule);
          break;

        case TriggerType.EVENT_ENDS_IN:
          await this.checkEventEndsIn(rule);
          break;

        case TriggerType.SCHEDULED_TIME:
          await this.checkScheduledTime(rule);
          break;
      }
    } catch (error: any) {
      logError(
        error,
        buildErrorContext({ action: 'automation-scheduler.service' }),
      );
      this.logger.error(
        `Error processing time-based rule ${rule.id}: ${this.getErrorMessage(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Check for events starting within configured time window
   * triggerConfig: { minutes: 60 } // Fire 60 minutes before event starts
   */
  private async checkEventStartsIn(rule: AutomationRule): Promise<void> {
    try {
      const minutes = Number(
        (rule.triggerConfig as { minutes?: number } | null | undefined)
          ?.minutes ?? 60,
      );
      const now = new Date();
      const targetTime = new Date(now.getTime() + minutes * 60 * 1000);

      // Find events starting around target time (within 1 minute window)
      const windowStart = new Date(targetTime.getTime() - 30 * 1000); // 30 seconds before
      const windowEnd = new Date(targetTime.getTime() + 30 * 1000); // 30 seconds after

      const events = await this.eventRepository
        .createQueryBuilder('event')
        .innerJoin('event.calendar', 'calendar')
        .where('calendar.userId = :userId', { userId: rule.createdById })
        .andWhere('event.startDate = :date', {
          date: windowStart.toISOString().split('T')[0],
        })
        .getMany();

      // Filter events by time window
      const matchingEvents = events.filter((event) => {
        if (!event.startTime) return false;

        const [hours, minutes] = event.startTime.split(':').map(Number);
        const eventDateTime = new Date(event.startDate);
        eventDateTime.setHours(hours, minutes, 0, 0);

        return eventDateTime >= windowStart && eventDateTime <= windowEnd;
      });

      for (const event of matchingEvents) {
        await this.executeRuleForEvent(rule, event);
      }
    } catch (error: any) {
      logError(
        error,
        buildErrorContext({ action: 'automation-scheduler.service' }),
      );
      // Gracefully handle database connection errors
      if (this.getErrorMessage(error).includes('Connection terminated')) {
        this.logger.debug(`Skipping rule ${rule.id} due to connection issue`);
        return;
      }
      throw error;
    }
  }

  /**
   * Check for events ending within configured time window
   * triggerConfig: { minutes: 15 } // Fire 15 minutes before event ends
   */
  private async checkEventEndsIn(rule: AutomationRule): Promise<void> {
    try {
      const minutes = Number(
        (rule.triggerConfig as { minutes?: number } | null | undefined)
          ?.minutes ?? 15,
      );
      const now = new Date();
      const targetTime = new Date(now.getTime() + minutes * 60 * 1000);

      const windowStart = new Date(targetTime.getTime() - 30 * 1000);
      const windowEnd = new Date(targetTime.getTime() + 30 * 1000);

      const events = await this.eventRepository
        .createQueryBuilder('event')
        .innerJoin('event.calendar', 'calendar')
        .where('calendar.userId = :userId', { userId: rule.createdById })
        .andWhere('event.endDate = :date', {
          date: windowStart.toISOString().split('T')[0],
        })
        .getMany();

      const matchingEvents = events.filter((event) => {
        if (!event.endTime || !event.endDate) return false;

        const [hours, minutes] = event.endTime.split(':').map(Number);
        const eventDateTime = new Date(event.endDate);
        eventDateTime.setHours(hours, minutes, 0, 0);

        return eventDateTime >= windowStart && eventDateTime <= windowEnd;
      });

      for (const event of matchingEvents) {
        await this.executeRuleForEvent(rule, event);
      }
    } catch (error: any) {
      logError(
        error,
        buildErrorContext({ action: 'automation-scheduler.service' }),
      );
      // Gracefully handle database connection errors
      if (this.getErrorMessage(error).includes('Connection terminated')) {
        this.logger.debug(`Skipping rule ${rule.id} due to connection issue`);
        return;
      }
      throw error;
    }
  }

  /**
   * Check for scheduled time triggers
   * triggerConfig: { cronExpression: '0 9 * * 1-5', targetField: 'all' }
   */
  private async checkScheduledTime(rule: AutomationRule): Promise<void> {
    try {
      // For scheduled time triggers, we execute against all user events
      // or specific events based on configuration
      const events = await this.eventRepository
        .createQueryBuilder('event')
        .innerJoin('event.calendar', 'calendar')
        .where('calendar.userId = :userId', { userId: rule.createdById })
        .getMany();

      for (const event of events) {
        await this.executeRuleForEvent(rule, event);
      }
    } catch (error: any) {
      logError(
        error,
        buildErrorContext({ action: 'automation-scheduler.service' }),
      );
      // Gracefully handle database connection errors
      if (this.getErrorMessage(error).includes('Connection terminated')) {
        this.logger.debug(`Skipping rule ${rule.id} due to connection issue`);
        return;
      }
      throw error;
    }
  }

  /**
   * Execute a rule for a specific event (non-blocking)
   */
  private async executeRuleForEvent(
    rule: AutomationRule,
    event: Event,
  ): Promise<void> {
    try {
      // Load full event with calendar relationship
      const fullEvent = await this.eventRepository.findOne({
        where: { id: event.id },
        relations: ['calendar'],
      });

      if (!fullEvent) return;

      // Execute rule asynchronously (don't await to avoid blocking)
      this.automationService
        .executeRuleOnEvent(rule, fullEvent)
        .catch((error: any) => {
          this.logger.error(
            `Failed to execute rule ${rule.id} on event ${event.id}: ${this.getErrorMessage(error)}`,
          );
        });
    } catch (error: any) {
      logError(
        error,
        buildErrorContext({ action: 'automation-scheduler.service' }),
      );
      this.logger.error(
        `Error executing rule ${rule.id} for event ${event.id}: ${this.getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Manually trigger check for a specific rule
   * Used for testing or manual trigger execution
   */
  async triggerRuleCheck(ruleId: number): Promise<void> {
    const rule = await this.ruleRepository.findOne({
      where: { id: ruleId },
      relations: ['conditions', 'actions'],
    });

    if (!rule || !rule.isEnabled) {
      throw new Error(`Rule ${ruleId} not found or not enabled`);
    }

    await this.processTimeBasedRule(rule);
  }
}
