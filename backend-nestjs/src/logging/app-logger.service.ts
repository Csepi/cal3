import { ConsoleLogger, Injectable } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { LogLevel } from '../entities/log-entry.entity';
import { RequestContextService } from '../common/services/request-context.service';

type NestLogLevel = 'log' | 'error' | 'warn' | 'debug' | 'verbose';

@Injectable()
export class AppLoggerService extends ConsoleLogger {
  private format: 'text' | 'json' = 'text';
  private readonly levelPriority: Record<NestLogLevel, number> = {
    error: 10,
    warn: 20,
    log: 30,
    debug: 40,
    verbose: 50,
  };
  private readonly minLevel: NestLogLevel;
  private readonly verboseBootstrap = process.env.VERBOSE_BOOT_LOGS === 'true';
  private readonly noisyBootstrapContexts = new Set([
    'RoutesResolver',
    'RouterExplorer',
    'InstanceLoader',
    'DependenciesScanner',
    'GraphInspector',
  ]);

  constructor(
    private readonly loggingService: LoggingService,
    private readonly requestContext: RequestContextService,
  ) {
    super();
    this.minLevel = this.resolveLevel(
      process.env.APP_LOG_LEVEL ?? process.env.LOG_LEVEL ?? this.defaultLevel(),
    );
  }

  setFormat(format: 'text' | 'json') {
    this.format = format;
  }

  log(message: any, context?: string) {
    if (!this.shouldLog('log', context)) return;
    super.log(message, context);
    this.persist('log', message, context);
  }

  error(message: any, stack?: string, context?: string) {
    if (!this.shouldLog('error', context)) return;
    super.error(message, stack, context);
    this.persist('error', message, context, stack);
  }

  warn(message: any, context?: string) {
    if (!this.shouldLog('warn', context)) return;
    super.warn(message, context);
    this.persist('warn', message, context);
  }

  debug(message: any, context?: string) {
    if (!this.shouldLog('debug', context)) return;
    super.debug(message, context);
    this.persist('debug', message, context);
  }

  verbose(message: any, context?: string) {
    if (!this.shouldLog('verbose', context)) return;
    super.verbose(message, context);
    this.persist('verbose', message, context);
  }

  protected formatMessage(
    level: NestLogLevel,
    message: any,
    context?: string,
    stack?: string,
  ) {
    const normalized = this.normalizeMessage(message);
    const timestamp = new Date().toISOString();
    const requestContext = this.requestContext.getContext();

    if (this.format === 'json') {
      const payload: Record<string, any> = {
        level,
        message: normalized,
        context: context ?? null,
        timestamp,
      };
      if (stack) payload.stack = stack;
      if (requestContext) {
        payload.requestId = requestContext.requestId;
        payload.method = requestContext.method;
        payload.path = requestContext.path;
        payload.ip = requestContext.ip;
        payload.userId = requestContext.userId ?? null;
      }
      return JSON.stringify(payload);
    }

    const segments = [
      `[${timestamp}]`,
      level.toUpperCase().padEnd(7),
      context ? `[${context}]` : null,
      requestContext?.requestId ? `(req:${requestContext.requestId})` : null,
      normalized,
    ].filter(Boolean);

    if (stack && level === 'error') {
      segments.push(`\n${stack}`);
    }
    return segments.join(' ');
  }

  private shouldLog(level: NestLogLevel, context?: string): boolean {
    if (this.levelPriority[level] > this.levelPriority[this.minLevel]) {
      return false;
    }
    if (
      !this.verboseBootstrap &&
      context &&
      this.noisyBootstrapContexts.has(context) &&
      level !== 'warn' &&
      level !== 'error'
    ) {
      return false;
    }
    return true;
  }

  private defaultLevel(): NestLogLevel {
    return process.env.NODE_ENV === 'production' ? 'log' : 'debug';
  }

  private resolveLevel(raw: string): NestLogLevel {
    const normalized = raw?.toLowerCase() as NestLogLevel | undefined;
    if (normalized && normalized in this.levelPriority) {
      return normalized;
    }
    return this.defaultLevel();
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
    if (message instanceof Error) {
      return message.message;
    }
    try {
      return JSON.stringify(message);
    } catch {
      return String(message);
    }
  }
}
