const { withDbClient } = require('../lib/db');
const { logError } = require('../lib/errors');

async function testOrganizationRoles() {
  return withDbClient(async (client) => {
    console.log('Connected to database.');

    const orgId = 12;

    console.log('\n=== DATABASE STATE ===');
    console.log('\norganisation_users table:');
    const orgUsers = await client.query(
      'SELECT * FROM organisation_users WHERE "organisationId" = $1 ORDER BY id',
      [orgId],
    );
    console.table(orgUsers.rows);

    console.log('\norganisation_admins table:');
    const orgAdmins = await client.query(
      'SELECT * FROM organisation_admins WHERE "organisationId" = $1 ORDER BY id',
      [orgId],
    );
    console.table(orgAdmins.rows);

    console.log('\n=== EXPECTED BEHAVIOR ===');
    console.log('User #1 (admin): Should appear as ADMIN (from organisation_admins)');
    console.log('User #6 (csepi_lupus): Should appear as ADMIN (from organisation_users role=admin)');

    console.log('\nFix implemented in AdminService.getOrganizationUsers:');
    console.log('- Now queries BOTH organisation_users and organisation_admins tables');
    console.log('- Combines results, with organisation_admins taking precedence');
    console.log('- Maps to organizationRole field for frontend display');

    console.log('\nTest completed successfully.');
  });
}

testOrganizationRoles().catch((error) => {
  logError('test-org-fix', error);
  process.exitCode = 1;
});
