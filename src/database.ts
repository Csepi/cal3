import { Pool } from 'pg';

// Database configuration
const pool = new Pool({
    host: 'cal2db.postgres.database.azure.com',
    port: 5432,
    database: 'postgres', // Default database name
    user: 'db_admin',
    password: process.env.DB_PASSWORD || '', // Will be set via environment variable
    ssl: {
        rejectUnauthorized: false // Required for Azure PostgreSQL
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test database connection
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

// Initialize database schema
export const initializeDatabase = async (): Promise<void> => {
    const client = await pool.connect();
    try {
        // Create events table if it doesn't exist
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