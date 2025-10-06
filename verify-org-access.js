const { Client } = require('pg');

const client = new Client({
  host: 'cal2db.postgres.database.azure.com',
  port: 5432,
  database: 'cal3',
  user: 'db_admin',
  password: 'Enter.Enter',
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    console.log('=== ADMIN USER INFO ===');
    const adminUser = await client.query(
      'SELECT id, username, email, role FROM users WHERE username = $1',
      ['admin']
    );
    console.log(adminUser.rows[0]);

    console.log('\n=== ORGANIZATIONS ===');
    const orgs = await client.query('SELECT * FROM organisations');
    console.log(orgs.rows);

    console.log('\n=== ADMIN USER ORGANIZATION ASSIGNMENTS ===');
    const orgAssignments = await client.query(`
      SELECT
        ou.id,
        ou."organisationId",
        o.name as organization_name,
        ou.role,
        ou."isOrganisationAdmin",
        ou."assignedAt"
      FROM organisation_users ou
      JOIN organisations o ON o.id = ou."organisationId"
      WHERE ou."userId" = 1
    `);

    if (orgAssignments.rows.length > 0) {
      console.log('✅ Admin user IS assigned to organizations:');
      console.log(orgAssignments.rows);
    } else {
      console.log('❌ Admin user is NOT assigned to any organizations');
    }

    console.log('\n=== ADMIN USER ADMIN ROLE ===');
    const adminRoles = await client.query(`
      SELECT
        oa.id,
        oa."organisationId",
        o.name as organization_name,
        oa."assignedAt"
      FROM organisation_admins oa
      JOIN organisations o ON o.id = oa."organisationId"
      WHERE oa."userId" = 1
    `);

    if (adminRoles.rows.length > 0) {
      console.log('✅ Admin user has organization admin role:');
      console.log(adminRoles.rows);
    } else {
      console.log('❌ Admin user does NOT have organization admin role');
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Admin user is assigned to ${orgAssignments.rows.length} organization(s)`);
    console.log(`Admin user has admin role in ${adminRoles.rows.length} organization(s)`);

    if (orgAssignments.rows.length > 0) {
      console.log('\n✅ SUCCESS: Admin user should now be able to see organizations in the Reservations page!');
    } else {
      console.log('\n❌ ISSUE: Admin user still cannot access organizations');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
})();
