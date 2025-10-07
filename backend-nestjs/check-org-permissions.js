const { Client } = require('pg');

async function checkOrgPermissions() {
  const client = new Client('postgresql://postgres:root@localhost:5432/cal3');

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Get admin user
    const userResult = await client.query(
      'SELECT id, username, role, "usagePlans" FROM "user" WHERE username = $1',
      ['admin']
    );
    console.log('Admin user:', JSON.stringify(userResult.rows, null, 2));

    if (userResult.rows.length === 0) {
      console.log('Admin user not found');
      return;
    }

    const adminUserId = userResult.rows[0].id;

    // Check organisation_users
    const orgUsersResult = await client.query(
      'SELECT ou.*, u.username FROM organisation_users ou JOIN "user" u ON ou."userId" = u.id WHERE ou."userId" = $1',
      [adminUserId]
    );
    console.log('\nOrganisation users roles:', JSON.stringify(orgUsersResult.rows, null, 2));

    // Check organisation_admins
    const orgAdminsResult = await client.query(
      'SELECT oa.*, u.username FROM organisation_admins oa JOIN "user" u ON oa."userId" = u.id WHERE oa."userId" = $1',
      [adminUserId]
    );
    console.log('\nOrganisation admin roles:', JSON.stringify(orgAdminsResult.rows, null, 2));

    // Check all organizations
    const orgsResult = await client.query('SELECT id, name FROM organisation');
    console.log('\nAll organizations:', JSON.stringify(orgsResult.rows, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkOrgPermissions();
