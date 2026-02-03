import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const sslEnabled = process.env.DB_SSL === 'true';
const sslRejectUnauthorized =
  process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'cal3',
  ssl: sslEnabled ? { rejectUnauthorized: sslRejectUnauthorized } : false,
  entities: [path.join(__dirname, '..', 'entities', '*.entity.{ts,js}')],
  migrations: [
    path.join(__dirname, 'migrations', '*.ts'),
    path.join(__dirname, 'migrations', '*.js'),
  ],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
  logging: true,
});

const MIGRATION_TABLE = 'typeorm_migrations';

const getTimestampFromName = (name: string): number => {
  const match = name.match(/(\d{13})$/);
  if (!match) {
    throw new Error(`Cannot extract timestamp from migration name: ${name}`);
  }
  return Number(match[1]);
};

const ensureMigrationTable = async () => {
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS "${MIGRATION_TABLE}" (
      "id" SERIAL PRIMARY KEY,
      "timestamp" bigint NOT NULL,
      "name" character varying NOT NULL
    )
  `);
};

const calendarGroupsMissing = async (): Promise<boolean> => {
  const tableCheck = await dataSource.query(
    `SELECT to_regclass('public.calendar_groups') AS table_name`,
  );
  const tableExists = Boolean(tableCheck?.[0]?.table_name);
  if (!tableExists) {
    return true;
  }

  const columnCheck = await dataSource.query(`
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'calendars'
      AND column_name = 'groupId'
    LIMIT 1
  `);
  return columnCheck.length === 0;
};

const baselineMigrations = async (): Promise<void> => {
  await ensureMigrationTable();
  const existingRowsRaw = await dataSource.query(
    `SELECT name FROM "${MIGRATION_TABLE}"`,
  );
  const existingRows = Array.isArray(existingRowsRaw)
    ? (existingRowsRaw as Array<{ name?: string }>)
    : [];
  const existingNamesList: string[] = [];
  for (const row of existingRows) {
    if (typeof row.name === 'string') {
      existingNamesList.push(row.name);
    }
  }
  const existingNames = new Set<string>(existingNamesList);

  const skipCalendarGroups = await calendarGroupsMissing();
  const migrations = (
    dataSource.migrations as Array<
      { name?: string; constructor?: { name?: string } } | Function
    >
  )
    .map((migration) => {
      if (typeof migration === 'function') {
        return migration.name;
      }
      return migration.name ?? migration.constructor?.name;
    })
    .filter((name): name is string => Boolean(name))
    .sort((a, b) => getTimestampFromName(a) - getTimestampFromName(b));

  const targetNames = skipCalendarGroups
    ? migrations.filter((name) => !name.includes('CreateCalendarGroups'))
    : migrations;

  const toInsert = targetNames.filter((name) => !existingNames.has(name));

  if (toInsert.length === 0) {
    return;
  }

  for (const name of toInsert) {
    const timestamp = getTimestampFromName(name);
    await dataSource.query(
      `INSERT INTO "${MIGRATION_TABLE}" ("timestamp", "name") VALUES ($1, $2)`,
      [timestamp, name],
    );
  }

  console.log(
    `Baseline inserted for ${toInsert.length} migrations${skipCalendarGroups ? ' (skipped CreateCalendarGroups)' : ''}.`,
  );
};

async function runMigrations() {
  if (process.env.DB_TYPE && process.env.DB_TYPE !== 'postgres') {
    throw new Error(
      `DB_TYPE must be postgres to run migrations, got: ${process.env.DB_TYPE}`,
    );
  }

  await dataSource.initialize();
  console.log('Database connection initialized');

  if (process.env.MIGRATION_BASELINE === 'true') {
    await baselineMigrations();
  }

  const applied = await dataSource.runMigrations();
  if (applied.length === 0) {
    console.log('No pending migrations');
  } else {
    console.log('Applied migrations:');
    applied.forEach((migration) => console.log(`- ${migration.name}`));
  }

  await dataSource.destroy();
  console.log('Migration run completed');
}

runMigrations().catch(async (error) => {
  console.error('Migration run failed:', error);
  try {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  } catch {
    // Ignore cleanup errors
  }
  process.exit(1);
});
