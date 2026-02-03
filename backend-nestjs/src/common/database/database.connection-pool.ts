import type { DatabaseEngine, DatabasePoolConfig } from './database.types';

const DEFAULT_POOL: DatabasePoolConfig = {
  max: 10,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

/**
 * Parse a numeric environment value with a fallback.
 */
const parseNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Resolve pool configuration from environment variables.
 *
 * Environment variables:
 * - DB_POOL_MAX
 * - DB_POOL_MIN
 * - DB_IDLE_TIMEOUT
 * - DB_CONNECTION_TIMEOUT
 */
export const getPoolConfigFromEnv = (
  env: NodeJS.ProcessEnv = process.env,
): DatabasePoolConfig => ({
  max: parseNumber(env.DB_POOL_MAX, DEFAULT_POOL.max),
  min: parseNumber(env.DB_POOL_MIN, DEFAULT_POOL.min),
  idleTimeoutMillis: parseNumber(
    env.DB_IDLE_TIMEOUT,
    DEFAULT_POOL.idleTimeoutMillis,
  ),
  connectionTimeoutMillis: parseNumber(
    env.DB_CONNECTION_TIMEOUT,
    DEFAULT_POOL.connectionTimeoutMillis,
  ),
});

/**
 * Map pool settings to driver-specific TypeORM options.
 */
export const getPoolOptionsForEngine = (
  engine: DatabaseEngine,
  pool: DatabasePoolConfig,
): Record<string, unknown> => {
  if (engine === 'postgres') {
    return {
      extra: {
        max: pool.max,
        min: pool.min,
        idleTimeoutMillis: pool.idleTimeoutMillis,
        connectionTimeoutMillis: pool.connectionTimeoutMillis,
      },
    };
  }

  if (engine === 'mssql') {
    return {
      pool: {
        max: pool.max,
        min: pool.min,
        idleTimeoutMillis: pool.idleTimeoutMillis,
      },
      connectionTimeout: pool.connectionTimeoutMillis,
    };
  }

  return {};
};
