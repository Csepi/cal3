import { logError } from '../common/errors/error-logger';
import { buildErrorContext } from '../common/errors/error-context';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions, IsNull, Repository } from 'typeorm';
import { User, UserRole, UsagePlan } from '../entities/user.entity';
import { Calendar, CalendarShare } from '../entities/calendar.entity';
import { Event } from '../entities/event.entity';
import { Reservation } from '../entities/reservation.entity';
import { Organisation } from '../entities/organisation.entity';
import {
  OrganisationRoleType,
  OrganisationUser,
} from '../entities/organisation-user.entity';
import { OrganisationAdmin } from '../entities/organisation-admin.entity';
import { ResourceType } from '../entities/resource-type.entity';
import { Resource } from '../entities/resource.entity';
import { OperatingHours } from '../entities/operating-hours.entity';
import { AutomationRule } from '../entities/automation-rule.entity';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  DatabaseInfoDto,
  DatabaseStatsDto,
  EnvironmentInfoDto,
  FeatureFlagsDto,
  ServerInfoDto,
  SystemInfoDto,
} from './dto/system-info.dto';
import * as os from 'os';
import { LoggingService } from '../logging/logging.service';
import { LogQueryDto, UpdateLogSettingsDto } from './dto/logs.dto';
import { ConfigurationService } from '../configuration/configuration.service';
import { AdminCreateUserDto, AdminUpdateUserDto } from './dto/admin-user.dto';
import { CreateCalendarDto, UpdateCalendarDto } from '../dto/calendar.dto';
import { CreateEventDto, UpdateEventDto } from '../dto/event.dto';

export interface DatabaseStatsOverview {
  users: {
    total: number;
    active: number;
    admins: number;
  };
  calendars: {
    total: number;
  };
  events: {
    total: number;
  };
  shares: {
    total: number;
  };
  lastUpdated: string;
}

type OrganisationWithStats = Organisation & {
  adminCount: number;
  userCount: number;
  calendarCount: number;
};

type OrganizationUserWithRole = User & {
  organizationRole: OrganisationRoleType;
  assignedAt?: Date;
  isOrgAdmin: boolean;
};

interface PublicBookingInitializationResult {
  resourcesUpdated: number;
  resourceTypesWithHours: number;
  errors: string[];
}

export interface PublicBookingInitializationResponse
  extends PublicBookingInitializationResult {
  success: boolean;
  message: string;
  error?: string;
}

const hasRelatedUser = <T extends { user?: User | null }>(
  entity: T,
): entity is T & { user: User } => Boolean(entity.user);

type DataSourceExtraOptions = {
  max?: number;
  min?: number;
  connectionTimeoutMillis?: number;
};

