import { ConsoleLogger, Injectable } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { LogLevel } from '../entities/log-entry.entity';
import { RequestContextService } from '../common/services/request-context.service';

@Injectable()
export class AppLoggerService extends ConsoleLogger {
  private format: 'text' | 'json' = 'text';
  constructor(
    private readonly loggingService: LoggingService,
    private readonly requestContext: RequestContextService,
  ) {
    super();
  }

  setFormat(format: 'text' | 'json') {
    this.format = format;
  }

  protected formatMessage(
    level: string,
    message: any,
    context?: string,
    stack?: string,
  ) {
    if (this.format === 'json') {
      const payload: Record<string, any> = {
        level,
        message: this.normalizeMessage(message),
        context: context ?? null,
        timestamp: new Date().toISOString(),
      };
      if (stack) payload.stack = stack;
      const requestContext = this.requestContext.getContext();
      if (requestContext) {
        payload.requestId = requestContext.requestId;
        payload.method = requestContext.method;
        payload.path = requestContext.path;
        payload.ip = requestContext.ip;
        payload.userId = requestContext.userId ?? null;
      }
      return JSON.stringify(payload);
    }
    return message;
  }

  log(message: any, context?: string) {
    super.log(this.formatMessage('log', message, context), context);
    this.persist('log', message, context);
  }

  error(message: any, stack?: string, context?: string) {
    super.error(this.formatMessage('error', message, context, stack), stack, context);
    this.persist('error', message, context, stack);
  }

  warn(message: any, context?: string) {
    super.warn(this.formatMessage('warn', message, context), context);
    this.persist('warn', message, context);
  }

  debug(message: any, context?: string) {
    super.debug(this.formatMessage('debug', message, context), context);
    this.persist('debug', message, context);
  }

  verbose(message: any, context?: string) {
    super.verbose(this.formatMessage('verbose', message, context), context);
    this.persist('verbose', message, context);
  }

  private persist(
    level: LogLevel,
    message: any,
    context?: string,
    stack?: string,
  ) {
    const normalizedMessage = this.normalizeMessage(message);
    const requestContext = this.requestContext.getContext();
    const metadata = requestContext
      ? {
          requestId: requestContext.requestId,
          method: requestContext.method,
          path: requestContext.path,
          ip: requestContext.ip,
          userId: requestContext.userId ?? null,
        }
      : undefined;

    void this.loggingService
      .persistLog(
        level,
        normalizedMessage,
        context,
        stack ?? null,
        metadata ?? null,
      )
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
