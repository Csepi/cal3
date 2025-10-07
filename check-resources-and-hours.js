const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'cal3',
  user: 'postgres',
  password: 'postgres'
});

async function checkData() {
  try {
    await client.connect();

    // Check resources
    const resourcesResult = await client.query(`
      SELECT r.id, r.name, r."publicBookingToken", rt.name as type_name
      FROM resources r
      LEFT JOIN resource_types rt ON r."resourceTypeId" = rt.id
      ORDER BY r.id
    `);

    console.log('Resources:');
    resourcesResult.rows.forEach(r => {
      console.log(`  ID: ${r.id}, Name: ${r.name}, Token: ${r.publicBookingToken || 'NONE'}, Type: ${r.type_name || 'N/A'}`);
    });

    // Check resource types and operating hours
    const typesResult = await client.query(`
      SELECT rt.id, rt.name, COUNT(oh.id) as hours_count
      FROM resource_types rt
      LEFT JOIN operating_hours oh ON rt.id = oh."resourceTypeId"
      GROUP BY rt.id, rt.name
      ORDER BY rt.id
    `);

    console.log('\nResource Types:');
    typesResult.rows.forEach(rt => {
      console.log(`  ID: ${rt.id}, Name: ${rt.name}, Operating Hours: ${rt.hours_count}`);
    });

    // Check operating hours details
    const hoursResult = await client.query(`
      SELECT oh.*, rt.name as type_name
      FROM operating_hours oh
      LEFT JOIN resource_types rt ON oh."resourceTypeId" = rt.id
      ORDER BY rt.name, oh."dayOfWeek"
    `);

    console.log('\nOperating Hours:');
    hoursResult.rows.forEach(oh => {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      console.log(`  ${oh.type_name}: ${days[oh.dayOfWeek]} ${oh.openTime}-${oh.closeTime} (Active: ${oh.isActive})`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkData();
