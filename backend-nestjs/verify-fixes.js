const { Client } = require('pg');

async function verifyFixes() {
  const client = new Client({
    connectionString: 'postgresql://postgres:password@localhost:5432/calendar_db'
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check 1: Verify admin user is assigned to org #11
    console.log('🔍 Checking if admin user is assigned to organisation #11...');
    const orgUserCheck = await client.query(
      'SELECT * FROM organisation_users WHERE "organisationId" = 11 AND "userId" = 1'
    );
    if (orgUserCheck.rows.length > 0) {
      console.log('✅ Admin user (ID: 1) is assigned to organisation #11 with role:', orgUserCheck.rows[0].role);
    } else {
      console.log('❌ Admin user is NOT assigned to organisation #11');
    }

    // Check 2: Verify organisation #11 exists
    console.log('\n🔍 Checking if organisation #11 exists...');
    const orgCheck = await client.query('SELECT * FROM organisations WHERE id = 11');
    if (orgCheck.rows.length > 0) {
      console.log('✅ Organisation #11 exists:', orgCheck.rows[0].name);
    } else {
      console.log('❌ Organisation #11 does NOT exist');
    }

    // Check 3: Verify all reservation tables are empty
    console.log('\n🔍 Checking reservation-related tables are empty...');
    const tables = [
      'reservations',
      'resources',
      'resource_types',
      'operating_hours'
    ];

    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
      const count = parseInt(result.rows[0].count);
      if (count === 0) {
        console.log(`✅ ${table}: empty`);
      } else {
        console.log(`⚠️  ${table}: ${count} rows`);
      }
    }

    console.log('\n✅ All verifications complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

verifyFixes();
