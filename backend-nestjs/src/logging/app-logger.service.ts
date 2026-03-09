import { ConsoleLogger, Injectable } from '@nestjs/common';
import pino, { type Logger as PinoLogger } from 'pino';
import { LoggingService } from './logging.service';
import { type LogLevel } from '../entities/log-entry.entity';
import { RequestContextService } from '../common/services/request-context.service';

type LoggerLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';
type LegacyLevel = 'log' | 'verbose';
type SupportedLevel = LoggerLevel | LegacyLevel;

interface LoggerPayload {
  level: LoggerLevel;
  message: string;
  context?: string;
  timestamp: string;
  requestId?: string;
  method?: string;
  path?: string;
  ip?: string;
  userId?: number;
  organisationId?: number;
  resourceType?: string;
  resourceId?: string;
  stack?: string;
}

@Injectable()
export class AppLoggerService extends ConsoleLogger {
  private format: 'text' | 'json' = 'json';
  private readonly levelPriority: Record<LoggerLevel, number> = {
    error: 10,
    warn: 20,
    info: 30,
    debug: 40,
    trace: 50,
  };
  private readonly minLevel: LoggerLevel;
  private readonly verboseBootstrap = process.env.VERBOSE_BOOT_LOGS === 'true';
  private readonly noisyBootstrapContexts = new Set([
    'RoutesResolver',
    'RouterExplorer',
    'InstanceLoader',
    'DependenciesScanner',
    'GraphInspector',
  ]);
  private readonly pino: PinoLogger;

  constructor(
    private readonly loggingService: LoggingService,
    private readonly requestContext: RequestContextService,
  ) {
    super();
    this.minLevel = this.resolveLevel(
      process.env.APP_LOG_LEVEL ?? process.env.LOG_LEVEL ?? this.defaultLevel(),
    );
    this.pino = pino({
      level: this.minLevel,
      base: {
        service: 'cal3-backend',
        env: process.env.NODE_ENV ?? 'development',
      },
      redact: {
        paths: [
          '*.password',
          '*.token',
          '*.secret',
          '*.authorization',
          '*.cookie',
          'password',
          'token',
          'authorization',
          'cookie',
        ],
        censor: '[REDACTED]',
      },
    });
  }

  setFormat(format: 'text' | 'json') {
    this.format = format;
  }

  log(message: unknown, context?: string) {
    this.info(message, context);
  }

  info(message: unknown, context?: string) {
    this.write('info', message, context);
  }

  error(message: unknown, stack?: string, context?: string) {
    this.write('error', message, context, stack);
  }

  warn(message: unknown, context?: string) {
    this.write('warn', message, context);
  }

  debug(message: unknown, context?: string) {
    this.write('debug', message, context);
  }

  verbose(message: unknown, context?: string) {
    this.trace(message, context);
  }

  trace(message: unknown, context?: string) {
    this.write('trace', message, context);
  }

  private write(
    level: LoggerLevel,
    message: unknown,
    context?: string,
    stack?: string,
  ): void {
    if (!this.shouldLog(level, context)) return;

    const payload = this.createPayload(level, message, context, stack);
    if (this.format === 'json') {
      this.writeJson(payload);
    } else {
      this.writeText(payload);
    }

    this.persist(level, payload.message, context, stack);
  }

  private createPayload(
    level: LoggerLevel,
    message: unknown,
    context?: string,
    stack?: string,
  ): LoggerPayload {
    const requestContext = this.requestContext.getContext();
    return {
      level,
      message: this.normalizeMessage(message),
      context,
      timestamp: new Date().toISOString(),
      requestId: requestContext?.requestId,
      method: requestContext?.method,
      path: requestContext?.path,
      ip: requestContext?.ip,
      userId: requestContext?.userId,
      organisationId: requestContext?.organisationId,
      resourceType: requestContext?.resourceType,
      resourceId: requestContext?.resourceId,
      stack,
    };
  }

  private writeJson(payload: LoggerPayload): void {
    if (payload.level === 'error') {
      this.pino.error(payload);
      return;
    }
    if (payload.level === 'warn') {
      this.pino.warn(payload);
      return;
    }
    if (payload.level === 'info') {
      this.pino.info(payload);
      return;
    }
    if (payload.level === 'debug') {
      this.pino.debug(payload);
      return;
    }
    this.pino.trace(payload);
  }

  private writeText(payload: LoggerPayload): void {
    const context = payload.context ?? 'Application';
    const suffix = payload.requestId ? ` [req:${payload.requestId}]` : '';
    const text = `${payload.message}${suffix}`;

    if (payload.level === 'error') {
      super.error(text, payload.stack, context);
      return;
    }
    if (payload.level === 'warn') {
      super.warn(text, context);
      return;
    }
    if (payload.level === 'info') {
      super.log(text, context);
      return;
    }
    if (payload.level === 'debug') {
      super.debug(text, context);
      return;
    }
    super.verbose(text, context);
  }

  private shouldLog(level: LoggerLevel, context?: string): boolean {
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

  private defaultLevel(): LoggerLevel {
    return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
  }

  private resolveLevel(raw: string): LoggerLevel {
    const normalized = raw?.toLowerCase() as SupportedLevel | undefined;
    if (normalized === 'log') return 'info';
    if (normalized === 'verbose') return 'trace';
    if (
      normalized === 'error' ||
      normalized === 'warn' ||
      normalized === 'info' ||
      normalized === 'debug' ||
      normalized === 'trace'
    ) {
      return normalized;
    }
    return this.defaultLevel();
  }

  private persist(
    level: LoggerLevel,
    message: string,
    context?: string,
    stack?: string,
  ) {
    const requestContext = this.requestContext.getContext();
    const metadata = requestContext
      ? {
          requestId: requestContext.requestId,
          method: requestContext.method,
          path: requestContext.path,
          ip: requestContext.ip,
          userId: requestContext.userId ?? null,
          organisationId: requestContext.organisationId ?? null,
          resourceType: requestContext.resourceType ?? null,
          resourceId: requestContext.resourceId ?? null,
        }
      : undefined;

    const logLevel = this.mapToEntityLogLevel(level);

    void this.loggingService
      .persistLog(logLevel, message, context, stack ?? null, metadata ?? null)
      .catch((error) => {
        super.error(
          `Failed to persist log entry: ${error.message}`,
          error.stack,
          'AppLoggerService',
        );
      });
  }

  private mapToEntityLogLevel(level: LoggerLevel): LogLevel {
    if (level === 'trace') {
      return 'trace';
    }
    return level;
  }

  private normalizeMessage(message: unknown): string {
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
