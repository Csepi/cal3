import { OrganisationRoleType } from '../../entities/organisation-user.entity';
import { UserRole, type User } from '../../entities/user.entity';
import { RbacPermissionService } from './rbac-permission.service';

describe('RbacPermissionService', () => {
  const organisationUserRepository = {
    findOne: jest.fn(),
  };
  const organisationAdminRepository = {
    findOne: jest.fn(),
  };

  let service: RbacPermissionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RbacPermissionService(
      organisationUserRepository as never,
      organisationAdminRepository as never,
    );
  });

  it('allows global admins for all permissions', async () => {
    const user = buildUser(UserRole.ADMIN);
    const allowed = await service.hasPermission(
      user,
      { permission: 'organisation:delete' },
      {},
    );

    expect(allowed).toBe(true);
  });

  it('enforces organisation role hierarchy for permissions', async () => {
    organisationAdminRepository.findOne.mockResolvedValue(null);
    organisationUserRepository.findOne.mockResolvedValue({
      role: OrganisationRoleType.EDITOR,
    });

    await expect(
      service.hasPermission(
        buildUser(UserRole.USER),
        { permission: 'resource:write' },
        { organisationId: 12 },
      ),
    ).resolves.toBe(true);

    await expect(
      service.hasPermission(
        buildUser(UserRole.USER),
        { permission: 'organisation:admin' },
        { organisationId: 12 },
      ),
    ).resolves.toBe(false);
  });

  it('allows organisation admins to satisfy organisation role checks', async () => {
    organisationAdminRepository.findOne.mockResolvedValue({ id: 99 });

    await expect(
      service.hasRequiredRole(
        buildUser(UserRole.USER),
        OrganisationRoleType.EDITOR,
        { organisationId: 3 },
      ),
    ).resolves.toBe(true);
  });

  it('rejects organisation-scoped checks without organisation context', async () => {
    await expect(
      service.hasPermission(buildUser(UserRole.USER), {
        permission: 'resource:read',
      }),
    ).resolves.toBe(false);
  });
});

function buildUser(role: UserRole): User {
  return {
    id: 42,
    role,
  } as User;
}

