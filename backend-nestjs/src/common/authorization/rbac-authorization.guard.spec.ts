import {
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../entities/user.entity';
import { RbacAuthorizationGuard } from './rbac-authorization.guard';

describe('RbacAuthorizationGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;
  const permissionService = {
    hasPermission: jest.fn(),
    hasRequiredRole: jest.fn(),
  };
  const auditTrailService = {
    logPermissionCheck: jest.fn(async () => undefined),
  };
  const guard = new RbacAuthorizationGuard(
    reflector,
    permissionService as never,
    auditTrailService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows requests when no metadata is present', async () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(undefined);
    const context = buildContext({});

    await expect(guard.canActivate(context as never)).resolves.toBe(true);
  });

  it('rejects missing authenticated user when metadata requires checks', async () => {
    reflector.getAllAndOverride = jest
      .fn()
      .mockReturnValueOnce([{ permission: 'organisation:read' }])
      .mockReturnValueOnce([]);
    const context = buildContext({});

    await expect(guard.canActivate(context as never)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects when required permission is missing', async () => {
    reflector.getAllAndOverride = jest
      .fn()
      .mockReturnValueOnce([
        { permission: 'organisation:admin', organisationIdParam: 'id' },
      ])
      .mockReturnValueOnce([]);
    permissionService.hasPermission.mockResolvedValue(false);

    const context = buildContext({
      user: { id: 1, role: UserRole.USER },
      params: { id: '10' },
    });

    await expect(guard.canActivate(context as never)).rejects.toThrow(
      ForbiddenException,
    );
    expect(auditTrailService.logPermissionCheck).toHaveBeenCalled();
  });
});

function buildContext(request: Record<string, unknown>) {
  return {
    getClass: () => ({}),
    getHandler: () => ({}),
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  };
}
