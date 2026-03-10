import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { MfaService } from './mfa.service';
import type { User } from '../../entities/user.entity';

const createUser = (): User =>
  ({
    id: 7,
    username: 'alice',
    email: 'alice@example.com',
    password: 'hash',
    role: 'user',
    themeColor: '#3b82f6',
    weekStartDay: 1,
    defaultCalendarView: 'month',
    timezone: 'UTC',
    timeFormat: '24h',
    language: 'en',
    defaultTasksCalendarId: null,
    tasksSettings: null,
    usagePlans: ['user'],
    mfaEnabled: false,
    mfaSecret: null,
    mfaKeyVersion: null,
    mfaRecoveryCodes: null,
    mfaEnrolledAt: null,
    privacyPolicyAcceptedAt: null,
    privacyPolicyVersion: null,
    sessionTimeoutMinutes: 480,
    hideReservationsTab: false,
    hiddenResourceIds: [],
    visibleCalendarIds: [],
    visibleResourceTypeIds: [],
    isActive: true,
    firstName: '',
    lastName: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  }) as User;

describe('MfaService', () => {
  const repo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const totp = {
    createSecret: jest.fn(),
    generateOtpAuthUrl: jest.fn(),
    verifyCode: jest.fn(),
  };
  const securityStore = {
    setString: jest.fn(),
    getString: jest.fn(),
    delete: jest.fn(),
  };
  const fieldEncryption = {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  };
  const securityAudit = {
    log: jest.fn(),
  };

  let service: MfaService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MfaService(
      repo as any,
      totp as any,
      securityStore as any,
      fieldEncryption as any,
      securityAudit as any,
    );
  });

  it('creates setup challenge and stores secret', async () => {
    const user = createUser();
    repo.findOne.mockResolvedValue(user);
    totp.createSecret.mockReturnValue('ABCDEF123456');
    totp.generateOtpAuthUrl.mockReturnValue('otpauth://totp/url');

    const result = await service.createSetupChallenge(user.id);

    expect(result.secret).toBe('ABCDEF123456');
    expect(securityStore.setString).toHaveBeenCalledWith(
      `mfa:setup:${user.id}`,
      'ABCDEF123456',
      600,
    );
  });

  it('enables MFA and returns recovery codes', async () => {
    const user = createUser();
    repo.findOne.mockResolvedValue(user);
    securityStore.getString.mockResolvedValue('ABCDEF123456');
    totp.verifyCode.mockReturnValue(true);
    fieldEncryption.encrypt.mockReturnValue({
      ciphertext: 'enc:v1:payload',
      keyVersion: 'v1',
    });
    repo.save.mockImplementation(async (entity: User) => entity);

    const result = await service.enableMfa(user.id, '123456');

    expect(result.recoveryCodes.length).toBeGreaterThan(0);
    expect(repo.save).toHaveBeenCalled();
    expect(securityStore.delete).toHaveBeenCalledWith(`mfa:setup:${user.id}`);
  });

  it('throws when setup challenge is missing', async () => {
    securityStore.getString.mockResolvedValue(null);
    await expect(service.enableMfa(7, '123456')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('requires second factor for users with MFA enabled', async () => {
    const user = createUser();
    user.mfaEnabled = true;
    user.mfaSecret = 'enc:v1:payload';
    fieldEncryption.decrypt.mockReturnValue({ plaintext: 'SECRET' });
    totp.verifyCode.mockReturnValue(false);
    user.mfaRecoveryCodes = [];

    await expect(service.assertSecondFactor(user, undefined, undefined)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
