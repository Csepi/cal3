import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const pgConfig = {
  host: '192.168.1.101',
  port: 5433,
  database: 'cal3',
  user: 'db_admin',
  password: 'Enter.Enter',
  ssl: false,
  connectionTimeoutMillis: 10000,
};

async function deployToPostgres() {
  console.log('đźš€ PostgreSQL Database Deployment\n');
  console.log('Target: 192.168.1.101:5433');
  console.log('Database: cal3');
  console.log('User: db_admin\n');

  const client = new Client(pgConfig);

  try {
    console.log('đź“ˇ Testing connection...');
    await client.connect();
    console.log('âś… Connected successfully!\n');

    // Test query
    const versionResult = await client.query('SELECT version()');
    console.log('đź“Š PostgreSQL Version:');
    console.log(versionResult.rows[0].version);
    console.log('\n' + 'â”€'.repeat(80) + '\n');

    // Check if database exists and has tables
    console.log('đź”Ť Checking existing database state...\n');
    const tableCheckQuery = `
      SELECT table_name,
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    const existingTables = await client.query(tableCheckQuery);

    if (existingTables.rows.length > 0) {
      console.log('âš ď¸Ź  Existing tables found:');
      console.log('â”€'.repeat(80));
      existingTables.rows.forEach((row: any, index: number) => {
        console.log(
          `${(index + 1).toString().padStart(2, ' ')}. ${row.table_name.padEnd(40, ' ')} (${row.column_count} columns)`,
        );
      });
      console.log('â”€'.repeat(80));
      console.log(`\nTotal Existing Tables: ${existingTables.rows.length}\n`);
      console.log(
        'âš ď¸Ź  Schema deployment will DROP and recreate all tables!\n',
      );
    } else {
      console.log('âś… Database is empty, ready for schema creation.\n');
    }

    // Read schema file
    const schemaFilePath = path.join(
      __dirname,
      '..',
      '..',
      'postgresql-schema.sql',
    );
    console.log(`đź“„ Reading schema file: ${schemaFilePath}`);

    if (!fs.existsSync(schemaFilePath)) {
      throw new Error(`Schema file not found: ${schemaFilePath}`);
    }

    const sqlScript = fs.readFileSync(schemaFilePath, 'utf-8');
    console.log(`âś… Schema file loaded (${sqlScript.length} characters)\n`);

    // Execute schema
    console.log('đź“¦ Executing schema...\n');
    console.log('â”€'.repeat(80));

    await client.query(sqlScript);

    console.log('âś… Schema executed successfully!');
    console.log('â”€'.repeat(80) + '\n');

    // Verify table creation
    console.log('đź”Ť Verifying table creation...\n');
    const verifyTablesQuery = `
      SELECT table_name,
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    const result = await client.query(verifyTablesQuery);

    console.log('đź“Š Created Tables:');
    console.log('â”€'.repeat(80));
    result.rows.forEach((row: any, index: number) => {
      console.log(
        `${(index + 1).toString().padStart(2, ' ')}. ${row.table_name.padEnd(40, ' ')} (${row.column_count} columns)`,
      );
    });
    console.log('â”€'.repeat(80));
    console.log(`\nTotal Tables: ${result.rows.length}\n`);

    // Check indexes
    const indexQuery = `
      SELECT COUNT(*) as index_count
      FROM pg_indexes
      WHERE schemaname = 'public';
    `;
    const indexResult = await client.query(indexQuery);
    console.log(`đź“ Total Indexes: ${indexResult.rows[0].index_count}\n`);

    // Check foreign keys
    const fkQuery = `
      SELECT COUNT(*) as fk_count
      FROM information_schema.table_constraints
      WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public';
    `;
    const fkResult = await client.query(fkQuery);
    console.log(`đź”— Total Foreign Keys: ${fkResult.rows[0].fk_count}\n`);

    console.log('â”€'.repeat(80));
    console.log('âś… DEPLOYMENT SUCCESSFUL!\n');
    console.log('Next Steps:');
    console.log('1. Create admin user using the create-admin-user script');
    console.log('2. Update backend-nestjs/.env file:');
    console.log('   DB_TYPE=postgres');
    console.log('   DB_HOST=192.168.1.101');
    console.log('   DB_PORT=5433');
    console.log('   DB_USERNAME=db_admin');
    console.log('   DB_PASSWORD=Enter.Enter');
    console.log('   DB_NAME=cal3');
    console.log('   DB_SSL=false');
    console.log('3. Start the application: npm run start:dev');
    console.log('â”€'.repeat(80));
  } catch (error: any) {
    console.error('\nâťŚ ERROR during deployment:\n');
    console.error('Error Message:', error.message);

    if (error.code) {
      console.error('Error Code:', error.code);
    }

    if (error.code === 'ECONNREFUSED') {
      console.error('\nđź’ˇ Connection refused. Possible issues:');
      console.error('   - PostgreSQL server is not running');
      console.error('   - Wrong host or port (192.168.1.101:5433)');
      console.error('   - Firewall blocking connection');
      console.error(
        '   - PostgreSQL not configured to accept remote connections',
      );
    }

    if (error.code === 'ETIMEDOUT') {
      console.error('\nđź’ˇ Connection timeout. Possible issues:');
      console.error('   - Host is unreachable (check network)');
      console.error('   - Firewall blocking port 5433');
      console.error('   - PostgreSQL not listening on 192.168.1.101:5433');
    }

    if (error.code === '28P01') {
      console.error('\nđź’ˇ Authentication failed. Check username/password.');
    }

    if (error.code === '3D000') {
      console.error('\nđź’ˇ Database "cal3" does not exist. Create it first:');
      console.error('   CREATE DATABASE cal3;');
    }

    throw error;
  } finally {
    await client.end();
    console.log('\nđź“ˇ Database connection closed.');
  }
}

if (require.main === module) {
  deployToPostgres()
    .then(() => {
      console.log('\nâś… Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nâťŚ Script failed:', error.message);
      process.exit(1);
    });
}

export { deployToPostgres };
