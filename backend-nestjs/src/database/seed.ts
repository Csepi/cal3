import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AuthService } from '../auth/auth.service';
import { CalendarsService } from '../calendars/calendars.service';
import { EventsService } from '../events/events.service';
import { CalendarVisibility, SharePermission } from '../entities/calendar.entity';
import { EventStatus, RecurrenceType } from '../entities/event.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Organisation } from '../entities/organisation.entity';
import { OrganisationUser } from '../entities/organisation-user.entity';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const authService = app.get(AuthService);
  const calendarsService = app.get(CalendarsService);
  const eventsService = app.get(EventsService);
  const userRepository = app.get('UserRepository');
  const organisationRepository = app.get('OrganisationRepository');
  const organisationUserRepository = app.get('OrganisationUserRepository');

  console.log('🌱 Starting database seeding...');

  try {
    // Create sample users
    console.log('👥 Creating sample users...');

    // Create admin user first
    let admin;
    try {
      const adminResult = await authService.register({
        username: 'admin',
        email: 'admin@example.com',
        password: 'enterenter',
        firstName: 'Admin',
        lastName: 'User'
      });
      admin = adminResult.user;
      console.log(`✅ Created admin user: ${admin.username} (ID: ${admin.id})`);
    } catch (error) {
      if (error.message?.includes('already exists')) {
        console.log('ℹ️  Admin user already exists, fetching...');
        admin = await userRepository.findOne({ where: { username: 'admin' } });
      } else {
        throw error;
      }
    }

    let alice, bob, charlie;
    try {
      const aliceResult = await authService.register({
        username: 'alice',
        email: 'alice@example.com',
        password: 'password123',
        firstName: 'Alice',
        lastName: 'Johnson'
      });
      alice = aliceResult.user;
      // Assign usage plans to Alice
      alice.usagePlans = ['USER', 'STORE'];
      await userRepository.save(alice);
      console.log(`✅ Created user: ${alice.username} (ID: ${alice.id})`);
    } catch (error) {
      if (error.message?.includes('already exists')) {
        console.log('ℹ️  Alice already exists, fetching...');
        alice = await userRepository.findOne({ where: { username: 'alice' } });
        // Update usage plans for existing user
        if (alice) {
          alice.usagePlans = ['USER', 'STORE'];
          await userRepository.save(alice);
        }
      } else {
        throw error;
      }
    }

    try {
      const bobResult = await authService.register({
        username: 'bob',
        email: 'bob@example.com',
        password: 'password123',
        firstName: 'Bob',
        lastName: 'Smith'
      });
      bob = bobResult.user;
      // Assign usage plans to Bob
      bob.usagePlans = ['USER', 'ENTERPRISE'];
      await userRepository.save(bob);
      console.log(`✅ Created user: ${bob.username} (ID: ${bob.id})`);
    } catch (error) {
      if (error.message?.includes('already exists')) {
        console.log('ℹ️  Bob already exists, fetching...');
        bob = await userRepository.findOne({ where: { username: 'bob' } });
        // Update usage plans for existing user
        if (bob) {
          bob.usagePlans = ['USER', 'ENTERPRISE'];
          await userRepository.save(bob);
        }
      } else {
        throw error;
      }
    }

    try {
      const charlieResult = await authService.register({
        username: 'charlie',
        email: 'charlie@example.com',
        password: 'password123',
        firstName: 'Charlie',
        lastName: 'Brown'
      });
      charlie = charlieResult.user;
      // Assign usage plans to Charlie
      charlie.usagePlans = ['USER'];
      await userRepository.save(charlie);
      console.log(`✅ Created user: ${charlie.username} (ID: ${charlie.id})`);
    } catch (error) {
      if (error.message?.includes('already exists')) {
        console.log('ℹ️  Charlie already exists, fetching...');
        charlie = await userRepository.findOne({ where: { username: 'charlie' } });
        // Update usage plans for existing user
        if (charlie) {
          charlie.usagePlans = ['USER'];
          await userRepository.save(charlie);
        }
      } else {
        throw error;
      }
    }

    // Create sample organizations
    console.log('\n🏢 Creating sample organizations...');

    const orgTechCorp = await organisationRepository.save(organisationRepository.create({
      name: 'TechCorp Solutions',
      description: 'Leading technology solutions company',
    }));
    console.log(`✅ Created organization: ${orgTechCorp.name} (ID: ${orgTechCorp.id})`);

    const orgStartupHub = await organisationRepository.save(organisationRepository.create({
      name: 'Startup Hub',
      description: 'Innovation and startup incubator',
    }));
    console.log(`✅ Created organization: ${orgStartupHub.name} (ID: ${orgStartupHub.id})`);

    const orgConsultingGroup = await organisationRepository.save(organisationRepository.create({
      name: 'Consulting Group',
      description: 'Professional business consulting services',
    }));
    console.log(`✅ Created organization: ${orgConsultingGroup.name} (ID: ${orgConsultingGroup.id})`);

    // Add users to organizations
    console.log('\n👥 Adding users to organizations...');

    // Add Alice to TechCorp as admin
    await organisationUserRepository.save(organisationUserRepository.create({
      userId: alice.id,
      organisationId: orgTechCorp.id,
    }));
    console.log(`✅ Added ${alice.username} to ${orgTechCorp.name}`);

    // Add Bob to TechCorp as regular member
    await organisationUserRepository.save(organisationUserRepository.create({
      userId: bob.id,
      organisationId: orgTechCorp.id,
    }));
    console.log(`✅ Added ${bob.username} to ${orgTechCorp.name}`);

    // Add Alice to Startup Hub as well
    await organisationUserRepository.save(organisationUserRepository.create({
      userId: alice.id,
      organisationId: orgStartupHub.id,
    }));
    console.log(`✅ Added ${alice.username} to ${orgStartupHub.name}`);

    // Add Charlie to Consulting Group
    await organisationUserRepository.save(organisationUserRepository.create({
      userId: charlie.id,
      organisationId: orgConsultingGroup.id,
    }));
    console.log(`✅ Added ${charlie.username} to ${orgConsultingGroup.name}`);

    // Create sample calendars
    console.log('\n📅 Creating sample calendars...');

    // Alice's calendars
    const alicePersonal = await calendarsService.create({
      name: 'Alice Personal',
      description: 'Alice\'s personal calendar',
      color: '#3b82f6',
      visibility: CalendarVisibility.PRIVATE
    }, alice.id);
    console.log(`✅ Created calendar: ${alicePersonal.name} (ID: ${alicePersonal.id})`);

    const aliceWork = await calendarsService.create({
      name: 'Alice Work',
      description: 'Alice\'s work schedule',
      color: '#ef4444',
      visibility: CalendarVisibility.SHARED
    }, alice.id);
    console.log(`✅ Created calendar: ${aliceWork.name} (ID: ${aliceWork.id})`);

    // Bob's calendars
    const bobPersonal = await calendarsService.create({
      name: 'Bob Personal',
      description: 'Bob\'s personal calendar',
      color: '#10b981',
      visibility: CalendarVisibility.PRIVATE
    }, bob.id);
    console.log(`✅ Created calendar: ${bobPersonal.name} (ID: ${bobPersonal.id})`);

    const bobWork = await calendarsService.create({
      name: 'Team Calendar',
      description: 'Shared team calendar',
      color: '#f59e0b',
      visibility: CalendarVisibility.SHARED
    }, bob.id);
    console.log(`✅ Created calendar: ${bobWork.name} (ID: ${bobWork.id})`);

    // Public calendar
    const publicCal = await calendarsService.create({
      name: 'Company Events',
      description: 'Public company-wide events',
      color: '#8b5cf6',
      visibility: CalendarVisibility.PUBLIC
    }, alice.id);
    console.log(`✅ Created calendar: ${publicCal.name} (ID: ${publicCal.id})`);

    // Share calendars
    console.log('\n🤝 Setting up calendar sharing...');

    // Share Alice's work calendar with Bob (write access)
    await calendarsService.shareCalendar(aliceWork.id, {
      userIds: [bob.id],
      permission: SharePermission.WRITE
    }, alice.id);
    console.log(`✅ Shared "${aliceWork.name}" with ${bob.username} (WRITE)`);

    // Share Bob's team calendar with Alice and Charlie (write access)
    await calendarsService.shareCalendar(bobWork.id, {
      userIds: [alice.id],
      permission: SharePermission.WRITE
    }, bob.id);
    console.log(`✅ Shared "${bobWork.name}" with ${alice.username} (WRITE)`);

    await calendarsService.shareCalendar(bobWork.id, {
      userIds: [charlie.id],
      permission: SharePermission.READ
    }, bob.id);
    console.log(`✅ Shared "${bobWork.name}" with ${charlie.username} (READ)`);

    // Create sample events
    console.log('\n📝 Creating sample events...');

    // Alice's personal events
    await eventsService.create({
      title: 'Morning Workout',
      description: 'Daily exercise routine',
      startDate: '2025-09-17',
      startTime: '07:00',
      endDate: '2025-09-17',
      endTime: '08:00',
      isAllDay: false,
      location: 'Local Gym',
      status: EventStatus.CONFIRMED,
      recurrenceType: RecurrenceType.DAILY,
      color: '#3b82f6',
      calendarId: alicePersonal.id
    }, alice.id);

    await eventsService.create({
      title: 'Doctor Appointment',
      description: 'Annual checkup',
      startDate: '2025-09-18',
      startTime: '10:30',
      endDate: '2025-09-18',
      endTime: '11:30',
      isAllDay: false,
      location: 'Medical Center',
      status: EventStatus.CONFIRMED,
      color: '#ef4444',
      calendarId: alicePersonal.id
    }, alice.id);

    // Alice's work events
    await eventsService.create({
      title: 'Team Standup',
      description: 'Daily team synchronization',
      startDate: '2025-09-17',
      startTime: '09:00',
      endDate: '2025-09-17',
      endTime: '09:30',
      isAllDay: false,
      location: 'Conference Room A',
      status: EventStatus.CONFIRMED,
      recurrenceType: RecurrenceType.DAILY,
      color: '#ef4444',
      calendarId: aliceWork.id
    }, alice.id);

    await eventsService.create({
      title: 'Project Review',
      description: 'Quarterly project review meeting',
      startDate: '2025-09-19',
      startTime: '14:00',
      endDate: '2025-09-19',
      endTime: '16:00',
      isAllDay: false,
      location: 'Conference Room B',
      status: EventStatus.TENTATIVE,
      color: '#f59e0b',
      calendarId: aliceWork.id
    }, alice.id);

    // Bob's events
    await eventsService.create({
      title: 'Client Meeting',
      description: 'Important client presentation',
      startDate: '2025-09-17',
      startTime: '15:00',
      endDate: '2025-09-17',
      endTime: '16:30',
      isAllDay: false,
      location: 'Client Office',
      status: EventStatus.CONFIRMED,
      color: '#10b981',
      calendarId: bobPersonal.id
    }, bob.id);

    await eventsService.create({
      title: 'Team Building Event',
      description: 'Quarterly team building activity',
      startDate: '2025-09-20',
      startTime: '13:00',
      endDate: '2025-09-20',
      endTime: '17:00',
      isAllDay: false,
      location: 'City Park',
      status: EventStatus.CONFIRMED,
      color: '#f59e0b',
      calendarId: bobWork.id
    }, bob.id);

    // All-day events
    await eventsService.create({
      title: 'Company Holiday',
      description: 'National holiday - office closed',
      startDate: '2025-09-22',
      isAllDay: true,
      status: EventStatus.CONFIRMED,
      color: '#8b5cf6',
      calendarId: publicCal.id
    }, alice.id);

    await eventsService.create({
      title: 'Weekend Trip',
      description: 'Personal vacation time',
      startDate: '2025-09-21',
      endDate: '2025-09-22',
      isAllDay: true,
      status: EventStatus.CONFIRMED,
      color: '#3b82f6',
      calendarId: alicePersonal.id
    }, alice.id);

    // Recurring events
    await eventsService.create({
      title: 'Weekly Team Meeting',
      description: 'Regular team sync meeting',
      startDate: '2025-09-17',
      startTime: '11:00',
      endDate: '2025-09-17',
      endTime: '12:00',
      isAllDay: false,
      location: 'Conference Room C',
      status: EventStatus.CONFIRMED,
      recurrenceType: RecurrenceType.WEEKLY,
      color: '#f59e0b',
      calendarId: bobWork.id
    }, bob.id);

    await eventsService.create({
      title: 'Monthly Review',
      description: 'Monthly performance review',
      startDate: '2025-09-30',
      startTime: '16:00',
      endDate: '2025-09-30',
      endTime: '17:00',
      isAllDay: false,
      location: 'Manager Office',
      status: EventStatus.TENTATIVE,
      recurrenceType: RecurrenceType.MONTHLY,
      color: '#ef4444',
      calendarId: aliceWork.id
    }, alice.id);

    // Future events
    await eventsService.create({
      title: 'Conference 2025',
      description: 'Annual tech conference',
      startDate: '2025-10-15',
      startTime: '09:00',
      endDate: '2025-10-17',
      endTime: '18:00',
      isAllDay: false,
      location: 'Convention Center',
      status: EventStatus.TENTATIVE,
      color: '#8b5cf6',
      notes: 'Need to register and book accommodation',
      calendarId: publicCal.id
    }, alice.id);

    console.log('\n✅ Sample data creation completed!');
    console.log('\n📊 Summary:');
    console.log('👥 Users: 4 (admin, alice, bob, charlie)');
    console.log('🏢 Organizations: 3 (TechCorp Solutions, Startup Hub, Consulting Group)');
    console.log('👔 Organization Members: 5 relationships across users');
    console.log('📅 Calendars: 5 (2 personal, 2 shared, 1 public)');
    console.log('📝 Events: 11 (various types and recurrence patterns)');
    console.log('🤝 Shares: 3 calendar sharing relationships');
    console.log('\n🔑 Admin login: username=admin, password=enterenter');

    console.log('\n🔗 Test URLs:');
    console.log('• Frontend: http://localhost:8080');
    console.log('• API Events: http://localhost:8081/api/events');
    console.log('• API Docs: http://localhost:8081/api/docs');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      console.log('ℹ️  Some data may already exist. This is normal.');
    }
  } finally {
    await app.close();
  }
}

// Run the seed function
if (require.main === module) {
  seed().catch(console.error);
}

export { seed };