type ExtendedDataSourceOptions = Omit<DataSourceOptions, 'extra'> & {
  extra?: DataSourceExtraOptions;
  poolSize?: number;
  host?: string;
  port?: number;
  database?: string;
  ssl?: boolean | Record<string, unknown>;
};

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
    @InjectRepository(AutomationRule)
    private automationRuleRepository: Repository<AutomationRule>,
    private dataSource: DataSource,
    private readonly loggingService: LoggingService,
    private readonly configurationService: ConfigurationService,
  ) {}

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.find({
      select: [
        'id',
        'username',
        'email',
        'firstName',
        'lastName',
        'role',
        'usagePlans',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
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

  async getDatabaseStats(): Promise<DatabaseStatsOverview> {
    const [userCount, calendarCount, eventCount, shareCount] =
      await Promise.all([
        this.userRepository.count(),
        this.calendarRepository.count(),
        this.eventRepository.count(),
        this.calendarShareRepository.count(),
      ]);

    const activeUsers = await this.userRepository.count({
      where: { isActive: true },
    });
    const adminUsers = await this.userRepository.count({
      where: { role: UserRole.ADMIN },
    });

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

  async updateUserRole(userId: number, role: UserRole): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.role = role;
    return this.userRepository.save(user);
  }

  async updateUserUsagePlans(
    userId: number,
    usagePlans: UsagePlan[],
  ): Promise<User> {
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
    const calendar = await this.calendarRepository.findOne({
      where: { id: calendarId },
    });
    if (!calendar) {
      throw new NotFoundException('Calendar not found');
    }

    await this.calendarRepository.remove(calendar);
    return { message: 'Calendar deleted successfully' };
  }

  async deleteEvent(eventId: number): Promise<{ message: string }> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await this.eventRepository.remove(event);
    return { message: 'Event deleted successfully' };
  }

  // CREATE OPERATIONS
  async createUser(createUserDto: AdminCreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.userRepository.save(user);
  }

  async createCalendar(
    createCalendarDto: CreateCalendarDto,
  ): Promise<Calendar> {
    const calendar = this.calendarRepository.create(createCalendarDto);
    return this.calendarRepository.save(calendar);
  }

  async createEvent(createEventDto: CreateEventDto): Promise<Event> {
    const event = this.eventRepository.create({
      ...createEventDto,
      startDate: new Date(createEventDto.startDate),
      endDate: createEventDto.endDate
        ? new Date(createEventDto.endDate)
        : undefined,
    });
    return this.eventRepository.save(event);
  }

  // UPDATE OPERATIONS
  async updateUser(
    userId: number,
    updateUserDto: AdminUpdateUserDto,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Don't update password here, use separate endpoint
    Object.assign(user, updateUserDto);

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

  async updateCalendar(
    calendarId: number,
    updateCalendarDto: UpdateCalendarDto,
  ): Promise<Calendar> {
    const calendar = await this.calendarRepository.findOne({
      where: { id: calendarId },
      relations: ['owner'],
    });
    if (!calendar) {
      throw new NotFoundException('Calendar not found');
    }

    Object.assign(calendar, updateCalendarDto);
    return await this.calendarRepository.save(calendar);
  }

  async updateEvent(
    eventId: number,
    updateEventDto: UpdateEventDto,
  ): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['calendar', 'createdBy'],
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const { startDate, endDate, ...rest } = updateEventDto;
    Object.assign(event, rest);

    if (startDate) {
      event.startDate = new Date(startDate);
    }
    if (endDate) {
      event.endDate = new Date(endDate);
    }
    return await this.eventRepository.save(event);
  }

  // GET SINGLE OPERATIONS
  async getUser(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'username',
        'email',
        'firstName',
        'lastName',
        'role',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async getCalendar(calendarId: number): Promise<Calendar> {
    const calendar = await this.calendarRepository.findOne({
      where: { id: calendarId },
      relations: ['owner'],
    });
    if (!calendar) {
      throw new NotFoundException('Calendar not found');
    }
    return calendar;
  }

  async getEvent(eventId: number): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['calendar', 'createdBy'],
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  // ORGANIZATION MANAGEMENT OPERATIONS
  async getAllOrganizations(): Promise<OrganisationWithStats[]> {
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

        const adminCount = orgUsers.filter(
          (ou) => ou.role === OrganisationRoleType.ADMIN,
        ).length;
        const userCount = orgUsers.length - adminCount;

        // Get calendar count for this organization
        // Calendars are linked through resource_types and resources
        const resourceTypes = await this.resourceTypeRepository.find({
          where: { organisationId: org.id },
          relations: ['resources'],
        });

        const calendarCount = resourceTypes.reduce((total, rt) => {
          return total + (rt.resources?.length || 0);
        }, 0);

        const organisationWithStats: OrganisationWithStats = {
          ...org,
          adminCount,
          userCount,
          calendarCount,
        };

        return organisationWithStats;
      }),
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

    return orgUsers.map((orgUser) => orgUser.organisation);
  }

  async addUserToOrganization(
    userId: number,
    organizationId: number,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const organization = await this.organisationRepository.findOne({
      where: { id: organizationId },
    });
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

  async removeUserFromOrganization(
    userId: number,
    organizationId: number,
  ): Promise<{ message: string }> {
    const orgUser = await this.organisationUserRepository.findOne({
      where: { userId, organisationId: organizationId },
    });

    if (!orgUser) {
      throw new NotFoundException('User is not a member of this organization');
    }

    await this.organisationUserRepository.remove(orgUser);
    return { message: 'User removed from organization successfully' };
  }

  async getOrganizationUsers(
    organizationId: number,
  ): Promise<OrganizationUserWithRole[]> {
    const organization = await this.organisationRepository.findOne({
      where: { id: organizationId },
    });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    console.log(
      `AdminService.getOrganizationUsers called for org #${organizationId}`,
    );

    // Get users from organisation_users table
    const orgUsers = await this.organisationUserRepository.find({
      where: { organisationId: organizationId },
      relations: ['user'],
    });
    console.log(
      `Found ${orgUsers.length} users in organisation_users table:`,
      orgUsers.map((user) => `${user.userId}:${user.role}`),
    );

    // Get users from organisation_admins table
    const orgAdmins = await this.organisationAdminRepository.find({
      where: { organisationId: organizationId },
      relations: ['user'],
    });
    console.log(
      `Found ${orgAdmins.length} admins in organisation_admins table:`,
      orgAdmins.map((admin) => admin.userId),
    );

    // Convert OrganisationAdmin records to user format with ADMIN role
    const adminUsers: OrganizationUserWithRole[] = orgAdmins
      .filter(hasRelatedUser)
      .map((admin) => ({
        ...admin.user,
        organizationRole: OrganisationRoleType.ADMIN,
        assignedAt: admin.assignedAt,
        isOrgAdmin: true,
      }));

    // Convert OrganisationUser records to user format
    const regularUsers: OrganizationUserWithRole[] = orgUsers
      .filter(hasRelatedUser)
      .map((orgUser) => ({
        ...orgUser.user,
        organizationRole: orgUser.role,
        assignedAt: orgUser.assignedAt,
        isOrgAdmin: false,
      }));

    // Combine both lists, removing duplicates (prefer ADMIN role if user is in both tables)
    const userMap = new Map<number, OrganizationUserWithRole>();

    // First add regular org users
    regularUsers.forEach((user) => userMap.set(user.id, user));

    // Then add/override with org admins (ADMIN takes precedence)
    adminUsers.forEach((user) => userMap.set(user.id, user));

    const result = Array.from(userMap.values());
    console.log(
      `Final result: ${result.length} users total:`,
      result.map((user) => `${user.id}:${user.organizationRole}`),
    );

    return result;
  }
  async addUserToOrganizationWithRole(
    userId: number,
    organizationId: number,
    role: OrganisationRoleType,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const organization = await this.organisationRepository.findOne({
      where: { id: organizationId },
    });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check if user is already in the organization
    const existingOrgUser = await this.organisationUserRepository.findOne({
      where: { userId, organisationId: organizationId },
    });

    if (existingOrgUser) {
      // Update existing role
      existingOrgUser.role = role;
      await this.organisationUserRepository.save(existingOrgUser);
      return { message: 'User role updated in organization successfully' };
    }

    // Add user to organization with specified role
    const orgUser = this.organisationUserRepository.create({
      userId,
      organisationId: organizationId,
      role,
    });

    await this.organisationUserRepository.save(orgUser);
    return { message: 'User added to organization successfully' };
  }

  // PUBLIC BOOKING INITIALIZATION
  async initializePublicBooking(): Promise<PublicBookingInitializationResponse> {
    const results: PublicBookingInitializationResult = {
      resourcesUpdated: 0,
      resourceTypesWithHours: 0,
      errors: [] as string[],
    };

    try {
      // 1. Generate public booking tokens for all resources that don't have one
      const resources = await this.resourceRepository.find({
        where: { publicBookingToken: IsNull() },
      });

      console.log(
        `Found ${resources.length} resources without public booking tokens`,
      );

      for (const resource of resources) {
        try {
          resource.publicBookingToken = randomUUID();
          await this.resourceRepository.save(resource);
          results.resourcesUpdated++;
          console.log(`Generated token for resource: ${resource.name}`);
        } catch {
          results.errors.push(
            `Failed to generate token for resource ${resource.id}`,
          );
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
        {
          dayOfWeek: 0,
          openTime: '10:00',
          closeTime: '14:00',
          isActive: false,
        }, // Sunday (closed)
      ];

      for (const resourceType of resourceTypes) {
        if (
          !resourceType.operatingHours ||
          resourceType.operatingHours.length === 0
        ) {
          try {
            for (const hours of defaultHours) {
              const operatingHour = this.operatingHoursRepository.create({
                ...hours,
                resourceType: resourceType,
              });
              await this.operatingHoursRepository.save(operatingHour);
            }
            results.resourceTypesWithHours++;
            console.log(`Created operating hours for: ${resourceType.name}`);
          } catch {
            results.errors.push(
              `Failed to create operating hours for resource type ${resourceType.id}`,
            );
          }
        }
      }

      return {
        success: true,
        message: 'Public booking initialization completed',
        ...results,
      };
    } catch (error: any) {
      logError(error, buildErrorContext({ action: 'admin.service' }));
      const normalizedError = this.normalizeError(error);
      console.error('Error initializing public booking:', normalizedError);
      return {
        success: false,
        message: 'Public booking initialization failed',
        error: normalizedError.message,
        ...results,
      };
    }
  }

  /**
   * Get comprehensive system information
   * Includes server stats, database config, environment settings, and feature flags
   */
  async getLogs(query: LogQueryDto) {
    const { levels, contexts, search, limit, offset, from, to } = query;

    const normalizedLevels = Array.isArray(levels)
      ? levels.filter(Boolean)
      : [];
    const normalizedContexts = Array.isArray(contexts)
      ? contexts.filter(Boolean)
      : [];

    const logs = await this.loggingService.findLogs({
      levels: normalizedLevels.length > 0 ? normalizedLevels : undefined,
      contexts: normalizedContexts.length > 0 ? normalizedContexts : undefined,
      search,
      limit,
      offset,
      from: this.parseDate(from),
      to: this.parseDate(to),
    });

    const settings = await this.loggingService.getSettings();

    return {
      items: logs,
      count: logs.length,
      settings,
    };
  }

  async clearLogs(beforeRaw?: string) {
    const before = this.parseDate(beforeRaw);
    const deleted = await this.loggingService.clearLogs(
      before ? { before } : {},
    );

    return {
      success: true,
      deleted,
    };
  }

  async runLogRetention() {
    const deleted = await this.loggingService.purgeExpiredLogs();
    return {
      success: true,
      deleted,
    };
  }

  async getLogSettings() {
    return this.loggingService.getSettings();
  }

  async updateLogSettings(dto: UpdateLogSettingsDto) {
    const settings = await this.loggingService.updateSettings(dto);
    return {
      success: true,
      settings,
    };
  }

  private parseDate(value?: string): Date | undefined {
    if (!value) {
      return undefined;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return undefined;
    }

    return parsed;
  }

  async getSystemInfo(): Promise<SystemInfoDto> {
    const packageVersion = this.getPackageVersion();

    // Server Information
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const serverInfo: ServerInfoDto = {
      nodeVersion: process.version,
      platform: `${os.platform()} ${os.release()}`,
      architecture: os.arch(),
      uptime: process.uptime(),
      memoryUsage: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      },
      cpuUsage: {
        user: Math.round(cpuUsage.user / 1000), // milliseconds
        system: Math.round(cpuUsage.system / 1000), // milliseconds
      },
    };

    // Database Information
    const dbOptions = this.dataSource.options as ExtendedDataSourceOptions;
    const databaseName =
      typeof dbOptions.database === 'string' ? dbOptions.database : undefined;
    const databaseHost =
      typeof dbOptions.host === 'string' ? dbOptions.host : undefined;
    const databasePort =
      typeof dbOptions.port === 'number' ? dbOptions.port : undefined;
    const poolMax =
      typeof dbOptions.extra?.max === 'number'
        ? dbOptions.extra.max
        : dbOptions.poolSize;
    const poolMin =
      typeof dbOptions.extra?.min === 'number' ? dbOptions.extra.min : 2;
    const connectionTimeout =
      typeof dbOptions.extra?.connectionTimeoutMillis === 'number'
        ? dbOptions.extra.connectionTimeoutMillis
        : 10000;

    const databaseInfo: DatabaseInfoDto = {
      type: dbOptions.type,
      host: databaseHost,
      port: databasePort,
      database: databaseName,
      ssl: Boolean(dbOptions.ssl),
      poolMax: poolMax ?? 10,
      poolMin,
      connectionTimeout,
      synchronized: Boolean(dbOptions.synchronize),
    };

    // Environment Information
    const baseUrl =
      this.configurationService.getValue('BASE_URL') ||
      process.env.BASE_URL ||
      'http://localhost';

    const backendPortValue =
      this.configurationService.getValue('BACKEND_PORT') ??
      this.configurationService.getValue('PORT') ??
      process.env.BACKEND_PORT ??
      process.env.PORT ??
      '8081';
    const parsedBackendPort = parseInt(backendPortValue, 10);
    const backendPort = Number.isNaN(parsedBackendPort)
      ? 8081
      : parsedBackendPort;

    const environmentInfo: EnvironmentInfoDto = {
      nodeEnv:
        this.configurationService.getValue('NODE_ENV') ||
        process.env.NODE_ENV ||
        'development',
      port: backendPort,
      baseUrl,
      frontendUrl: this.configurationService.getFrontendBaseUrl(),
      backendUrl: this.configurationService.getBackendBaseUrl(),
    };

    // Feature Flags
    const enableOAuth = this.configurationService.getBoolean(
      'ENABLE_OAUTH',
      true,
    );
    const featureFlags: FeatureFlagsDto = {
      googleOAuthEnabled:
        enableOAuth &&
        !!(
          this.configurationService.getValue('GOOGLE_CLIENT_ID') &&
          this.configurationService.getValue('GOOGLE_CLIENT_SECRET')
        ),
      microsoftOAuthEnabled:
        enableOAuth &&
        !!(
          this.configurationService.getValue('MICROSOFT_CLIENT_ID') &&
          this.configurationService.getValue('MICROSOFT_CLIENT_SECRET')
        ),
      calendarSyncEnabled: this.configurationService.getBoolean(
        'ENABLE_CALENDAR_SYNC',
        true,
      ),
      automationEnabled: this.configurationService.getBoolean(
        'ENABLE_AUTOMATION',
        true,
      ),
      reservationsEnabled: this.configurationService.getBoolean(
        'ENABLE_RESERVATIONS',
        true,
      ),
      organisationsEnabled: true,
    };

    // Database Statistics
    const [
      userCount,
      calendarCount,
      eventCount,
      reservationCount,
      automationRuleCount,
      organisationCount,
    ] = await Promise.all([
      this.userRepository.count(),
      this.calendarRepository.count(),
      this.eventRepository.count(),
      this.reservationRepository.count(),
      this.automationRuleRepository.count(),
      this.organisationRepository.count(),
    ]);

    const databaseStats: DatabaseStatsDto = {
      users: userCount,
      calendars: calendarCount,
      events: eventCount,
      reservations: reservationCount,
      automationRules: automationRuleCount,
      organisations: organisationCount,
    };

    const systemInfo: SystemInfoDto = {
      server: serverInfo,
      database: databaseInfo,
      environment: environmentInfo,
      features: featureFlags,
      stats: databaseStats,
      timestamp: new Date().toISOString(),
      version: packageVersion,
    };

    return systemInfo;
  }

  private normalizeError(error: any): Error {
    return error instanceof Error ? error : new Error(String(error));
  }

  private getPackageVersion(): string {
    try {
      const packageJsonPath = join(process.cwd(), 'package.json');
      const packageRaw = readFileSync(packageJsonPath, 'utf8');
      const parsed = JSON.parse(packageRaw);
      if (
        parsed &&
        typeof parsed === 'object' &&
        'version' in parsed &&
        typeof (parsed as { version?: any }).version === 'string'
      ) {
        return (parsed as { version: string }).version;
      }
      return '1.3.0';
    } catch {
      return '1.3.0';
    }
  }
}
