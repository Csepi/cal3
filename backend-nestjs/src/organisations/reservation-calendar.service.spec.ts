import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ReservationCalendarService } from './reservation-calendar.service';
import { ReservationCalendarRoleType } from '../entities/reservation-calendar-role.entity';
import { UserRole, UsagePlan } from '../entities/user.entity';

jest.mock('../i18n/runtime', () => ({
  bStatic: (key: string) => key,
}));

describe('ReservationCalendarService', () => {
  const reservationCalendarRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };
  const reservationCalendarRoleRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };
  const calendarRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };
  const organisationRepository = {
    findOne: jest.fn(),
  };
  const userRepository = {
    findOne: jest.fn(),
  };
  const organisationAdminService = {
    isOrganisationAdmin: jest.fn(),
    getOrganisationAdmins: jest.fn(),
  };

  let service: ReservationCalendarService;

  const adminUser = { id: 1, role: UserRole.ADMIN };
  const orgAdminUser = { id: 2, role: UserRole.USER };

  beforeEach(() => {
    jest.clearAllMocks();

    reservationCalendarRepository.create.mockImplementation((payload) => ({
      id: 300,
      ...payload,
    }));
    reservationCalendarRepository.save.mockImplementation(async (payload) => payload);
    reservationCalendarRepository.findOne.mockResolvedValue(null);
    reservationCalendarRepository.find.mockResolvedValue([]);

    reservationCalendarRoleRepository.create.mockImplementation((payload) => ({
      id: 200,
      ...payload,
    }));
    reservationCalendarRoleRepository.save.mockImplementation(async (payload) => payload);
    reservationCalendarRoleRepository.findOne.mockResolvedValue(null);
    reservationCalendarRoleRepository.find.mockResolvedValue([]);
    reservationCalendarRoleRepository.remove.mockResolvedValue(undefined);

    calendarRepository.create.mockImplementation((payload) => ({
      id: 100,
      ...payload,
    }));
    calendarRepository.save.mockImplementation(async (payload) => payload);
    calendarRepository.findOne.mockResolvedValue(null);

    organisationRepository.findOne.mockResolvedValue({ id: 44, name: 'Acme' });
    userRepository.findOne.mockResolvedValue(null);

    organisationAdminService.isOrganisationAdmin.mockResolvedValue(true);
    organisationAdminService.getOrganisationAdmins.mockResolvedValue([]);

    service = new ReservationCalendarService(
      reservationCalendarRepository as never,
      reservationCalendarRoleRepository as never,
      calendarRepository as never,
      organisationRepository as never,
      userRepository as never,
      organisationAdminService as never,
    );
  });

  it('creates reservation calendars with defaults and auto-assigns organisation admins', async () => {
    calendarRepository.save.mockResolvedValueOnce({ id: 101, ownerId: 2 });
    reservationCalendarRepository.save.mockResolvedValueOnce({
      id: 301,
      calendarId: 101,
      organisationId: 44,
      createdById: 2,
      reservationRules: '{"approvalRequired":true}',
    });
    organisationAdminService.getOrganisationAdmins.mockResolvedValueOnce([
      { userId: 12 },
    ]);

    const result = await service.createReservationCalendar(
      44,
      {
        name: 'Main bookings',
        reservationRules: { approvalRequired: true },
      },
      orgAdminUser as never,
    );

    expect(calendarRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Main bookings',
        color: '#3b82f6',
        isReservationCalendar: true,
        organisationId: 44,
        ownerId: 2,
      }),
    );
    expect(reservationCalendarRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        calendarId: 101,
        organisationId: 44,
        createdById: 2,
        reservationRules: '{"approvalRequired":true}',
      }),
    );
    expect(reservationCalendarRoleRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        reservationCalendarId: 301,
        userId: 12,
        role: ReservationCalendarRoleType.EDITOR,
        isOrganisationAdmin: true,
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 301,
        calendarId: 101,
      }),
    );
  });

  it('throws when creating a reservation calendar for a missing organisation', async () => {
    organisationRepository.findOne.mockResolvedValueOnce(null);

    await expect(
      service.createReservationCalendar(
        404,
        { name: 'Ghost org calendar' } as never,
        adminUser as never,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects role assignment when user is not a member of the reservation calendar organisation', async () => {
    reservationCalendarRepository.findOne.mockResolvedValueOnce({
      id: 300,
      organisationId: 44,
    });
    userRepository.findOne.mockResolvedValueOnce({
      id: 99,
      organisations: [{ id: 999 }],
    });

    await expect(
      service.assignCalendarRole(
        300,
        {
          userId: 99,
          role: ReservationCalendarRoleType.EDITOR,
        },
        adminUser as never,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates existing role assignments instead of creating duplicates', async () => {
    reservationCalendarRepository.findOne.mockResolvedValueOnce({
      id: 300,
      organisationId: 44,
    });
    userRepository.findOne.mockResolvedValueOnce({
      id: 99,
      organisations: [{ id: 44 }],
    });
    reservationCalendarRoleRepository.findOne.mockResolvedValueOnce({
      id: 600,
      reservationCalendarId: 300,
      userId: 99,
      role: ReservationCalendarRoleType.EDITOR,
      assignedById: 1,
    });
    reservationCalendarRoleRepository.save.mockImplementationOnce(
      async (payload) => payload,
    );

    const result = await service.assignCalendarRole(
      300,
      {
        userId: 99,
        role: ReservationCalendarRoleType.REVIEWER,
      },
      adminUser as never,
    );

    expect(reservationCalendarRoleRepository.create).not.toHaveBeenCalled();
    expect(reservationCalendarRoleRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 600,
        role: ReservationCalendarRoleType.REVIEWER,
        assignedById: 1,
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 600,
        role: ReservationCalendarRoleType.REVIEWER,
      }),
    );
  });

  it('rejects removing auto-assigned organisation admin roles', async () => {
    reservationCalendarRepository.findOne.mockResolvedValueOnce({
      id: 300,
      organisationId: 44,
    });
    reservationCalendarRoleRepository.findOne.mockResolvedValueOnce({
      id: 777,
      reservationCalendarId: 300,
      userId: 88,
      isOrganisationAdmin: true,
    });

    await expect(
      service.removeCalendarRole(300, 88, adminUser as never),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(reservationCalendarRoleRepository.remove).not.toHaveBeenCalled();
  });

  it('returns no reservation calendars when user is missing or lacks eligible plans', async () => {
    userRepository.findOne.mockResolvedValueOnce(null);
    await expect(service.getUserReservationCalendars(91)).resolves.toEqual([]);

    userRepository.findOne.mockResolvedValueOnce({
      id: 91,
      role: UserRole.USER,
      usagePlans: [UsagePlan.USER],
      organisations: [{ id: 44 }],
      organisationAdminRoles: [],
    });

    await expect(service.getUserReservationCalendars(91)).resolves.toEqual([]);
    expect(reservationCalendarRoleRepository.find).not.toHaveBeenCalled();
  });

  it('merges explicit and organisation-based calendar access without duplicates', async () => {
    userRepository.findOne.mockResolvedValueOnce({
      id: 50,
      role: UserRole.USER,
      usagePlans: [UsagePlan.STORE],
      organisations: [{ id: 44 }],
      organisationAdminRoles: [],
    });
    reservationCalendarRoleRepository.find.mockResolvedValueOnce([
      {
        reservationCalendar: { id: 1, organisationId: 44, calendar: { name: 'A' } },
      },
      {
        reservationCalendar: { id: 2, organisationId: 44, calendar: { name: 'B' } },
      },
    ]);
    reservationCalendarRepository.find.mockResolvedValueOnce([
      { id: 1, organisationId: 44, calendar: { name: 'A' } },
      { id: 3, organisationId: 44, calendar: { name: 'C' } },
    ]);

    const result = await service.getUserReservationCalendars(50);

    expect(result.map((calendar) => calendar.id).sort()).toEqual([1, 2, 3]);
    expect(reservationCalendarRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organisationId: expect.any(Object),
        }),
      }),
    );
  });
});
