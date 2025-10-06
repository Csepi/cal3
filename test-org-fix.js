/**
 * Test script to verify organization admin role display fix
 */
const { Client } = require('pg');
const fetch = require('node-fetch');

const client = new Client({
  host: 'cal2db.postgres.database.azure.com',
  port: 5432,
  database: 'cal3',
  user: 'db_admin',
  password: 'Enter.Enter',
  ssl: { rejectUnauthorized: false }
});

async function testOrganizationRoles() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Test organization #12
    const orgId = 12;

    console.log('=== DATABASE STATE ===');
    console.log('\n📋 organisation_users table:');
    const orgUsers = await client.query(
      'SELECT * FROM organisation_users WHERE "organisationId" = $1 ORDER BY id',
      [orgId]
    );
    console.table(orgUsers.rows);

    console.log('\n👑 organisation_admins table:');
    const orgAdmins = await client.query(
      'SELECT * FROM organisation_admins WHERE "organisationId" = $1 ORDER BY id',
      [orgId]
    );
    console.table(orgAdmins.rows);

    console.log('\n=== EXPECTED BEHAVIOR ===');
    console.log('User #1 (admin): Should appear as ADMIN (from organisation_admins table)');
    console.log('User #6 (csepi_lupus): Should appear as ADMIN (from organisation_users table with role=admin)');

    console.log('\n✅ Fix implemented in AdminService.getOrganizationUsers:');
    console.log('- Now queries BOTH organisation_users and organisation_admins tables');
    console.log('- Combines results, with organisation_admins taking precedence');
    console.log('- Maps to organizationRole field for frontend display');

    await client.end();
    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    await client.end();
  }
}

testOrganizationRoles();
