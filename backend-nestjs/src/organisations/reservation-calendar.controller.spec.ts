import { ReservationCalendarController } from './reservation-calendar.controller';
import { ReservationCalendarRoleType } from '../entities/reservation-calendar-role.entity';

jest.mock('../i18n/runtime', () => ({
  bStatic: (key: string) => key,
}));

describe('ReservationCalendarController', () => {
  const reservationCalendarService = {
    createReservationCalendar: jest.fn(),
    getOrganisationReservationCalendars: jest.fn(),
    assignCalendarRole: jest.fn(),
    removeCalendarRole: jest.fn(),
    getCalendarRoles: jest.fn(),
    getUserReservationCalendars: jest.fn(),
    getUserCalendarRole: jest.fn(),
    hasCalendarRole: jest.fn(),
  };

  let controller: ReservationCalendarController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new ReservationCalendarController(
      reservationCalendarService as never,
    );
  });

  it('creates reservation calendars and returns translated response envelope', async () => {
    reservationCalendarService.createReservationCalendar.mockResolvedValueOnce({
      id: 55,
      organisationId: 9,
    });

    const result = await controller.createReservationCalendar(
      9,
      {
        name: 'Reservations',
      } as never,
      { id: 7 } as never,
    );

    expect(reservationCalendarService.createReservationCalendar).toHaveBeenCalledWith(
      9,
      expect.objectContaining({ name: 'Reservations' }),
      expect.objectContaining({ id: 7 }),
    );
    expect(result).toEqual({
      message: 'errors.auto.backend.kf29ecd8b3ec4',
      data: { id: 55, organisationId: 9 },
    });
  });

  it('delegates organisation/list/role retrieval methods', async () => {
    reservationCalendarService.getOrganisationReservationCalendars.mockResolvedValueOnce(
      [{ id: 1 }],
    );
    reservationCalendarService.getCalendarRoles.mockResolvedValueOnce([
      { id: 2 },
    ]);
    reservationCalendarService.getUserReservationCalendars.mockResolvedValueOnce(
      [{ id: 3 }],
    );
    reservationCalendarService.getUserCalendarRole.mockResolvedValueOnce({
      id: 4,
      role: ReservationCalendarRoleType.EDITOR,
    });

    await expect(controller.getOrganisationReservationCalendars(9)).resolves.toEqual({
      message: 'errors.auto.backend.k546342b267e4',
      data: [{ id: 1 }],
    });
    await expect(controller.getCalendarRoles(12)).resolves.toEqual({
      message: 'errors.auto.backend.k522e58a22aad',
      data: [{ id: 2 }],
    });
    await expect(
      controller.getUserReservationCalendars({ id: 7 } as never),
    ).resolves.toEqual({
      message: 'errors.auto.backend.k71edb36e1151',
      data: [{ id: 3 }],
    });
    await expect(
      controller.getUserCalendarRole(12, { id: 7 } as never),
    ).resolves.toEqual({
      message: 'errors.auto.backend.kb19891a1ee1f',
      data: { id: 4, role: ReservationCalendarRoleType.EDITOR },
    });
  });

  it('assigns and removes reservation calendar roles', async () => {
    reservationCalendarService.assignCalendarRole.mockResolvedValueOnce({
      id: 33,
      userId: 88,
      role: ReservationCalendarRoleType.REVIEWER,
    });
    reservationCalendarService.removeCalendarRole.mockResolvedValueOnce(
      undefined,
    );

    await expect(
      controller.assignCalendarRole(
        12,
        {
          userId: 88,
          role: ReservationCalendarRoleType.REVIEWER,
        },
        { id: 7 } as never,
      ),
    ).resolves.toEqual({
      message: 'errors.auto.backend.k168ee03bd6b6',
      data: { id: 33, userId: 88, role: ReservationCalendarRoleType.REVIEWER },
    });

    await expect(
      controller.removeCalendarRole(12, 88, { id: 7 } as never),
    ).resolves.toEqual({
      message: 'errors.auto.backend.kb4dddc1788c7',
    });
    expect(reservationCalendarService.removeCalendarRole).toHaveBeenCalledWith(
      12,
      88,
      expect.objectContaining({ id: 7 }),
    );
  });

  it('returns role-check result envelope for hasCalendarRole', async () => {
    reservationCalendarService.hasCalendarRole.mockResolvedValueOnce(true);

    await expect(
      controller.hasCalendarRole(
        12,
        ReservationCalendarRoleType.EDITOR,
        { id: 7 } as never,
      ),
    ).resolves.toEqual({
      message: 'errors.auto.backend.k364dde03730e',
      data: { hasRole: true },
    });
  });

  it('returns static example payloads for reservation endpoints guarded by role decorators', async () => {
    await expect(
      controller.createReservation(12, { id: 7 } as never),
    ).resolves.toEqual({
      message: 'errors.auto.backend.k36dbeb621c2c',
      data: { reservationCalendarId: 12, userId: 7 },
    });

    await expect(controller.getReservations(12)).resolves.toEqual({
      message: 'errors.auto.backend.kfefa55e83d03',
      data: { reservationCalendarId: 12, userRole: 'editor or reviewer' },
    });

    await expect(
      controller.approveReservation(12, 99, { id: 7 } as never),
    ).resolves.toEqual({
      message: 'errors.auto.backend.k14e4cde25066',
      data: { reservationCalendarId: 12, reservationId: 99, approvedBy: 7 },
    });
  });
});
