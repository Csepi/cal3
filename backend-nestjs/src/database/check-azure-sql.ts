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

async function checkDatabase() {
  let pool: sql.ConnectionPool | null = null;

  try {
    console.log('đź“ˇ Connecting to Azure SQL Database...\n');
    pool = await sql.connect(azureConfig);
    console.log('âś… Connected successfully!\n');

    // Check existing tables
    const tableQuery = `
      SELECT TABLE_NAME,
             (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = t.TABLE_NAME) as COLUMN_COUNT
      FROM INFORMATION_SCHEMA.TABLES t
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME;
    `;

    const result = await pool.request().query(tableQuery);

    console.log('đź“Š Existing Tables:');
    console.log('â”€'.repeat(80));
    result.recordset.forEach((row: any, index: number) => {
      console.log(
        `${(index + 1).toString().padStart(2, ' ')}. ${row.TABLE_NAME.padEnd(40, ' ')} (${row.COLUMN_COUNT} columns)`,
      );
    });
    console.log('â”€'.repeat(80));
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
        console.log('đź“‹ Relevant Error Messages:');
        console.log('â”€'.repeat(80));
        errorResult.recordset.forEach((row: any) => {
          console.log(`Error ${row.error_number}: ${row.message}`);
        });
        console.log('â”€'.repeat(80) + '\n');
      }
    } catch (e) {
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
    console.log(
      `đź”— Total Constraints: ${constraintResult.recordset.length}\n`,
    );
  } catch (error: any) {
    console.error('âťŚ ERROR:', error.message);
    if (error.number) {
      console.error('SQL Error Number:', error.number);
    }
  } finally {
    if (pool) {
      await pool.close();
      console.log('đź“ˇ Database connection closed.');
    }
  }
}

if (require.main === module) {
  checkDatabase().catch(console.error);
}

export { checkDatabase };
