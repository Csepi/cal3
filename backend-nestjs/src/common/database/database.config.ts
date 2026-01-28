import { Logger } from '@nestjs/common';
import type { DataSourceOptions } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Calendar, CalendarShare } from '../../entities/calendar.entity';
import { CalendarGroup } from '../../entities/calendar-group.entity';
import { Event } from '../../entities/event.entity';
import { EventComment } from '../../entities/event-comment.entity';
import { Task } from '../../entities/task.entity';
import { TaskLabel } from '../../entities/task-label.entity';
import {
  CalendarSyncConnection,
  SyncedCalendar,
  SyncEventMapping,
} from '../../entities/calendar-sync.entity';
import { Organisation } from '../../entities/organisation.entity';
import { OrganisationAdmin } from '../../entities/organisation-admin.entity';
import { OrganisationUser } from '../../entities/organisation-user.entity';
import { OrganisationResourceTypePermission } from '../../entities/organisation-resource-type-permission.entity';
import { OrganisationCalendarPermission } from '../../entities/organisation-calendar-permission.entity';
import { ReservationCalendar } from '../../entities/reservation-calendar.entity';
import { ReservationCalendarRole } from '../../entities/reservation-calendar-role.entity';
import { ResourceType } from '../../entities/resource-type.entity';
import { Resource } from '../../entities/resource.entity';
import { OperatingHours } from '../../entities/operating-hours.entity';
import { Reservation } from '../../entities/reservation.entity';
import { AutomationRule } from '../../entities/automation-rule.entity';
import { AutomationCondition } from '../../entities/automation-condition.entity';
import { AutomationAction } from '../../entities/automation-action.entity';
import { AutomationAuditLog } from '../../entities/automation-audit-log.entity';
import { LogEntry } from '../../entities/log-entry.entity';
import { LogSettings } from '../../entities/log-settings.entity';
import { AgentProfile } from '../../entities/agent-profile.entity';
import { AgentPermission } from '../../entities/agent-permission.entity';
import { AgentApiKey } from '../../entities/agent-api-key.entity';
import { ConfigurationSetting } from '../../entities/configuration-setting.entity';
import { NotificationMessage } from '../../entities/notification-message.entity';
import { NotificationDelivery } from '../../entities/notification-delivery.entity';
import { UserNotificationPreference } from '../../entities/user-notification-preference.entity';
import { PushDeviceToken } from '../../entities/push-device-token.entity';
import { NotificationThread } from '../../entities/notification-thread.entity';
import { NotificationThreadState } from '../../entities/notification-thread-state.entity';
import { NotificationInboxRule } from '../../entities/notification-inbox-rule.entity';
import { NotificationScopeMute } from '../../entities/notification-scope-mute.entity';
import { RefreshToken } from '../../entities/refresh-token.entity';
import { IdempotencyRecord } from '../../entities/idempotency-record.entity';
import { getPoolConfigFromEnv, getPoolOptionsForEngine } from './database.connection-pool';
import type {
  DatabaseConfigFactoryResult,
  DatabaseEngine,
  DatabaseRuntimeConfig,
  DatabaseSslConfig,
} from './database.types';

const dbLogger = new Logger('DatabaseConnection');

/**
 * Resolve a boolean environment value.
 */
const parseBoolean = (
  value: string | undefined,
  fallback: boolean,
): boolean => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  return value === 'true';
};

/**
 * Resolve a numeric environment value.
 */
const parseNumber = (
  value: string | undefined,
  fallback: number,
): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Return the canonical database engine based on DB_TYPE.
 */
const resolveDatabaseEngine = (
  env: NodeJS.ProcessEnv,
): DatabaseEngine => {
  if (env.DB_TYPE === 'postgres') return 'postgres';
  if (env.DB_TYPE === 'mssql') return 'mssql';
  return 'sqlite';
};

/**
 * List all TypeORM entities registered by the application.
 */
export const getDatabaseEntities = (): DataSourceOptions['entities'] => [
  User,
  Calendar,
  CalendarShare,
  Event,
  EventComment,
  Task,
  TaskLabel,
  CalendarSyncConnection,
  SyncedCalendar,
  SyncEventMapping,
  CalendarGroup,
  Organisation,
  OrganisationAdmin,
  OrganisationUser,
  OrganisationResourceTypePermission,
  OrganisationCalendarPermission,
  ReservationCalendar,
  ReservationCalendarRole,
  ResourceType,
  Resource,
  OperatingHours,
  Reservation,
  AutomationRule,
  AutomationCondition,
  AutomationAction,
  AutomationAuditLog,
  LogEntry,
  LogSettings,
  AgentProfile,
  AgentPermission,
  AgentApiKey,
  ConfigurationSetting,
  NotificationMessage,
  NotificationDelivery,
  UserNotificationPreference,
  PushDeviceToken,
  NotificationThread,
  NotificationThreadState,
  NotificationInboxRule,
  NotificationScopeMute,
  RefreshToken,
  IdempotencyRecord,
];

/**
 * Build runtime configuration for diagnostics and logging.
 */
const buildRuntimeConfig = (
  engine: DatabaseEngine,
  env: NodeJS.ProcessEnv,
): DatabaseRuntimeConfig => {
  const pool = getPoolConfigFromEnv(env);
  const logging =
    env.NODE_ENV === 'development' || env.DB_LOGGING === 'true';

  if (engine === 'sqlite') {
    return {
      type: 'sqlite',
      sqliteFile: env.DB_DATABASE || 'cal3.db',
      pool,
      synchronize: true,
      logging,
    };
  }

  const ssl: DatabaseSslConfig = {
    enabled: parseBoolean(env.DB_SSL, false),
    rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
  };

  return {
    type: engine,
    host: env.DB_HOST || 'localhost',
    port: parseNumber(env.DB_PORT, 5432),
    username: env.DB_USERNAME || env.DB_USER || 'postgres',
    password: env.DB_PASSWORD,
    database: env.DB_NAME || 'cal3',
    ssl,
    pool,
    synchronize: env.DB_SYNCHRONIZE === 'true',
    logging,
  };
};

