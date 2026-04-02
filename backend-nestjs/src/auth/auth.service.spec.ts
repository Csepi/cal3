import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UserRole } from '../entities/user.entity';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;
  const userRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    manager: {
      transaction: jest.fn(),
    },
  };
  const tokenService = {
    issueTokens: jest.fn(),
    rotateRefreshToken: jest.fn(),
    revokeToken: jest.fn(),
    issueWidgetToken: jest.fn(),
  };
  const securityAudit = {
    log: jest.fn(),
  };
  const abusePreventionService = {
    assertIpAllowed: jest.fn(),
    assertAccountAllowed: jest.fn(),
    markHoneypotHit: jest.fn(),
    requiresCaptcha: jest.fn(),
    registerLoginFailure: jest.fn(),
    resetLoginFailures: jest.fn(),
  };
  const captchaVerificationService = {
    verify: jest.fn(),
  };
  const userBootstrapService = {
    ensureUserDefaults: jest.fn(),
  };
  const jwtRevocationService = {
    revokeToken: jest.fn(),
  };
  const mfaService = {
    assertSecondFactor: jest.fn(),
  };
  const configurationService = {
    getValue: jest.fn(),
  };

  let service: AuthService;

  const tokenIssue = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    accessExpiresIn: 900,
    refreshExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
    jti: 'jti-1',
    sessionId: 'sid-1',
    refreshTokenId: 'rtid-1',
  };

  const activeUser = {
    id: 10,
    username: 'jane',
    email: 'jane@example.com',
    password: 'hashed-password',
    firstName: 'Jane',
    lastName: 'Doe',
    role: UserRole.USER,
    themeColor: '#3b82f6',
    onboardingCompleted: false,
    isActive: true,
    mfaEnabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    tokenService.issueTokens.mockResolvedValue(tokenIssue);
    abusePreventionService.requiresCaptcha.mockResolvedValue(false);
    abusePreventionService.registerLoginFailure.mockResolvedValue({
      requiresCaptcha: false,
      accountLocked: false,
      ipBlocked: false,
    });
    mfaService.assertSecondFactor.mockResolvedValue(undefined);
    service = new AuthService(
      userRepository as never,
      tokenService as never,
      securityAudit as never,
      abusePreventionService as never,
      captchaVerificationService as never,
      userBootstrapService as never,
      jwtRevocationService as never,
      mfaService as never,
      configurationService as never,
    );
  });

  it('registers a new user and creates a session', async () => {
    userRepository.findOne.mockResolvedValue(null);
    bcryptMock.hash.mockResolvedValue('hashed-password' as never);
    userRepository.create.mockImplementation((payload) => payload);
    userRepository.save.mockImplementation(async (payload) => ({
      ...payload,
      id: 10,
      isActive: true,
      themeColor: '#3b82f6',
    }));

    const result = await service.register(
      {
        username: 'jane',
        email: 'jane@example.com',
        password: 'StrongPass#123',
        firstName: 'Jane',
        lastName: 'Doe',
      },
      { ip: '1.2.3.4' },
    );

    expect(result.response.access_token).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(userBootstrapService.ensureUserDefaults).toHaveBeenCalledWith(
      expect.objectContaining({ id: 10 }),
    );
    expect(securityAudit.log).toHaveBeenCalledWith(
      'auth.register',
      expect.objectContaining({ userId: 10 }),
    );
  });

  it('rejects registration when username or email already exists', async () => {
    userRepository.findOne.mockResolvedValue(activeUser);

    await expect(
      service.register({
        username: 'jane',
        email: 'jane@example.com',
        password: 'StrongPass#123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects login when honeypot is filled', async () => {
    await expect(
      service.login(
        {
          username: 'jane',
          password: 'StrongPass#123',
          honeypot: 'bot-filled',
        },
        { ip: '5.6.7.8' },
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(abusePreventionService.markHoneypotHit).toHaveBeenCalledWith(
      '5.6.7.8',
      '/api/auth/login',
    );
    expect(securityAudit.log).toHaveBeenCalledWith(
      'auth.login.failure',
      expect.objectContaining({ reason: 'honeypot_filled' }),
    );
  });

  it('requires captcha when risk policy says so and captcha fails', async () => {
    abusePreventionService.requiresCaptcha.mockResolvedValue(true);
    captchaVerificationService.verify.mockResolvedValue(false);

    await expect(
      service.login(
        {
          username: 'jane',
          password: 'StrongPass#123',
          captchaToken: 'captcha-token',
        },
        { ip: '5.6.7.8' },
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(captchaVerificationService.verify).toHaveBeenCalledWith(
      'captcha-token',
      '5.6.7.8',
    );
    expect(abusePreventionService.registerLoginFailure).toHaveBeenCalled();
  });

  it('rejects login when password check fails', async () => {
    userRepository.findOne.mockResolvedValue(activeUser);
    bcryptMock.compare.mockResolvedValue(false as never);

    await expect(
      service.login(
        {
          username: 'jane',
          password: 'wrong-password',
        },
        { ip: '9.9.9.9' },
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(abusePreventionService.registerLoginFailure).toHaveBeenCalled();
    expect(securityAudit.log).toHaveBeenCalledWith(
      'auth.login.failure',
      expect.objectContaining({ reason: 'bad_password' }),
    );
  });

  it('rejects login when MFA verification fails', async () => {
    userRepository.findOne.mockResolvedValue({
      ...activeUser,
      mfaEnabled: true,
    });
    bcryptMock.compare.mockResolvedValue(true as never);
    mfaService.assertSecondFactor.mockRejectedValue(
      new UnauthorizedException('mfa failed'),
    );

    await expect(
      service.login(
        {
          username: 'jane',
          password: 'StrongPass#123',
          mfaCode: '000000',
        },
        { ip: '2.2.2.2' },
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(abusePreventionService.registerLoginFailure).toHaveBeenCalled();
    expect(securityAudit.log).toHaveBeenCalledWith(
      'auth.login.failure',
      expect.objectContaining({ reason: 'mfa_verification_failed' }),
    );
  });

  it('logs in successfully and resets abuse counters', async () => {
    userRepository.findOne.mockResolvedValue(activeUser);
    bcryptMock.compare.mockResolvedValue(true as never);

    const result = await service.login(
      {
        username: 'jane',
        password: 'StrongPass#123',
      },
      { ip: '3.3.3.3' },
    );

    expect(result.response.access_token).toBe('access-token');
    expect(abusePreventionService.resetLoginFailures).toHaveBeenCalledWith(
      'jane',
      '3.3.3.3',
    );
    expect(securityAudit.log).toHaveBeenCalledWith(
      'auth.login.success',
      expect.objectContaining({ userId: 10 }),
    );
  });

  it('rejects refresh when no refresh token is provided', async () => {
    await expect(service.refreshSession(undefined)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rotates refresh token and logs refresh event', async () => {
    tokenService.rotateRefreshToken.mockResolvedValue({
      user: activeUser,
      ...tokenIssue,
      refreshToken: 'new-refresh',
    });

    const result = await service.refreshSession('old-refresh', { ip: '4.4.4.4' });

    expect(result.refreshToken).toBe('new-refresh');
    expect(securityAudit.log).toHaveBeenCalledWith(
      'auth.refresh',
      expect.objectContaining({ userId: 10 }),
    );
  });

  it('completes onboarding and persists three consent records using configured policy versions', async () => {
    const consentRepository = {
      create: jest.fn().mockImplementation((payload) => payload),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const transactionalUserRepository = {
      findOne: jest.fn().mockResolvedValue({
        ...activeUser,
        username: 'jane',
      }),
      save: jest.fn().mockImplementation(async (payload) => ({
        ...payload,
        updatedAt: new Date('2026-04-01T00:00:00.000Z'),
      })),
    };
    const manager = {
      getRepository: jest.fn((entity: unknown) => {
        if (entity && (entity as { name?: string }).name === 'User') {
          return transactionalUserRepository;
        }
        return consentRepository;
      }),
    };
    userRepository.manager.transaction.mockImplementation(
      async (
        callback: (transactionalManager: typeof manager) => Promise<unknown>,
      ) => callback(manager),
    );
    configurationService.getValue.mockImplementation((key: string) => {
      if (key === 'PRIVACY_POLICY_VERSION') return 'privacy-v3';
      if (key === 'TERMS_OF_SERVICE_VERSION') return 'terms-v9';
      if (key === 'MARKETING_CONSENT_VERSION') return 'marketing-v2';
      return undefined;
    });

    const result = await service.completeOnboarding(
      10,
      {
        username: 'jane',
        language: 'en',
        timezone: 'UTC',
        timeFormat: '24h',
        weekStartDay: 1,
        defaultCalendarView: 'month',
        themeColor: '#3b82f6',
        privacyPolicyAccepted: true,
        termsOfServiceAccepted: true,
        productUpdatesEmailConsent: false,
      },
      { ip: '10.10.10.10', userAgent: 'jest' },
    );

    expect(result.onboardingCompleted).toBe(true);
    expect(consentRepository.save).toHaveBeenCalledTimes(3);
    expect(securityAudit.log).toHaveBeenCalledWith(
      'auth.onboarding.completed',
      expect.objectContaining({
        userId: 10,
        privacyPolicyVersion: 'privacy-v3',
        termsOfServiceVersion: 'terms-v9',
      }),
    );
  });

  it('creates a user on first Google OAuth login with sanitized unique username', async () => {
    userRepository.findOne
      .mockResolvedValueOnce(null) // by email
      .mockResolvedValueOnce(null); // by generated username
    userRepository.create.mockImplementation((payload) => payload);
    userRepository.save.mockImplementation(async (payload) => ({
      ...payload,
      id: 50,
      isActive: true,
      themeColor: '#3b82f6',
      mfaEnabled: false,
    }));

    const session = await service.validateGoogleUser({
      email: 'John-Doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
    });

    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'john_doe_google',
        onboardingCompleted: false,
      }),
    );
    expect(userBootstrapService.ensureUserDefaults).toHaveBeenCalled();
    expect(session.response.user.id).toBe(50);
  });

  it('rejects Microsoft OAuth flow when email is missing', async () => {
    await expect(
      service.validateMicrosoftUser({
        email: '',
        displayName: 'No Mail',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('revokes tokens and writes audit event on logout', async () => {
    await service.logout(10, 'refresh-token', {
      ip: '11.11.11.11',
      accessToken: 'access-token',
    });

    expect(tokenService.revokeToken).toHaveBeenCalledWith(
      'refresh-token',
      'logout',
    );
    expect(jwtRevocationService.revokeToken).toHaveBeenCalledWith('access-token');
    expect(securityAudit.log).toHaveBeenCalledWith(
      'auth.logout',
      expect.objectContaining({ userId: 10 }),
    );
  });
});
