import { ConsoleLogger, Injectable } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { LogLevel } from '../entities/log-entry.entity';

@Injectable()
export class AppLoggerService extends ConsoleLogger {
  constructor(private readonly loggingService: LoggingService) {
    super();
  }

  log(message: any, context?: string) {
    super.log(message, context);
    this.persist('log', message, context);
  }

  error(message: any, stack?: string, context?: string) {
    super.error(message, stack, context);
    this.persist('error', message, context, stack);
  }

  warn(message: any, context?: string) {
    super.warn(message, context);
    this.persist('warn', message, context);
  }

  debug(message: any, context?: string) {
    super.debug(message, context);
    this.persist('debug', message, context);
  }

  verbose(message: any, context?: string) {
    super.verbose(message, context);
    this.persist('verbose', message, context);
  }

  private persist(
    level: LogLevel,
    message: any,
    context?: string,
    stack?: string,
  ) {
    const normalizedMessage = this.normalizeMessage(message);

    void this.loggingService
      .persistLog(level, normalizedMessage, context, stack ?? null, null)
      .catch((error) => {
        super.error(
          `Failed to persist log entry: ${error.message}`,
          error.stack,
          'AppLoggerService',
        );
      });
  }

  private normalizeMessage(message: any): string {
    if (typeof message === 'string') {
      return message;
    }
    try {
      return JSON.stringify(message);
    } catch {
      return String(message);
    }
  }
}
