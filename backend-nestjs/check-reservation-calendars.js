const { Client } = require('pg');

async function checkReservationCalendars() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'cal3',
    user: 'postgres',
    password: 'root'
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Check reservation calendars in organization 12
    const result = await client.query(`
      SELECT
        rc.id,
        rc.name,
        rc."organisationId",
        o.name as org_name,
        c.id as calendar_id,
        c.name as calendar_name
      FROM reservation_calendars rc
      JOIN organisations o ON rc."organisationId" = o.id
      LEFT JOIN calendars c ON rc."calendarId" = c.id
      WHERE rc."organisationId" = 12
    `);

    console.log('Reservation Calendars in Organization 12:');
    console.log(JSON.stringify(result.rows, null, 2));

    // Check all reservation calendars
    const allResult = await client.query(`
      SELECT
        rc.id,
        rc.name,
        rc."organisationId",
        o.name as org_name
      FROM reservation_calendars rc
      JOIN organisations o ON rc."organisationId" = o.id
    `);

    console.log('\nAll Reservation Calendars:');
    console.log(JSON.stringify(allResult.rows, null, 2));

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

checkReservationCalendars();
