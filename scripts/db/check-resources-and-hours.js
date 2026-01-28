const { withDbClient } = require('../lib/db');
const { logError } = require('../lib/errors');

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const checkData = async () =>
  withDbClient(async (client) => {
    const resourcesResult = await client.query(`
      SELECT r.id, r.name, r."publicBookingToken", rt.name as type_name
      FROM resources r
      LEFT JOIN resource_types rt ON r."resourceTypeId" = rt.id
      ORDER BY r.id
    `);

    console.log('Resources:');
    resourcesResult.rows.forEach((resource) => {
      console.log(
        `  ID: ${resource.id}, Name: ${resource.name}, Token: ${
          resource.publicBookingToken || 'NONE'
        }, Type: ${resource.type_name || 'N/A'}`,
      );
    });

    const typesResult = await client.query(`
      SELECT rt.id, rt.name, COUNT(oh.id) as hours_count
      FROM resource_types rt
      LEFT JOIN operating_hours oh ON rt.id = oh."resourceTypeId"
      GROUP BY rt.id, rt.name
      ORDER BY rt.id
    `);

    console.log('\nResource Types:');
    typesResult.rows.forEach((type) => {
      console.log(
        `  ID: ${type.id}, Name: ${type.name}, Operating Hours: ${type.hours_count}`,
      );
    });

    const hoursResult = await client.query(`
      SELECT oh.*, rt.name as type_name
      FROM operating_hours oh
      LEFT JOIN resource_types rt ON oh."resourceTypeId" = rt.id
      ORDER BY rt.name, oh."dayOfWeek"
    `);

    console.log('\nOperating Hours:');
    hoursResult.rows.forEach((hours) => {
      console.log(
        `  ${hours.type_name}: ${DAYS[hours.dayOfWeek]} ${hours.openTime}-${hours.closeTime} (Active: ${hours.isActive})`,
      );
    });
  });

checkData().catch((error) => {
  logError('check-resources-and-hours', error);
  process.exitCode = 1;
});
