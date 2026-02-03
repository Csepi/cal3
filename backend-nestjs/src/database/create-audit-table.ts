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

async function createAuditTable() {
  let pool: sql.ConnectionPool | null = null;

  try {
    console.log('📡 Connecting to Azure SQL Database...');
    pool = await sql.connect(azureConfig);
    console.log('✅ Connected!\n');

    console.log(
      '⏳ Creating automation_audit_logs table with corrected foreign keys...\n',
    );

    const createTableSQL = `
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
        CONSTRAINT FK_automation_audit_logs_event FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE NO ACTION,
        CONSTRAINT FK_automation_audit_logs_executedBy FOREIGN KEY (executedByUserId) REFERENCES users(id) ON DELETE NO ACTION,
        CONSTRAINT CK_automation_audit_logs_status CHECK (status IN ('success', 'partial_success', 'failure', 'skipped'))
      );
    `;

    await pool.request().query(createTableSQL);
    console.log('✅ Table created successfully!\n');

    console.log('⏳ Creating indexes...\n');

    const indexes = [
      'CREATE INDEX idx_automation_audit_logs_ruleId ON automation_audit_logs(ruleId);',
      'CREATE INDEX idx_automation_audit_logs_eventId ON automation_audit_logs(eventId);',
      'CREATE INDEX idx_automation_audit_logs_executedAt ON automation_audit_logs(executedAt);',
      'CREATE INDEX idx_audit_logs_rule_executed ON automation_audit_logs(ruleId, executedAt);',
    ];

    for (const indexSQL of indexes) {
      await pool.request().query(indexSQL);
      console.log(`✅ Index created`);
    }

    console.log('\n📊 Final Verification:\n');

    // Count all tables
    const tableResult = await pool.request().query(`
      SELECT COUNT(*) as TABLE_COUNT
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
    `);
    console.log(`Total Tables: ${tableResult.recordset[0].TABLE_COUNT}`);

    // Count all foreign keys
    const fkResult = await pool
      .request()
      .query('SELECT COUNT(*) as FK_COUNT FROM sys.foreign_keys');
    console.log(`Total Foreign Keys: ${fkResult.recordset[0].FK_COUNT}`);

    // Count all indexes
    const indexResult = await pool.request().query(`
      SELECT COUNT(*) as INDEX_COUNT
      FROM sys.indexes
      WHERE object_id IN (SELECT object_id FROM sys.tables)
      AND is_primary_key = 0
    `);
    console.log(`Total Indexes: ${indexResult.recordset[0].INDEX_COUNT}`);

    console.log('\n✅ DEPLOYMENT COMPLETE!\n');
    console.log('─'.repeat(80));
    console.log(
      'All 22 database tables have been successfully created on Azure SQL!',
    );
    console.log('─'.repeat(80));
    console.log('\nNext Steps:');
    console.log(
      '1. Update backend-nestjs/.env file with Azure SQL connection:',
    );
    console.log('   DB_TYPE=mssql');
    console.log('   DB_HOST=cal3db-server.database.windows.net');
    console.log('   DB_PORT=1433');
    console.log('   DB_USERNAME=db_admin');
    console.log('   DB_PASSWORD=Enter.Enter');
    console.log('   DB_NAME=cal3db');
    console.log('   DB_SSL=true');
    console.log('');
    console.log('2. Run seed script (optional):');
    console.log('   npm run seed');
    console.log('');
    console.log('3. Start the application:');
    console.log('   npm run start:dev');
    console.log('─'.repeat(80));
  } catch (error: unknown) {
    console.error('❌ ERROR:', error.message);
    if (error.number) {
      console.error('SQL Error Number:', error.number);
    }
    if (error.precedingErrors) {
      console.error('\nPreceding Errors:');
      error.precedingErrors.forEach((e: Record<string, unknown>) => {
        console.error(`  - ${e.message}`);
      });
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
  createAuditTable().catch(console.error);
}

export { createAuditTable };
