const { DataSource } = require('typeorm');

const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'calendar_app_test',
  ssl: { rejectUnauthorized: false },
});

async function testDatabase() {
  try {
    await dataSource.initialize();
    console.log('✅ Database connected');

    // Check if publicBookingToken column exists
    const columns = await dataSource.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'resources' AND column_name = 'publicBookingToken'
    `);

    if (columns.length > 0) {
      console.log('✅ publicBookingToken column exists:', columns[0]);
    } else {
      console.log('❌ publicBookingToken column NOT found');
    }

    // Get a sample resource
    const resources = await dataSource.query(`
      SELECT id, name, "publicBookingToken"
      FROM resources
      LIMIT 3
    `);

    console.log('\n📋 Sample resources:');
    resources.forEach(r => {
      console.log(`  - ID: ${r.id}, Name: ${r.name}, Token: ${r.publicBookingToken || 'NULL'}`);
    });

    // If a resource doesn't have a token, generate one
    if (resources.length > 0 && !resources[0].publicBookingToken) {
      const { v4: uuidv4 } = require('uuid');
      const newToken = uuidv4();
      await dataSource.query(`
        UPDATE resources
        SET "publicBookingToken" = $1
        WHERE id = $2
      `, [newToken, resources[0].id]);
      console.log(`\n✅ Generated token for resource ${resources[0].id}: ${newToken}`);
      resources[0].publicBookingToken = newToken;
    }

    // Test public booking endpoint
    if (resources.length > 0 && resources[0].publicBookingToken) {
      console.log('\n🧪 Testing public booking endpoint...');
      const token = resources[0].publicBookingToken;
      const fetch = require('node-fetch');

      const response = await fetch(`http://localhost:8081/api/public/booking/${token}`);
      const data = await response.json();

      if (response.ok) {
        console.log('✅ Public booking endpoint works!');
        console.log('   Resource:', data.name);
        console.log('   Resource Type:', data.resourceType?.name);
      } else {
        console.log('❌ Public booking endpoint error:', response.status, data);
      }
    }

    await dataSource.destroy();
    console.log('\n✅ Test completed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testDatabase();