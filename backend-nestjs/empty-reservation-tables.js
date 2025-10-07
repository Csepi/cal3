const { Client } = require('pg');
require('dotenv').config();

async function emptyReservationTables() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Delete in order of dependencies (child tables first)
    console.log('\n🗑️  Deleting reservations...');
    const reservationsResult = await client.query('DELETE FROM reservations RETURNING id');
    console.log(`✅ Deleted ${reservationsResult.rowCount} reservations`);

    console.log('\n🗑️  Deleting resources...');
    const resourcesResult = await client.query('DELETE FROM resources RETURNING id');
    console.log(`✅ Deleted ${resourcesResult.rowCount} resources`);

    console.log('\n🗑️  Deleting operating hours...');
    const operatingHoursResult = await client.query('DELETE FROM operating_hours RETURNING id');
    console.log(`✅ Deleted ${operatingHoursResult.rowCount} operating hours`);

    console.log('\n🗑️  Deleting resource types...');
    const resourceTypesResult = await client.query('DELETE FROM resource_types RETURNING id');
    console.log(`✅ Deleted ${resourceTypesResult.rowCount} resource types`);

    console.log('\n🗑️  Deleting organisation users...');
    const orgUsersResult = await client.query('DELETE FROM organisation_users RETURNING id');
    console.log(`✅ Deleted ${orgUsersResult.rowCount} organisation user assignments`);

    console.log('\n🗑️  Deleting organisation admins...');
    const orgAdminsResult = await client.query('DELETE FROM organisation_admins RETURNING id');
    console.log(`✅ Deleted ${orgAdminsResult.rowCount} organisation admin assignments`);

    console.log('\n🗑️  Deleting organisation resource type permissions...');
    const orgResourceTypePermsResult = await client.query('DELETE FROM organisation_resource_type_permissions RETURNING id');
    console.log(`✅ Deleted ${orgResourceTypePermsResult.rowCount} resource type permissions`);

    console.log('\n🗑️  Deleting organisations...');
    const organisationsResult = await client.query('DELETE FROM organisations RETURNING id');
    console.log(`✅ Deleted ${organisationsResult.rowCount} organisations`);

    // Verify tables are empty
    console.log('\n📊 Verifying tables are empty...');
    const checks = [
      { table: 'reservations', query: 'SELECT COUNT(*) FROM reservations' },
      { table: 'resources', query: 'SELECT COUNT(*) FROM resources' },
      { table: 'operating_hours', query: 'SELECT COUNT(*) FROM operating_hours' },
      { table: 'resource_types', query: 'SELECT COUNT(*) FROM resource_types' },
      { table: 'organisation_users', query: 'SELECT COUNT(*) FROM organisation_users' },
      { table: 'organisation_admins', query: 'SELECT COUNT(*) FROM organisation_admins' },
      { table: 'organisation_resource_type_permissions', query: 'SELECT COUNT(*) FROM organisation_resource_type_permissions' },
      { table: 'organisations', query: 'SELECT COUNT(*) FROM organisations' }
    ];

    for (const check of checks) {
      const result = await client.query(check.query);
      const count = parseInt(result.rows[0].count);
      console.log(`  ${check.table}: ${count} rows ${count === 0 ? '✅' : '❌'}`);
    }

    console.log('\n✅ All reservation-related tables have been emptied successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the function
emptyReservationTables()
  .then(() => {
    console.log('\n✨ Operation completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Operation failed:', error);
    process.exit(1);
  });