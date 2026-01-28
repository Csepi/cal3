import { Pool, type PoolConfig } from 'pg';

/**
 * Build a PostgreSQL pool configuration from environment variables.
 */
const buildPoolConfig = (env: NodeJS.ProcessEnv = process.env): PoolConfig => ({
  host: env.DB_HOST || 'cal2db.postgres.database.azure.com',
  port: parseInt(env.DB_PORT || '5432', 10),
  database: env.DB_NAME || 'postgres',
  user: env.DB_USER || 'db_admin',
  password: env.DB_PASSWORD || '',
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Log the resolved connection configuration without exposing secrets.
 */
const logDatabaseConfig = (config: PoolConfig): void => {
  console.log('🔐 Database connection config:', {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    passwordConfigured: !!config.password,
  });
};

const config = buildPoolConfig();
logDatabaseConfig(config);

const pool = new Pool(config);

/**
 * Verify the database is reachable.
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

/**
 * Initialize the schema for the lightweight events table used by the legacy API.
 */
export const initializeDatabase = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query(`
            CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                date DATE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

    console.log('✅ Database schema initialized');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
};

export default pool;
