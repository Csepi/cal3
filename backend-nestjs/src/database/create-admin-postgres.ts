import { Client } from 'pg';
import * as bcrypt from 'bcryptjs';

const pgConfig = {
  host: '192.168.1.101',
  port: 5433,
  database: 'cal3',
  user: 'db_admin',
  password: 'Enter.Enter',
  ssl: false,
  connectionTimeoutMillis: 10000,
};

async function createAdminUser() {
  console.log('🚀 Creating Admin User on PostgreSQL\n');
  console.log('Target: 192.168.1.101:5433');
  console.log('Database: cal3\n');

  const client = new Client(pgConfig);

  try {
    console.log('📡 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Hash the password
    const password = 'enter';
    const saltRounds = 10;
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('✅ Password hashed\n');

    // Check if admin user already exists
    console.log('🔍 Checking for existing admin user...');
    const checkUserQuery = `
      SELECT id, username, email, role
      FROM users
      WHERE username = 'admin' OR email = 'admin@cal3.local'
    `;

    const existingUser = await client.query(checkUserQuery);

    if (existingUser.rows.length > 0) {
      console.log('⚠️  Admin user already exists:');
      console.log('   ID:', existingUser.rows[0].id);
      console.log('   Username:', existingUser.rows[0].username);
      console.log('   Email:', existingUser.rows[0].email);
      console.log('   Role:', existingUser.rows[0].role);
      console.log('\n🔄 Updating existing user...\n');

      // Update existing user
      const updateQuery = `
        UPDATE users
        SET
          password = $1,
          role = 'admin',
          "isActive" = true,
          "firstName" = 'Admin',
          "lastName" = 'User',
          "usagePlans" = '["admin","enterprise","store","user","child"]'::json,
          "hideReservationsTab" = false,
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE username = 'admin'
        RETURNING id, username, email, "firstName", "lastName", role, "isActive", "usagePlans", "themeColor", timezone, "createdAt", "updatedAt"
      `;

      const result = await client.query(updateQuery, [hashedPassword]);
      console.log('✅ Admin user updated successfully!\n');

      const user = result.rows[0];
      printUserDetails(user);
    } else {
      console.log('➕ Creating new admin user...\n');

      // Insert new admin user
      const insertQuery = `
        INSERT INTO users (
          username,
          email,
          password,
          "firstName",
          "lastName",
          "isActive",
          role,
          "themeColor",
          "weekStartDay",
          "defaultCalendarView",
          timezone,
          "timeFormat",
          "usagePlans",
          "hideReservationsTab",
          "createdAt",
          "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        RETURNING id, username, email, "firstName", "lastName", role, "isActive", "usagePlans", "themeColor", timezone, "createdAt", "updatedAt"
      `;

      const result = await client.query(insertQuery, [
        'admin',
        'admin@cal3.local',
        hashedPassword,
        'Admin',
        'User',
        true,
        'admin',
        '#3b82f6',
        1,
        'month',
        'UTC',
        '24h',
        '["admin","enterprise","store","user","child"]',
        false,
      ]);

      console.log('✅ Admin user created successfully!\n');

      const user = result.rows[0];
      printUserDetails(user);
    }
  } catch (error: any) {
    console.error('\n❌ ERROR creating admin user:\n');
    console.error('Error Message:', error.message);

    if (error.code) {
      console.error('Error Code:', error.code);
    }

    throw error;
  } finally {
    await client.end();
    console.log('\n📡 Database connection closed.');
  }
}

function printUserDetails(user: any) {
  console.log('─'.repeat(80));
  console.log('📋 Admin User Details:');
  console.log('─'.repeat(80));
  console.log(`ID:                  ${user.id}`);
  console.log(`Username:            ${user.username}`);
  console.log(`Email:               ${user.email}`);
  console.log(`Full Name:           ${user.firstName} ${user.lastName}`);
  console.log(`Role:                ${user.role}`);
  console.log(`Active:              ${user.isActive ? 'Yes' : 'No'}`);
  console.log(`Usage Plans:         ${user.usagePlans}`);
  console.log(`Theme Color:         ${user.themeColor}`);
  console.log(`Timezone:            ${user.timezone}`);
  console.log(`Created:             ${user.createdAt}`);
  console.log(`Updated:             ${user.updatedAt}`);
  console.log('─'.repeat(80));
  console.log('\n✅ SUCCESS!\n');
  console.log('Login Credentials:');
  console.log('  Username: admin');
  console.log('  Password: enter');
  console.log('  Role:     admin (full privileges)');
  console.log('\n' + '─'.repeat(80));
}

if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('\n✅ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error.message);
      process.exit(1);
    });
}

export { createAdminUser };
