/**
 * Setup Public Booking - Generate tokens and operating hours
 * Run this script to set up public booking for existing resources
 */

const { DataSource } = require('typeorm');
const { v4: uuidv4 } = require('uuid');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'cal3',
  entities: ['src/entities/*.entity.ts'],
  synchronize: false,
});

async function setupPublicBooking() {
  try {
    await AppDataSource.initialize();
    console.log('Connected to database');

    // 1. Generate public booking tokens for all resources that don't have one
    const resourceRepo = AppDataSource.getRepository('Resource');
    const resources = await resourceRepo.find();

    console.log(`\nFound ${resources.length} resources`);

    for (const resource of resources) {
      if (!resource.publicBookingToken) {
        resource.publicBookingToken = uuidv4();
        await resourceRepo.save(resource);
        console.log(`✓ Generated token for resource: ${resource.name} (${resource.id})`);
        console.log(`  Token: ${resource.publicBookingToken}`);
      } else {
        console.log(`- Resource "${resource.name}" already has a token`);
      }
    }

    // 2. Create default operating hours for resource types that don't have any
    const resourceTypeRepo = AppDataSource.getRepository('ResourceType');
    const operatingHoursRepo = AppDataSource.getRepository('OperatingHours');

    const resourceTypes = await resourceTypeRepo.find({
      relations: ['operatingHours']
    });

    console.log(`\nFound ${resourceTypes.length} resource types`);

    // Default hours: Monday-Friday 9:00-17:00, Saturday 10:00-14:00
    const defaultHours = [
      { dayOfWeek: 1, openTime: '09:00', closeTime: '17:00', isActive: true }, // Monday
      { dayOfWeek: 2, openTime: '09:00', closeTime: '17:00', isActive: true }, // Tuesday
      { dayOfWeek: 3, openTime: '09:00', closeTime: '17:00', isActive: true }, // Wednesday
      { dayOfWeek: 4, openTime: '09:00', closeTime: '17:00', isActive: true }, // Thursday
      { dayOfWeek: 5, openTime: '09:00', closeTime: '17:00', isActive: true }, // Friday
      { dayOfWeek: 6, openTime: '10:00', closeTime: '14:00', isActive: true }, // Saturday
      { dayOfWeek: 0, openTime: '10:00', closeTime: '14:00', isActive: false }, // Sunday (inactive)
    ];

    for (const resourceType of resourceTypes) {
      if (!resourceType.operatingHours || resourceType.operatingHours.length === 0) {
        console.log(`✓ Creating operating hours for: ${resourceType.name} (${resourceType.id})`);

        for (const hours of defaultHours) {
          const operatingHour = operatingHoursRepo.create({
            ...hours,
            resourceTypeId: resourceType.id,
          });
          await operatingHoursRepo.save(operatingHour);
        }

        console.log(`  Added 7 days of operating hours (Mon-Fri 9-5, Sat 10-2)`);
      } else {
        console.log(`- Resource type "${resourceType.name}" already has ${resourceType.operatingHours.length} operating hours`);
      }
    }

    console.log('\n✅ Setup complete!');
    console.log('\nNext steps:');
    console.log('1. Copy a resource\'s public booking token from above');
    console.log('2. Access: http://localhost:8080/public-booking/{token}');
    console.log('3. Test the booking flow\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

setupPublicBooking();
