import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UsagePlan } from '../entities/user.entity';
import { Calendar } from '../entities/calendar.entity';
import { Event } from '../entities/event.entity';
import { CalendarShare } from '../entities/calendar.entity';
import { Reservation } from '../entities/reservation.entity';
import { Organisation } from '../entities/organisation.entity';
import { OrganisationUser } from '../entities/organisation-user.entity';
import { OrganisationAdmin } from '../entities/organisation-admin.entity';
import { ResourceType } from '../entities/resource-type.entity';
import { Resource } from '../entities/resource.entity';
import { OperatingHours } from '../entities/operating-hours.entity';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Calendar)
    private calendarRepository: Repository<Calendar>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(CalendarShare)
    private calendarShareRepository: Repository<CalendarShare>,
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    @InjectRepository(Organisation)
    private organisationRepository: Repository<Organisation>,
    @InjectRepository(OrganisationUser)
    private organisationUserRepository: Repository<OrganisationUser>,
    @InjectRepository(OrganisationAdmin)
    private organisationAdminRepository: Repository<OrganisationAdmin>,
    @InjectRepository(ResourceType)
    private resourceTypeRepository: Repository<ResourceType>,
    @InjectRepository(Resource)
    private resourceRepository: Repository<Resource>,
    @InjectRepository(OperatingHours)
    private operatingHoursRepository: Repository<OperatingHours>,
  ) {}

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'username', 'email', 'firstName', 'lastName', 'role', 'usagePlans', 'isActive', 'createdAt', 'updatedAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAllCalendars(): Promise<Calendar[]> {
    return this.calendarRepository.find({
      relations: ['owner'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAllEvents(): Promise<Event[]> {
    return this.eventRepository.find({
      relations: ['calendar', 'createdBy'],
      order: { startDate: 'DESC' },
    });
  }

  async getAllCalendarShares(): Promise<CalendarShare[]> {
    return this.calendarShareRepository.find({
      relations: ['calendar', 'user'],
      order: { sharedAt: 'DESC' },
    });
  }

  async getAllReservations(): Promise<Reservation[]> {
    return this.reservationRepository.find({
      relations: ['resource', 'createdBy'],
      order: { startTime: 'DESC' },
    });
  }

  async getDatabaseStats(): Promise<any> {
    const [userCount, calendarCount, eventCount, shareCount] = await Promise.all([
      this.userRepository.count(),
      this.calendarRepository.count(),
      this.eventRepository.count(),
      this.calendarShareRepository.count(),
    ]);

    const activeUsers = await this.userRepository.count({ where: { isActive: true } });
    const adminUsers = await this.userRepository.count({ where: { role: UserRole.ADMIN } });

    return {
      users: {
        total: userCount,
        active: activeUsers,
        admins: adminUsers,
      },
      calendars: {
        total: calendarCount,
      },
      events: {
        total: eventCount,
      },
      shares: {
        total: shareCount,
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  async updateUserRole(userId: number, role: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.role = role as any;
    return this.userRepository.save(user);
  }

  async updateUserUsagePlans(userId: number, usagePlans: UsagePlan[]): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.usagePlans = usagePlans;
    return this.userRepository.save(user);
  }

  async deleteUser(userId: number): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete related records first to avoid foreign key constraint violations

    // Delete user's reservations
    await this.reservationRepository.delete({ createdBy: { id: userId } });

    // Delete user's calendar shares
    await this.calendarShareRepository.delete({ userId: userId });

    // Delete user's events
    await this.eventRepository.delete({ createdById: userId });

    // Delete user's calendars (this should cascade to events and shares)
    await this.calendarRepository.delete({ ownerId: userId });

    // Finally delete the user
    await this.userRepository.remove(user);
    return { message: 'User deleted successfully' };
  }

  async deleteCalendar(calendarId: number): Promise<{ message: string }> {
    const calendar = await this.calendarRepository.findOne({ where: { id: calendarId } });
    if (!calendar) {
      throw new NotFoundException('Calendar not found');
    }

    await this.calendarRepository.remove(calendar);
    return { message: 'Calendar deleted successfully' };
  }

  async deleteEvent(eventId: number): Promise<{ message: string }> {
    const event = await this.eventRepository.findOne({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await this.eventRepository.remove(event);
    return { message: 'Event deleted successfully' };
  }

  // CREATE OPERATIONS
  async createUser(createUserDto: any): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return await this.userRepository.save(user) as unknown as User;
  }

  async createCalendar(createCalendarDto: any): Promise<Calendar> {
    const calendar = this.calendarRepository.create(createCalendarDto);
    return await this.calendarRepository.save(calendar) as unknown as Calendar;
  }

  async createEvent(createEventDto: any): Promise<Event> {
    const event = this.eventRepository.create({
      ...createEventDto,
      startDate: new Date(createEventDto.startDate),
      endDate: createEventDto.endDate ? new Date(createEventDto.endDate) : null,
    });
    return await this.eventRepository.save(event) as unknown as Event;
  }

  // UPDATE OPERATIONS
  async updateUser(userId: number, updateUserDto: any): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Don't update password here, use separate endpoint
    const { password, ...updateData } = updateUserDto;
    Object.assign(user, updateData);

    return await this.userRepository.save(user);
  }

  async updateUserPassword(userId: number, newPassword: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    return await this.userRepository.save(user);
  }

  async updateCalendar(calendarId: number, updateCalendarDto: any): Promise<Calendar> {
    const calendar = await this.calendarRepository.findOne({
      where: { id: calendarId },
      relations: ['owner']
    });
    if (!calendar) {
      throw new NotFoundException('Calendar not found');
    }

    Object.assign(calendar, updateCalendarDto);
    return await this.calendarRepository.save(calendar);
  }

  async updateEvent(eventId: number, updateEventDto: any): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['calendar', 'createdBy']
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Handle date conversion
    if (updateEventDto.startDate) {
      updateEventDto.startDate = new Date(updateEventDto.startDate);
    }
    if (updateEventDto.endDate) {
      updateEventDto.endDate = new Date(updateEventDto.endDate);
    }

    Object.assign(event, updateEventDto);
    return await this.eventRepository.save(event);
  }

  // GET SINGLE OPERATIONS
  async getUser(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'username', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt', 'updatedAt']
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async getCalendar(calendarId: number): Promise<Calendar> {
    const calendar = await this.calendarRepository.findOne({
      where: { id: calendarId },
      relations: ['owner']
    });
    if (!calendar) {
      throw new NotFoundException('Calendar not found');
    }
    return calendar;
  }

  async getEvent(eventId: number): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['calendar', 'createdBy']
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  // ORGANIZATION MANAGEMENT OPERATIONS
  async getAllOrganizations(): Promise<any[]> {
    const organizations = await this.organisationRepository.find({
      order: { name: 'ASC' },
    });

    // Enhance each organization with member counts and calendar counts
    const enhancedOrgs = await Promise.all(
      organizations.map(async (org) => {
        // Get organisation_users count with role breakdown
        const orgUsers = await this.organisationUserRepository.find({
          where: { organisationId: org.id },
        });

        const adminCount = orgUsers.filter(ou => ou.role === 'admin').length;
        const userCount = orgUsers.filter(ou => ou.role !== 'admin').length;

        // Get calendar count for this organization
        // Calendars are linked through resource_types and resources
        const resourceTypes = await this.resourceTypeRepository.find({
          where: { organisationId: org.id },
          relations: ['resources'],
        });

        const calendarCount = resourceTypes.reduce((total, rt) => {
          return total + (rt.resources?.length || 0);
        }, 0);

        return {
          ...org,
          adminCount,
          userCount,
          calendarCount,
        };
      })
    );

    return enhancedOrgs;
  }

  async getUserOrganizations(userId: number): Promise<Organisation[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const orgUsers = await this.organisationUserRepository.find({
      where: { userId },
      relations: ['organisation'],
    });

    return orgUsers.map(orgUser => orgUser.organisation);
  }

  async addUserToOrganization(userId: number, organizationId: number): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const organization = await this.organisationRepository.findOne({ where: { id: organizationId } });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check if user is already in the organization
    const existingOrgUser = await this.organisationUserRepository.findOne({
      where: { userId, organisationId: organizationId },
    });

    if (existingOrgUser) {
      return { message: 'User is already a member of this organization' };
    }

    // Add user to organization
    const orgUser = this.organisationUserRepository.create({
      userId,
      organisationId: organizationId,
    });

    await this.organisationUserRepository.save(orgUser);
    return { message: 'User added to organization successfully' };
  }

  async removeUserFromOrganization(userId: number, organizationId: number): Promise<{ message: string }> {
    const orgUser = await this.organisationUserRepository.findOne({
      where: { userId, organisationId: organizationId },
    });

    if (!orgUser) {
      throw new NotFoundException('User is not a member of this organization');
    }

    await this.organisationUserRepository.remove(orgUser);
    return { message: 'User removed from organization successfully' };
  }

  async getOrganizationUsers(organizationId: number): Promise<any[]> {
    const organization = await this.organisationRepository.findOne({ where: { id: organizationId } });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    console.log(`🔍 AdminService.getOrganizationUsers called for org #${organizationId}`);

    // Get users from organisation_users table
    const orgUsers = await this.organisationUserRepository.find({
      where: { organisationId: organizationId },
      relations: ['user'],
    });
    console.log(`📋 Found ${orgUsers.length} users in organisation_users table:`, orgUsers.map(u => `${u.userId}:${u.role}`));

    // Get users from organisation_admins table
    const orgAdmins = await this.organisationAdminRepository.find({
      where: { organisationId: organizationId },
      relations: ['user'],
    });
    console.log(`👑 Found ${orgAdmins.length} admins in organisation_admins table:`, orgAdmins.map(a => a.userId));

    // Convert OrganisationAdmin records to user format with ADMIN role
    const adminUsers = orgAdmins.map(admin => ({
      ...admin.user,
      organizationRole: 'admin',
      assignedAt: admin.assignedAt,
      isOrgAdmin: true,
    }));

    // Convert OrganisationUser records to user format
    const regularUsers = orgUsers.map(orgUser => ({
      ...orgUser.user,
      organizationRole: orgUser.role,
      assignedAt: orgUser.assignedAt,
      isOrgAdmin: false,
    }));

    // Combine both lists, removing duplicates (prefer ADMIN role if user is in both tables)
    const userMap = new Map<number, any>();

    // First add regular org users
    regularUsers.forEach(user => userMap.set(user.id, user));

    // Then add/override with org admins (ADMIN takes precedence)
    adminUsers.forEach(user => userMap.set(user.id, user));

    const result = Array.from(userMap.values());
    console.log(`📊 Final result: ${result.length} users total:`, result.map(u => `${u.id}:${u.organizationRole}`));

    return result;
  }

  async addUserToOrganizationWithRole(userId: number, organizationId: number, role: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const organization = await this.organisationRepository.findOne({ where: { id: organizationId } });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check if user is already in the organization
    const existingOrgUser = await this.organisationUserRepository.findOne({
      where: { userId, organisationId: organizationId },
    });

    if (existingOrgUser) {
      // Update existing role
      existingOrgUser.role = role as any;
      await this.organisationUserRepository.save(existingOrgUser);
      return { message: 'User role updated in organization successfully' };
    }

    // Add user to organization with specified role
    const orgUser = this.organisationUserRepository.create({
      userId,
      organisationId: organizationId,
      role: role as any,
    });

    await this.organisationUserRepository.save(orgUser);
    return { message: 'User added to organization successfully' };
  }

  // PUBLIC BOOKING INITIALIZATION
  async initializePublicBooking(): Promise<any> {
    const results = {
      resourcesUpdated: 0,
      resourceTypesWithHours: 0,
      errors: [] as string[],
    };

    try {
      // 1. Generate public booking tokens for all resources that don't have one
      const resources = await this.resourceRepository.find({
        where: { publicBookingToken: null as any },
      });

      console.log(`Found ${resources.length} resources without public booking tokens`);

      for (const resource of resources) {
        try {
          resource.publicBookingToken = uuidv4();
          await this.resourceRepository.save(resource);
          results.resourcesUpdated++;
          console.log(`✓ Generated token for resource: ${resource.name}`);
        } catch (error) {
          results.errors.push(`Failed to generate token for resource ${resource.id}: ${error.message}`);
        }
      }

      // 2. Create default operating hours for resource types that don't have them
      const resourceTypes = await this.resourceTypeRepository.find({
        relations: ['operatingHours'],
      });

      const defaultHours = [
        { dayOfWeek: 1, openTime: '09:00', closeTime: '17:00', isActive: true }, // Monday
        { dayOfWeek: 2, openTime: '09:00', closeTime: '17:00', isActive: true }, // Tuesday
        { dayOfWeek: 3, openTime: '09:00', closeTime: '17:00', isActive: true }, // Wednesday
        { dayOfWeek: 4, openTime: '09:00', closeTime: '17:00', isActive: true }, // Thursday
        { dayOfWeek: 5, openTime: '09:00', closeTime: '17:00', isActive: true }, // Friday
        { dayOfWeek: 6, openTime: '10:00', closeTime: '14:00', isActive: true }, // Saturday
        { dayOfWeek: 0, openTime: '10:00', closeTime: '14:00', isActive: false }, // Sunday (closed)
      ];

      for (const resourceType of resourceTypes) {
        if (!resourceType.operatingHours || resourceType.operatingHours.length === 0) {
          try {
            for (const hours of defaultHours) {
              const operatingHour = this.operatingHoursRepository.create({
                ...hours,
                resourceType: resourceType,
              });
              await this.operatingHoursRepository.save(operatingHour);
            }
            results.resourceTypesWithHours++;
            console.log(`✓ Created operating hours for: ${resourceType.name}`);
          } catch (error) {
            results.errors.push(`Failed to create operating hours for resource type ${resourceType.id}: ${error.message}`);
          }
        }
      }

      return {
        success: true,
        message: 'Public booking initialization completed',
        ...results,
      };
    } catch (error) {
      console.error('Error initializing public booking:', error);
      return {
        success: false,
        message: 'Public booking initialization failed',
        error: error.message,
        ...results,
      };
    }
  }
}