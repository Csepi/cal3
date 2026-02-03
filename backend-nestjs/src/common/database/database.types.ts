import type { DataSourceOptions } from 'typeorm';

/**
 * Supported database engines for the application.
 */
export type DatabaseEngine = 'postgres' | 'sqlite' | 'mssql';

/**
 * Connection pool configuration shared across database providers.
 */
export interface DatabasePoolConfig {
  /**
   * Maximum number of connections in the pool.
   */
  max: number;
  /**
   * Minimum number of connections kept alive in the pool.
   */
  min: number;
  /**
   * How long an idle connection is kept in the pool.
   */
  idleTimeoutMillis: number;
  /**
   * How long to wait for a connection before timing out.
   */
  connectionTimeoutMillis: number;
}

/**
 * SSL/TLS configuration for database connections.
 */
export interface DatabaseSslConfig {
  /**
   * Whether SSL is enabled for the connection.
   */
  enabled: boolean;
  /**
   * Whether to reject self-signed or invalid certificates.
   */
  rejectUnauthorized: boolean;
}

/**
 * Common runtime database configuration resolved from environment variables.
 */
export interface DatabaseRuntimeBase {
  /**
   * Connection pool settings.
   */
  pool: DatabasePoolConfig;
  /**
   * Whether schema synchronization is enabled.
   */
  synchronize: boolean;
  /**
   * Whether SQL logging is enabled.
   */
  logging: boolean;
}

/**
 * Runtime configuration for SQLite connections.
 */
export interface SqliteRuntimeConfig extends DatabaseRuntimeBase {
  /**
   * Database engine in use.
   */
  type: 'sqlite';
  /**
   * SQLite database file path.
   */
  sqliteFile: string;
}

/**
 * Runtime configuration for server-based databases.
 */
export interface ServerRuntimeConfig extends DatabaseRuntimeBase {
  /**
   * Database engine in use.
   */
  type: 'postgres' | 'mssql';
  /**
   * Hostname for server-based databases.
   */
  host: string;
  /**
   * Port for server-based databases.
   */
  port: number;
  /**
   * Username for server-based databases.
   */
  username: string;
  /**
   * Password for server-based databases.
   */
  password?: string;
  /**
   * Database/schema name.
   */
  database: string;
  /**
   * SSL configuration if applicable.
   */
  ssl: DatabaseSslConfig;
}

/**
 * Runtime database configuration resolved from environment variables.
 */
export type DatabaseRuntimeConfig = SqliteRuntimeConfig | ServerRuntimeConfig;

/**
 * Combined output for building TypeORM data source options plus runtime metadata.
 */
export interface DatabaseConfigFactoryResult {
  /**
   * TypeORM data source options used to initialize the connection.
   */
  options: DataSourceOptions;
  /**
   * Normalized runtime config for diagnostics or logs.
   */
  runtime: DatabaseRuntimeConfig;
}

/**
 * Known database error categories used by the error handler utilities.
 */
export type DatabaseErrorType =
  | 'unique-violation'
  | 'foreign-key-violation'
  | 'not-null-violation'
  | 'connection'
  | 'timeout'
  | 'authentication'
  | 'ssl'
  | 'unknown';

/**
 * Normalized error details extracted from a database exception.
 */
export interface DatabaseErrorDetails {
  /**
   * Normalized error type.
   */
  type: DatabaseErrorType;
  /**
   * Human-friendly summary message.
   */
  message: string;
  /**
   * Database error code if available.
   */
  code?: string | number;
  /**
   * Original error instance for debugging.
   */
  originalError?: any;
}
