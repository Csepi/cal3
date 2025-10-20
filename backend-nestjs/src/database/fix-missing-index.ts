import * as sql from 'mssql';

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
};

async function fixMissingIndex() {
  let pool: sql.ConnectionPool | null = null;

  try {
    console.log('📡 Connecting to Azure SQL Database...');
    pool = await sql.connect(azureConfig);
    console.log('✅ Connected!\n');

    // First, check if automation_audit_logs table exists
    const tableCheck = await pool.request().query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME = 'automation_audit_logs'
    `);

    if (tableCheck.recordset.length === 0) {
      console.log('⚠️  automation_audit_logs table does not exist. Creating it first...\n');

      const createTable = `
        CREATE TABLE automation_audit_logs (
          id INT IDENTITY(1,1) PRIMARY KEY,
          ruleId INT NOT NULL,
          eventId INT NULL,
          triggerType NVARCHAR(50) NOT NULL,
          triggerContext NVARCHAR(MAX) NULL,
          conditionsResult NVARCHAR(MAX) NOT NULL,
          actionResults NVARCHAR(MAX) NULL,
          status NVARCHAR(20) NOT NULL,
          errorMessage NVARCHAR(MAX) NULL,
          duration_ms INT NOT NULL DEFAULT 0,
          executedByUserId INT NULL,
          executedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
          CONSTRAINT FK_automation_audit_logs_rule FOREIGN KEY (ruleId) REFERENCES automation_rules(id) ON DELETE CASCADE,
          CONSTRAINT FK_automation_audit_logs_event FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE SET NULL,
          CONSTRAINT FK_automation_audit_logs_executedBy FOREIGN KEY (executedByUserId) REFERENCES users(id) ON DELETE SET NULL,
          CONSTRAINT CK_automation_audit_logs_status CHECK (status IN ('success', 'partial_success', 'failure', 'skipped'))
        );
      `;

      await pool.request().query(createTable);
      console.log('✅ automation_audit_logs table created\n');
    } else {
      console.log('✅ automation_audit_logs table exists\n');
    }

    // Check existing indexes
    const indexCheck = await pool.request().query(`
      SELECT
        i.name as INDEX_NAME,
        c.name as COLUMN_NAME
      FROM sys.indexes i
      INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
      INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
      WHERE i.object_id = OBJECT_ID('automation_audit_logs')
      ORDER BY i.name, ic.index_column_id
    `);

    console.log('📊 Existing Indexes on automation_audit_logs:');
    console.log('─'.repeat(80));
    if (indexCheck.recordset.length === 0) {
      console.log('  (none)');
    } else {
      indexCheck.recordset.forEach((row: any) => {
        console.log(`  ${row.INDEX_NAME}: ${row.COLUMN_NAME}`);
      });
    }
    console.log('─'.repeat(80) + '\n');

    // Create missing indexes one by one
    const indexes = [
      { name: 'idx_automation_audit_logs_ruleId', columns: 'ruleId' },
      { name: 'idx_automation_audit_logs_eventId', columns: 'eventId' },
      { name: 'idx_automation_audit_logs_executedAt', columns: 'executedAt' },
      { name: 'idx_audit_logs_rule_executed', columns: 'ruleId, executedAt' },
    ];

    for (const index of indexes) {
      try {
        console.log(`⏳ Creating index ${index.name}...`);
        await pool.request().query(`
          CREATE INDEX ${index.name} ON automation_audit_logs(${index.columns})
        `);
        console.log(`✅ Index ${index.name} created`);
      } catch (error: any) {
        if (error.message.includes('already an object')) {
          console.log(`ℹ️  Index ${index.name} already exists`);
        } else {
          console.error(`❌ Error creating ${index.name}: ${error.message}`);
        }
      }
    }

    console.log('\n✅ All indexes verified/created!\n');

    // Final verification
    const finalCheck = await pool.request().query(`
      SELECT TABLE_NAME,
             (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = t.TABLE_NAME) as COLUMN_COUNT
      FROM INFORMATION_SCHEMA.TABLES t
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);

    console.log('📊 Final Database Status:');
    console.log('─'.repeat(80));
    console.log(`Total Tables: ${finalCheck.recordset.length}`);

    const fkResult = await pool.request().query('SELECT COUNT(*) as FK_COUNT FROM sys.foreign_keys');
    console.log(`Total Foreign Keys: ${fkResult.recordset[0].FK_COUNT}`);

    const indexResult = await pool.request().query(`
      SELECT COUNT(*) as INDEX_COUNT
      FROM sys.indexes
      WHERE object_id IN (SELECT object_id FROM sys.tables)
      AND is_primary_key = 0
    `);
    console.log(`Total Indexes: ${indexResult.recordset[0].INDEX_COUNT}`);
    console.log('─'.repeat(80));

  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
      console.log('\n📡 Database connection closed.');
    }
  }
}

if (require.main === module) {
  fixMissingIndex().catch(console.error);
}

export { fixMissingIndex };
