const { Client } = require('pg');
require('dotenv').config();

async function fixExistingOrganization() {
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
    console.log('Connected to database\n');

    // Find organization #11
    const orgResult = await client.query('SELECT * FROM organisations WHERE id = 11');
    if (orgResult.rows.length === 0) {
      console.log('❌ Organization #11 not found');
      return;
    }

    const org = orgResult.rows[0];
    console.log(`✅ Found organization: #${org.id} - ${org.name}`);

    // Find admin users (users with role 'admin')
    const adminResult = await client.query("SELECT * FROM users WHERE role = 'admin' ORDER BY id LIMIT 1");
    if (adminResult.rows.length === 0) {
      console.log('❌ No admin user found');
      return;
    }

    const adminUser = adminResult.rows[0];
    console.log(`✅ Found admin user: #${adminUser.id} - ${adminUser.username}`);

    // Check if already assigned
    const existingResult = await client.query(
      'SELECT * FROM organisation_users WHERE "organisationId" = $1 AND "userId" = $2',
      [org.id, adminUser.id]
    );

    if (existingResult.rows.length > 0) {
      console.log(`\n✅ User #${adminUser.id} is already assigned to organization #${org.id} with role: ${existingResult.rows[0].role}`);
      return;
    }

    // Add admin user to organisation_users table as ORG_ADMIN
    const insertResult = await client.query(
      `INSERT INTO organisation_users ("organisationId", "userId", role, "assignedById", "assignedAt")
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [org.id, adminUser.id, 'admin', adminUser.id]
    );

    console.log(`\n✅ Successfully added user #${adminUser.id} to organization #${org.id} as ORG_ADMIN`);
    console.log('Assigned role:', insertResult.rows[0]);

    // Verify
    const verifyResult = await client.query(
      'SELECT * FROM organisation_users WHERE "organisationId" = $1',
      [org.id]
    );
    console.log(`\n📊 Organization #${org.id} now has ${verifyResult.rows.length} user(s)`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

fixExistingOrganization()
  .then(() => {
    console.log('\n✨ Fix completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fix failed:', error);
    process.exit(1);
  });
