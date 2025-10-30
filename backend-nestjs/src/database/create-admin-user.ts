import * as sql from 'mssql';
import * as bcrypt from 'bcryptjs';

const azureConfig: sql.config = {
  server: 'cal3db-server.database.windows.net',
  port: 1433,
  database: 'cal3db',
  user: 'db_admin',
  password: 'Enter.Enter',
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 30000,
  },
};

async function createAdminUser() {
  let pool: sql.ConnectionPool | null = null;

  try {
    console.log('🚀 Creating Admin User\n');
    console.log('📡 Connecting to Azure SQL Database...');
    pool = await sql.connect(azureConfig);
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

    const existingUser = await pool.request().query(checkUserQuery);

    if (existingUser.recordset.length > 0) {
      console.log('⚠️  Admin user already exists:');
      console.log('   ID:', existingUser.recordset[0].id);
      console.log('   Username:', existingUser.recordset[0].username);
      console.log('   Email:', existingUser.recordset[0].email);
      console.log('   Role:', existingUser.recordset[0].role);
      console.log('\n🔄 Updating existing user...\n');

      // Update existing user
      const updateQuery = `
        UPDATE users
        SET
          password = @password,
          role = 'admin',
          isActive = 1,
          firstName = 'Admin',
          lastName = 'User',
          usagePlans = '["admin","enterprise","store","user","child"]',
          hideReservationsTab = 0,
          updatedAt = GETUTCDATE()
        WHERE username = 'admin'
      `;

      await pool
        .request()
        .input('password', sql.NVarChar, hashedPassword)
        .query(updateQuery);

      console.log('✅ Admin user updated successfully!\n');
    } else {
      console.log('➕ Creating new admin user...\n');

      // Insert new admin user
      const insertQuery = `
        INSERT INTO users (
          username,
          email,
          password,
          firstName,
          lastName,
          isActive,
          role,
          themeColor,
          weekStartDay,
          defaultCalendarView,
          timezone,
          timeFormat,
          usagePlans,
          hideReservationsTab,
          createdAt,
          updatedAt
        ) VALUES (
          @username,
          @email,
          @password,
          @firstName,
          @lastName,
          @isActive,
          @role,
          @themeColor,
          @weekStartDay,
          @defaultCalendarView,
          @timezone,
          @timeFormat,
          @usagePlans,
          @hideReservationsTab,
          GETUTCDATE(),
          GETUTCDATE()
        )
      `;

      await pool
        .request()
        .input('username', sql.NVarChar, 'admin')
        .input('email', sql.NVarChar, 'admin@cal3.local')
        .input('password', sql.NVarChar, hashedPassword)
        .input('firstName', sql.NVarChar, 'Admin')
        .input('lastName', sql.NVarChar, 'User')
        .input('isActive', sql.Bit, 1)
        .input('role', sql.NVarChar, 'admin')
        .input('themeColor', sql.NVarChar, '#3b82f6')
        .input('weekStartDay', sql.Int, 1)
        .input('defaultCalendarView', sql.NVarChar, 'month')
        .input('timezone', sql.NVarChar, 'UTC')
        .input('timeFormat', sql.NVarChar, '24h')
        .input(
          'usagePlans',
          sql.NVarChar,
          '["admin","enterprise","store","user","child"]',
        )
        .input('hideReservationsTab', sql.Bit, 0)
        .query(insertQuery);

      console.log('✅ Admin user created successfully!\n');
    }

    // Verify the user was created/updated
    console.log('🔍 Verifying admin user...\n');
    const verifyQuery = `
      SELECT
        id,
        username,
        email,
        firstName,
        lastName,
        role,
        isActive,
        usagePlans,
        themeColor,
        timezone,
        createdAt,
        updatedAt
      FROM users
      WHERE username = 'admin'
    `;

    const result = await pool.request().query(verifyQuery);

    if (result.recordset.length > 0) {
      const user = result.recordset[0];
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
  } catch (error: any) {
    console.error('\n❌ ERROR creating admin user:\n');
    console.error('Error Message:', error.message);

    if (error.number) {
      console.error('SQL Error Number:', error.number);
    }

    if (error.code) {
      console.error('Error Code:', error.code);
    }

    throw error;
  } finally {
    if (pool) {
      await pool.close();
      console.log('\n📡 Database connection closed.');
    }
  }
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
