const { DataSource } = require('typeorm');

const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'calendar_app_test',
  ssl: { rejectUnauthorized: false },
});

async function test() {
  await dataSource.initialize();

  // Check column
  const columns = await dataSource.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'publicBookingToken'
  `);

  console.log('Column check:', columns);

  // Get resources
  const resources = await dataSource.query(`
    SELECT id, name, "publicBookingToken"
    FROM resources
    LIMIT 3
  `);

  console.log('Resources:', resources);

  await dataSource.destroy();
}

test().catch(console.error);