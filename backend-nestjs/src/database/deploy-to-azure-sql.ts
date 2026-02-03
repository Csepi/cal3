import * as sql from 'mssql';
import * as fs from 'fs';
import * as path from 'path';

// Azure SQL connection configuration
const azureConfig: sql.config = {
  server: 'cal3db-server.database.windows.net',
  port: 1433,
  database: 'cal3db',
  user: 'db_admin',
  password: 'Enter.Enter',
  options: {
    encrypt: true, // Required for Azure
    trustServerCertificate: false,
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 30000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

async function deploySchema() {
  console.log('🚀 Starting Azure SQL Database Schema Deployment\n');
  console.log('Target: cal3db-server.database.windows.net');
  console.log('Database: cal3db');
  console.log('User: db_admin\n');

  let pool: sql.ConnectionPool | null = null;

  try {
    // Connect to Azure SQL
    console.log('📡 Connecting to Azure SQL Database...');
    pool = await sql.connect(azureConfig);
    console.log('✅ Connected successfully!\n');

    // Read SQL schema file
    const schemaFilePath = path.join(
      __dirname,
      '..',
      '..',
      'azure-sql-schema.sql',
    );
    console.log(`📄 Reading schema file: ${schemaFilePath}`);

    if (!fs.existsSync(schemaFilePath)) {
      throw new Error(`Schema file not found: ${schemaFilePath}`);
    }

    const sqlScript = fs.readFileSync(schemaFilePath, 'utf-8');
    console.log(`✅ Schema file loaded (${sqlScript.length} characters)\n`);

    console.log(`📦 Executing schema in 1 batch...\n`);
    console.log('─'.repeat(80));

    // Execute the main transaction
    const request = pool.request();
    await request.query(sqlScript);

    console.log('✅ Schema deployment completed successfully!\n');

    // Verify table creation
    console.log('🔍 Verifying table creation...\n');
    const tableCheckQuery = `
      SELECT
        TABLE_NAME,
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = t.TABLE_NAME) as COLUMN_COUNT
      FROM INFORMATION_SCHEMA.TABLES t
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME;
    `;

    const result = await pool.request().query(tableCheckQuery);

    console.log('📊 Created Tables:');
    console.log('─'.repeat(80));
    result.recordset.forEach((row: Record<string, unknown>, index: number) => {
      console.log(
        `${(index + 1).toString().padStart(2, ' ')}. ${row.TABLE_NAME.padEnd(40, ' ')} (${row.COLUMN_COUNT} columns)`,
      );
    });
    console.log('─'.repeat(80));
    console.log(`\nTotal Tables: ${result.recordset.length}\n`);

    // Check indexes
    const indexCheckQuery = `
      SELECT COUNT(*) as INDEX_COUNT
      FROM sys.indexes
      WHERE object_id IN (SELECT object_id FROM sys.tables)
      AND is_primary_key = 0;
    `;

    const indexResult = await pool.request().query(indexCheckQuery);
    console.log(
      `📈 Total Indexes Created: ${indexResult.recordset[0].INDEX_COUNT}\n`,
    );

    // Check foreign keys
    const fkCheckQuery = `
      SELECT COUNT(*) as FK_COUNT
      FROM sys.foreign_keys;
    `;

    const fkResult = await pool.request().query(fkCheckQuery);
    console.log(`🔗 Total Foreign Keys: ${fkResult.recordset[0].FK_COUNT}\n`);

    console.log('─'.repeat(80));
    console.log('✅ DEPLOYMENT SUCCESSFUL!\n');
    console.log('Next Steps:');
    console.log('1. Update backend-nestjs/.env file:');
    console.log('   DB_TYPE=mssql');
    console.log('   DB_HOST=cal3db-server.database.windows.net');
    console.log('   DB_PORT=1433');
    console.log('   DB_USERNAME=db_admin');
    console.log('   DB_PASSWORD=Enter.Enter');
    console.log('   DB_NAME=cal3db');
    console.log('   DB_SSL=true');
    console.log('');
    console.log('2. Install mssql driver if not installed:');
    console.log('   npm install mssql');
    console.log('');
    console.log('3. Run seed script (optional):');
    console.log('   npm run seed');
    console.log('');
    console.log('4. Start the application:');
    console.log('   npm run start:dev');
    console.log('─'.repeat(80));
  } catch (error: unknown) {
    console.error('\n❌ ERROR during deployment:\n');
    console.error('Error Message:', error.message);

    if (error.code) {
      console.error('Error Code:', error.code);
    }

    if (error.number) {
      console.error('SQL Error Number:', error.number);
    }

    if (error.lineNumber) {
      console.error('Line Number:', error.lineNumber);
    }

    if (error.originalError) {
      console.error('Original Error:', error.originalError.message);
    }

    console.error('\nCommon Issues:');
    console.error(
      '1. Firewall: Ensure your IP is whitelisted in Azure SQL firewall rules',
    );
    console.error('2. Credentials: Verify username and password are correct');
    console.error('3. Database: Ensure database "cal3db" exists on the server');
    console.error(
      '4. Network: Check internet connection and Azure service availability',
    );

    throw error;
  } finally {
    // Close connection
    if (pool) {
      await pool.close();
      console.log('\n📡 Database connection closed.');
    }
  }
}

// Run deployment
if (require.main === module) {
  deploySchema()
    .then(() => {
      console.log('\n✅ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error.message);
      process.exit(1);
    });
}

export { deploySchema };
