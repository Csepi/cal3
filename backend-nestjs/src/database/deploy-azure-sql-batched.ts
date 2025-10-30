import * as sql from 'mssql';
import * as fs from 'fs';
import * as path from 'path';

const azureConfig: sql.config = {
  server: 'cal3db-server.database.windows.net',
  port: 1433,
  database: 'cal3db',
  user: 'db_admin',
  password: 'Enter.Enter',
  options: {
    encrypt: true,
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

async function deploySchemaInBatches() {
  console.log('🚀 Starting Azure SQL Database Schema Deployment (Batched)\n');
  console.log('Target: cal3db-server.database.windows.net');
  console.log('Database: cal3db');
  console.log('User: db_admin\n');

  let pool: sql.ConnectionPool | null = null;

  try {
    console.log('📡 Connecting to Azure SQL Database...');
    pool = await sql.connect(azureConfig);
    console.log('✅ Connected successfully!\n');

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

    // Remove BEGIN TRANSACTION and COMMIT TRANSACTION
    const cleanedScript = sqlScript
      .replace(/^BEGIN TRANSACTION;/gm, '')
      .replace(/^COMMIT TRANSACTION;/gm, '')
      .replace(/^PRINT .*/gm, ''); // Remove PRINT statements

    // Split by table creation sections
    const tableBlocks = cleanedScript.split(/-- ={40,}/);

    console.log(`📦 Executing schema in ${tableBlocks.length} sections...\n`);
    console.log('─'.repeat(80));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < tableBlocks.length; i++) {
      const block = tableBlocks[i].trim();

      if (block.length === 0) continue;
      if (
        block.startsWith('Cal3 Calendar') ||
        block.startsWith('Schema Creation')
      )
        continue;

      // Extract table name from comment
      const tableNameMatch = block.match(/--\s*(\d+)\.\s*([A-Z_\s]+)TABLE/);
      const tableName = tableNameMatch
        ? tableNameMatch[2].trim()
        : `Section ${i}`;

      try {
        console.log(`⏳ Creating ${tableName}...`);

        // Execute this block
        await pool.request().query(block);

        console.log(`✅ ${tableName} created successfully`);
        successCount++;
      } catch (error: any) {
        console.error(`❌ Error creating ${tableName}:`);
        console.error(`   Message: ${error.message}`);
        if (error.number) {
          console.error(`   SQL Error Number: ${error.number}`);
        }
        if (error.lineNumber) {
          console.error(`   Line Number: ${error.lineNumber}`);
        }
        errorCount++;

        // Continue with other tables
      }
    }

    console.log('─'.repeat(80));
    console.log(`\n📊 Deployment Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}\n`);

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
    result.recordset.forEach((row: any, index: number) => {
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
    if (errorCount === 0) {
      console.log('✅ DEPLOYMENT SUCCESSFUL!\n');
    } else {
      console.log('⚠️  DEPLOYMENT COMPLETED WITH ERRORS\n');
    }
  } catch (error: any) {
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

    throw error;
  } finally {
    if (pool) {
      await pool.close();
      console.log('\n📡 Database connection closed.');
    }
  }
}

if (require.main === module) {
  deploySchemaInBatches()
    .then(() => {
      console.log('\n✅ Script completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error.message);
      process.exit(1);
    });
}

export { deploySchemaInBatches };
