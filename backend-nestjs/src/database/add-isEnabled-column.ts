import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function addIsEnabledColumn() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || '192.168.1.101',
    port: parseInt(process.env.DB_PORT || '5433'),
    username: process.env.DB_USERNAME || 'db_admin',
    password: process.env.DB_PASSWORD || 'Enter.Enter',
    database: process.env.DB_NAME || 'cal3',
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connection initialized');

    // Check if column exists
    const checkQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'automation_rules'
      AND column_name = 'isEnabled'
    `;

    const result = await dataSource.query(checkQuery);

    if (result.length > 0) {
      console.log(
        '✅ Column "isEnabled" already exists in automation_rules table',
      );
    } else {
      console.log('➕ Adding "isEnabled" column to automation_rules table...');

      // Add the column with default value true
      await dataSource.query(`
        ALTER TABLE automation_rules
        ADD COLUMN "isEnabled" boolean NOT NULL DEFAULT true
      `);

      console.log('✅ Successfully added "isEnabled" column');
    }

    await dataSource.destroy();
    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
}

addIsEnabledColumn();
