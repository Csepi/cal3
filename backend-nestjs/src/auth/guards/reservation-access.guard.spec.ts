import { ForbiddenException } from '@nestjs/common';
import { ReservationAccessGuard } from './reservation-access.guard';

describe('ReservationAccessGuard', () => {
  const userPermissionsService = {
    hasReservationAccess: jest.fn(),
  };

  let guard: ReservationAccessGuard;

  const buildExecutionContext = (request: Record<string, unknown>) =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as never;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new ReservationAccessGuard(userPermissionsService as never);
  });

  it('allows access for users with reservation plans', async () => {
    userPermissionsService.hasReservationAccess.mockReturnValue(true);

    const result = await guard.canActivate(
      buildExecutionContext({
        user: {
          id: 8,
          usagePlans: ['store'],
        },
      }),
    );

    expect(result).toBe(true);
    expect(userPermissionsService.hasReservationAccess).toHaveBeenCalledWith(
      expect.objectContaining({ id: 8 }),
    );
  });

  it('rejects requests without an authenticated user', async () => {
    await expect(
      guard.canActivate(buildExecutionContext({})),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(userPermissionsService.hasReservationAccess).not.toHaveBeenCalled();
  });

  it('rejects users without reservation access', async () => {
    userPermissionsService.hasReservationAccess.mockReturnValue(false);

    await expect(
      guard.canActivate(
        buildExecutionContext({
          user: {
            id: 13,
            usagePlans: ['user'],
          },
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(userPermissionsService.hasReservationAccess).toHaveBeenCalledWith(
      expect.objectContaining({ id: 13 }),
    );
  });
});
