import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ReservationCalendarGuard } from './reservation-calendar.guard';
import { ReservationCalendarRoleType } from '../../entities/reservation-calendar-role.entity';
import { UserRole } from '../../entities/user.entity';

jest.mock('../../i18n/runtime', () => ({
  bStatic: (key: string) => key,
}));

describe('ReservationCalendarGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  };
  const reservationCalendarRoleRepository = {
    findOne: jest.fn(),
  };
  const reservationCalendarRepository = {
    findOne: jest.fn(),
  };
  const organisationAdminRepository = {
    findOne: jest.fn(),
  };

  let guard: ReservationCalendarGuard;

  const buildExecutionContext = (request: Record<string, unknown>) =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => 'handler',
      getClass: () => 'class',
    }) as never;

  beforeEach(() => {
    jest.clearAllMocks();
    reflector.getAllAndOverride.mockReturnValue(undefined);
    guard = new ReservationCalendarGuard(
      reflector as unknown as Reflector,
      reservationCalendarRoleRepository as never,
      reservationCalendarRepository as never,
      organisationAdminRepository as never,
    );
  });

  it('rejects requests without an authenticated user', async () => {
    await expect(
      guard.canActivate(buildExecutionContext({ params: { id: '11' } })),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(reservationCalendarRepository.findOne).not.toHaveBeenCalled();
  });

  it('allows global admins without additional checks', async () => {
    const result = await guard.canActivate(
      buildExecutionContext({
        user: { id: 7, role: UserRole.ADMIN },
        params: { id: '11' },
      }),
    );

    expect(result).toBe(true);
    expect(reservationCalendarRepository.findOne).not.toHaveBeenCalled();
    expect(organisationAdminRepository.findOne).not.toHaveBeenCalled();
    expect(reservationCalendarRoleRepository.findOne).not.toHaveBeenCalled();
  });

  it('rejects when no reservation calendar id is present in route params', async () => {
    await expect(
      guard.canActivate(
        buildExecutionContext({
          user: { id: 3, role: UserRole.USER },
          params: {},
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects when the reservation calendar does not exist', async () => {
    reservationCalendarRepository.findOne.mockResolvedValueOnce(null);

    await expect(
      guard.canActivate(
        buildExecutionContext({
          user: { id: 3, role: UserRole.USER },
          params: { reservationCalendarId: '99' },
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(reservationCalendarRepository.findOne).toHaveBeenCalledWith({
      where: { id: 99 },
    });
  });

  it('allows organisation admins for the reservation calendar organisation', async () => {
    reservationCalendarRepository.findOne.mockResolvedValueOnce({
      id: 11,
      organisationId: 42,
    });
    organisationAdminRepository.findOne.mockResolvedValueOnce({
      id: 1,
      userId: 3,
      organisationId: 42,
    });

    const result = await guard.canActivate(
      buildExecutionContext({
        user: { id: 3, role: UserRole.USER },
        params: { calendarId: '11' },
      }),
    );

    expect(result).toBe(true);
    expect(organisationAdminRepository.findOne).toHaveBeenCalledWith({
      where: { userId: 3, organisationId: 42 },
    });
    expect(reservationCalendarRoleRepository.findOne).not.toHaveBeenCalled();
  });

  it('rejects users who do not have a role on the reservation calendar', async () => {
    reservationCalendarRepository.findOne.mockResolvedValueOnce({
      id: 11,
      organisationId: 42,
    });
    organisationAdminRepository.findOne.mockResolvedValueOnce(null);
    reservationCalendarRoleRepository.findOne.mockResolvedValueOnce(null);

    await expect(
      guard.canActivate(
        buildExecutionContext({
          user: { id: 3, role: UserRole.USER },
          params: { id: '11' },
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects when required role metadata is present but user role does not match', async () => {
    reservationCalendarRepository.findOne.mockResolvedValueOnce({
      id: 11,
      organisationId: 42,
    });
    organisationAdminRepository.findOne.mockResolvedValueOnce(null);
    reservationCalendarRoleRepository.findOne.mockResolvedValueOnce({
      role: ReservationCalendarRoleType.EDITOR,
    });
    reflector.getAllAndOverride.mockReturnValueOnce([
      ReservationCalendarRoleType.REVIEWER,
    ]);

    await expect(
      guard.canActivate(
        buildExecutionContext({
          user: { id: 3, role: UserRole.USER },
          params: { id: '11' },
        }),
      ),
    ).rejects.toThrow('Required role: reviewer, User has: editor');
  });

  it('allows access when the required role matches the user role', async () => {
    reservationCalendarRepository.findOne.mockResolvedValueOnce({
      id: 11,
      organisationId: 42,
    });
    organisationAdminRepository.findOne.mockResolvedValueOnce(null);
    reservationCalendarRoleRepository.findOne.mockResolvedValueOnce({
      role: ReservationCalendarRoleType.REVIEWER,
    });
    reflector.getAllAndOverride.mockReturnValueOnce([
      ReservationCalendarRoleType.EDITOR,
      ReservationCalendarRoleType.REVIEWER,
    ]);

    const result = await guard.canActivate(
      buildExecutionContext({
        user: { id: 3, role: UserRole.USER },
        params: { id: '11' },
      }),
    );

    expect(result).toBe(true);
  });
});