/**
 * Log the resolved configuration for troubleshooting.
 */
const logDatabaseConfig = (runtime: DatabaseRuntimeConfig): void => {
  dbLogger.log('========================================');
  dbLogger.log('Database Connection Configuration');
  dbLogger.log('========================================');

  if (runtime.type === 'sqlite') {
    dbLogger.log('Using SQLite database');
    dbLogger.log(`Database File: ${runtime.sqliteFile}`);
    dbLogger.log('========================================');
    return;
  }

  const sslEnabled = runtime.ssl?.enabled ?? false;
  const sslRejectUnauthorized = runtime.ssl?.rejectUnauthorized ?? true;
  const connectionTimeout = runtime.pool.connectionTimeoutMillis;

  const label =
    runtime.type === 'mssql' ? 'Azure SQL (MSSQL)' : 'PostgreSQL';

  dbLogger.log(`${label} Connection Configuration`);
  dbLogger.log(`Host: ${runtime.host}`);
  dbLogger.log(`Port: ${runtime.port}`);
  dbLogger.log(`Database: ${runtime.database}`);
  dbLogger.log(`Username: ${runtime.username}`);
  dbLogger.log(
    `Password: ${
      runtime.password
        ? `[SET - ${runtime.password.length} chars]`
        : '[NOT SET]'
    }`,
  );
  dbLogger.log(`SSL Enabled: ${sslEnabled}`);
  dbLogger.log(`SSL Reject Unauthorized: ${sslRejectUnauthorized}`);
  dbLogger.log(`Connection Timeout: ${connectionTimeout}ms`);
  dbLogger.log(`Pool Max: ${runtime.pool.max}`);
  dbLogger.log(`Pool Min: ${runtime.pool.min}`);
  dbLogger.log(
    `Connection String: ${runtime.type}://${runtime.username}:***@${runtime.host}:${runtime.port}/${runtime.database}`,
  );
  dbLogger.log('========================================');

  if (runtime.type === 'postgres') {
    dbLogger.log('Attempting to connect to PostgreSQL...');
    process.nextTick(() => {
      dbLogger.log(
        `Connection attempt started at ${new Date().toISOString()}`,
      );
    });
  }

  if (runtime.host?.includes('azure.com') || runtime.host?.includes('amazonaws.com')) {
    dbLogger.warn('WARNING: Detected cloud database provider');
    dbLogger.warn('WARNING: Ensure firewall rules allow connections from this IP');
  }
  if (connectionTimeout < 30000) {
    dbLogger.warn(
      `WARNING: Connection timeout (${connectionTimeout}ms) may be too short for cloud databases`,
    );
    dbLogger.warn('WARNING: Recommended: 60000ms (60 seconds) for Azure/AWS');
  }
};

/**
 * Build TypeORM options based on environment configuration.
 */
export const createDatabaseConfig = (
  env: NodeJS.ProcessEnv = process.env,
): DatabaseConfigFactoryResult => {
  const engine = resolveDatabaseEngine(env);
  const runtime = buildRuntimeConfig(engine, env);
  const entities = getDatabaseEntities();
  const poolOptions = getPoolOptionsForEngine(runtime.type, runtime.pool);

  logDatabaseConfig(runtime);

  if (runtime.type === 'sqlite') {
    return {
      runtime,
      options: {
        type: 'sqlite',
        database: runtime.sqliteFile,
        entities,
        synchronize: true,
        logging: runtime.logging,
      },
    };
  }

  if (runtime.type === 'mssql') {
    const sslEnabled = runtime.ssl?.enabled ?? false;
    const sslRejectUnauthorized = runtime.ssl?.rejectUnauthorized ?? true;
    const synchronize = runtime.synchronize;

    if (!synchronize && env.NODE_ENV === 'development') {
      dbLogger.warn(
        'DB_SYNCHRONIZE is disabled for MSSQL in development. Enable it only for disposable databases.',
      );
    }

    return {
      runtime,
      options: {
        type: 'mssql',
        host: runtime.host,
        port: runtime.port,
        username: runtime.username,
        password: runtime.password,
        database: runtime.database,
        entities,
        logging: runtime.logging,
        synchronize,
        options: {
          encrypt: sslEnabled,
          trustServerCertificate: !sslRejectUnauthorized,
          enableArithAbort: true,
        },
        ...poolOptions,
      } as DataSourceOptions,
    };
  }

  const sslEnabled = runtime.ssl?.enabled ?? false;
  const sslRejectUnauthorized = runtime.ssl?.rejectUnauthorized ?? true;
  const synchronize = runtime.synchronize;

  if (!synchronize && env.NODE_ENV === 'development') {
    dbLogger.warn(
      'DB_SYNCHRONIZE is disabled for PostgreSQL in development. Enable it only for disposable databases.',
    );
  }

  return {
    runtime,
    options: {
      type: 'postgres',
      host: runtime.host,
      port: runtime.port,
      username: runtime.username,
      password: runtime.password,
      database: runtime.database,
      entities,
      ssl: sslEnabled ? { rejectUnauthorized: sslRejectUnauthorized } : false,
      logging: runtime.logging,
      logger: 'advanced-console',
      synchronize,
      ...poolOptions,
    } as DataSourceOptions,
  };
};

/**
 * Factory for NestJS TypeORM initialization.
 */
export const createTypeOrmOptions = (
  env: NodeJS.ProcessEnv = process.env,
): DataSourceOptions => createDatabaseConfig(env).options;
