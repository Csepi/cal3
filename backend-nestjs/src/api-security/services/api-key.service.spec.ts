import { ForbiddenException } from '@nestjs/common';
import { createHash } from 'crypto';
import { ApiKeyScope, ApiKeyTier } from '../../entities/api-key.entity';
import { UsagePlan, User, UserRole } from '../../entities/user.entity';
import { ApiKeyService } from './api-key.service';

const hashSecret = (secret: string): string =>
  createHash('sha256')
    .update(`${secret}:cal3-api-key-pepper`)
    .digest('hex');

describe('ApiKeyService', () => {
  const apiKeyRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    increment: jest.fn(),
    update: jest.fn(),
  };
  const userRepository = {
    findOne: jest.fn(),
  };

  let service: ApiKeyService;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.API_KEY_PEPPER;
    service = new ApiKeyService(
      apiKeyRepository as never,
      userRepository as never,
    );
  });

  it('creates API key and returns plaintext once', async () => {
    const user = {
      id: 4,
      isActive: true,
      usagePlans: [UsagePlan.USER],
    } as User;
    userRepository.findOne.mockResolvedValue(user);
    apiKeyRepository.create.mockImplementation((payload) => payload);
    apiKeyRepository.save.mockImplementation(async (payload) => ({
      ...payload,
      id: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = await service.createForUser(4, {
      name: 'integration-key',
      scopes: [ApiKeyScope.READ, ApiKeyScope.WRITE],
    });

    expect(result.apiKey.startsWith('pk_')).toBe(true);
    expect(result.key.id).toBe(1);
    expect(result.key.scopes).toEqual([ApiKeyScope.READ, ApiKeyScope.WRITE]);
  });

  it('rejects write access when key only has read scope', async () => {
    const user = {
      id: 8,
      isActive: true,
      username: 'u',
      email: 'u@example.com',
      password: '',
      firstName: '',
      lastName: '',
      role: UserRole.USER,
      themeColor: '#000000',
      weekStartDay: 1,
      defaultCalendarView: 'month',
      timezone: 'UTC',
      timeFormat: '24h',
      language: 'en',
      defaultTasksCalendarId: null,
      tasksSettings: null,
      usagePlans: [UsagePlan.USER],
      hideReservationsTab: false,
      hiddenResourceIds: [],
      visibleCalendarIds: [],
      visibleResourceTypeIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ownedCalendars: [],
      sharedCalendars: [],
      createdEvents: [],
      organisations: [],
      organisationAdminRoles: [],
      assignedOrganisationAdminRoles: [],
      reservationCalendarRoles: [],
      assignedReservationCalendarRoles: [],
      agentProfiles: [],
      tasks: [],
      assignedTasks: [],
      taskLabels: [],
      eventComments: [],
    } as User;

    userRepository.findOne.mockResolvedValue(user);
    apiKeyRepository.findOne.mockResolvedValue({
      id: 2,
      userId: 8,
      prefix: 'abcdef123456',
      keyHash: hashSecret('abcdefghijklmnopqrstuvwx'),
      scopes: [ApiKeyScope.READ],
      tier: ApiKeyTier.USER,
      isActive: true,
      name: 'readonly',
      lastFour: 'uvwx',
      usageCount: 0,
      rotateAfter: new Date(Date.now() + 86400000),
    });

    await expect(
      service.authenticate(
        'pk_abcdef123456_abcdefghijklmnopqrstuvwx',
        'POST',
        '/api/calendars',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
