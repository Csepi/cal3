import * as sql from 'mssql';

const asString = (value: unknown): string => String(value ?? '');
const asNumber = (value: unknown): number =>
  typeof value === 'number' ? value : Number(value ?? 0);

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

async function checkDatabase(): Promise<void> {
  let pool: sql.ConnectionPool | null = null;

  try {
    console.log('Connecting to Azure SQL Database...\n');
    pool = await sql.connect(azureConfig);
    console.log('Connected successfully!\n');

    // Check existing tables
    const tableQuery = `
      SELECT TABLE_NAME,
             (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = t.TABLE_NAME) as COLUMN_COUNT
      FROM INFORMATION_SCHEMA.TABLES t
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME;
    `;

    const result = await pool.request().query(tableQuery);

    console.log('Existing Tables:');
    console.log('-'.repeat(80));
    result.recordset.forEach((row: Record<string, unknown>, index: number) => {
      const tableName = asString(row.TABLE_NAME);
      const columnCount = asNumber(row.COLUMN_COUNT);
      console.log(
        `${(index + 1).toString().padStart(2, ' ')}. ${tableName.padEnd(40, ' ')} (${columnCount} columns)`,
      );
    });
    console.log('-'.repeat(80));
    console.log(`\nTotal Tables: ${result.recordset.length}\n`);

    // Check for recent errors
    const errorQuery = `
      SELECT TOP 10
        message,
        severity,
        state,
        error_number
      FROM sys.messages
      WHERE language_id = 1033
        AND error_number IN (1750, 1785, 2601, 2627)
      ORDER BY error_number;
    `;

    try {
      const errorResult = await pool.request().query(errorQuery);
      if (errorResult.recordset.length > 0) {
        console.log('Relevant Error Messages:');
        console.log('-'.repeat(80));
        errorResult.recordset.forEach((row: Record<string, unknown>) => {
          console.log(`Error ${asNumber(row.error_number)}: ${asString(row.message)}`);
        });
        console.log('-'.repeat(80) + '\n');
      }
    } catch {
      // Error query might fail, that's okay
    }

    // Check constraints
    const constraintQuery = `
      SELECT
        OBJECT_NAME(parent_object_id) as TABLE_NAME,
        name as CONSTRAINT_NAME,
        type_desc as CONSTRAINT_TYPE
      FROM sys.objects
      WHERE type_desc LIKE '%CONSTRAINT%'
      ORDER BY TABLE_NAME, CONSTRAINT_TYPE;
    `;

    const constraintResult = await pool.request().query(constraintQuery);
    console.log(`Total Constraints: ${constraintResult.recordset.length}\n`);
  } catch (error: unknown) {
    const errorRecord = error as { message?: string; number?: number };
    console.error('ERROR:', errorRecord.message ?? String(error));
    if (typeof errorRecord.number === 'number') {
      console.error('SQL Error Number:', errorRecord.number);
    }
  } finally {
    if (pool) {
      await pool.close();
      console.log('Database connection closed.');
    }
  }
}

if (require.main === module) {
  checkDatabase().catch(console.error);
}

export { checkDatabase };