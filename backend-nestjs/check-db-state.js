const { Client } = require('pg');

async function checkDbState() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'calendar_db',
    user: 'postgres',
    password: 'password'
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check reservations count
    const resCount = await client.query('SELECT COUNT(*) FROM reservations');
    console.log('📊 Reservations:', resCount.rows[0].count);

    // Check organisations count
    const orgCount = await client.query('SELECT COUNT(*) FROM organisations');
    console.log('📊 Organisations:', orgCount.rows[0].count);

    // Check organisation_users count
    const orgUserCount = await client.query('SELECT COUNT(*) FROM organisation_users');
    console.log('📊 Organisation Users:', orgUserCount.rows[0].count);

    // Get organisation details with member counts
    const orgDetails = await client.query(`
      SELECT o.id, o.name, COUNT(ou.id) as member_count
      FROM organisations o
      LEFT JOIN organisation_users ou ON o.id = ou."organisationId"
      GROUP BY o.id, o.name
      ORDER BY o.id
    `);

    console.log('\n🏢 Organisation Details:');
    orgDetails.rows.forEach(o => {
      console.log(`  - ${o.name} (ID: ${o.id}): ${o.member_count} members`);
    });

    // Check if there are any reservations
    if (parseInt(resCount.rows[0].count) > 0) {
      const reservations = await client.query(`
        SELECT r.id, r."startTime", r."endTime", r.status, res.name as resource_name
        FROM reservations r
        LEFT JOIN resources res ON r."resourceId" = res.id
        ORDER BY r.id
      `);

      console.log('\n📅 Reservations Found:');
      reservations.rows.forEach(r => {
        console.log(`  - ID: ${r.id}, Resource: ${r.resource_name}, Status: ${r.status}, Start: ${r.startTime}`);
      });
    }

    // Check organisation_users for user ID 1
    const userOrgs = await client.query(`
      SELECT ou.*, o.name as org_name
      FROM organisation_users ou
      LEFT JOIN organisations o ON ou."organisationId" = o.id
      WHERE ou."userId" = 1
      ORDER BY ou."organisationId"
    `);

    console.log('\n👤 User ID 1 Organisation Memberships:');
    if (userOrgs.rows.length === 0) {
      console.log('  - No memberships found');
    } else {
      userOrgs.rows.forEach(ou => {
        console.log(`  - ${ou.org_name} (ID: ${ou.organisationId}): ${ou.role}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkDbState();
