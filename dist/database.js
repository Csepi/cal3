"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = exports.testConnection = void 0;
const pg_1 = require("pg");
// Database configuration
const config = {
    host: process.env.DB_HOST || 'cal2db.postgres.database.azure.com',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'db_admin',
    password: process.env.DB_PASSWORD || '',
    ssl: {
        rejectUnauthorized: false
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};
console.log('🔐 Database connection config:', {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    passwordConfigured: !!config.password
});
const pool = new pg_1.Pool(config);
// Test database connection
const testConnection = async () => {
    try {
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        console.log('✅ Database connection successful');
        return true;
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
};
exports.testConnection = testConnection;
// Initialize database schema
const initializeDatabase = async () => {
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
    }
    catch (error) {
        console.error('❌ Error initializing database:', error);
        throw error;
    }
    finally {
        client.release();
    }
};
exports.initializeDatabase = initializeDatabase;
exports.default = pool;
//# sourceMappingURL=database.js.map