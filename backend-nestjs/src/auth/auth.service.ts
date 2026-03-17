import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, Not } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../entities/user.entity';
import { RegisterDto, LoginDto, AuthResponseDto } from '../dto/auth.dto';
import { CompleteOnboardingDto } from '../dto/onboarding.dto';
import {
  UserConsent,
  type UserConsentDecision,
  type UserConsentType,
} from '../entities/user-consent.entity';
import {
  TokenService,
  TokenIssueResult,
  WidgetTokenIssueResult,
} from './token.service';
import { SecurityAuditService } from '../logging/security-audit.service';
import { UserBootstrapService } from '../tasks/user-bootstrap.service';
import { JwtRevocationService } from './services/jwt-revocation.service';
import { AbusePreventionService } from '../api-security/services/abuse-prevention.service';
import { CaptchaVerificationService } from '../api-security/services/captcha-verification.service';
import { MfaService } from './services/mfa.service';
import { ConfigurationService } from '../configuration/configuration.service';

import { bStatic } from '../i18n/runtime';

export interface AuthRequestMetadata {
  ip?: string;
  userAgent?: string;
  fingerprintHash?: string;
  accessToken?: string;
}

export interface AuthSessionResult {
  response: AuthResponseDto;
  refreshToken: string;
  refreshExpiresAt: Date;
  user: User;
}

interface OAuthUserProfile {
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
}

type OAuthProvider = 'google' | 'microsoft';

@Injectable()
export class AuthService {
  private static readonly USERNAME_MIN_LENGTH = 3;
  private static readonly USERNAME_MAX_LENGTH = 64;
  private static readonly USERNAME_ALLOWED_PATTERN = /^[a-zA-Z0-9_.]+$/;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly tokenService: TokenService,
    private readonly securityAudit: SecurityAuditService,
    private readonly abusePreventionService: AbusePreventionService,
    private readonly captchaVerificationService: CaptchaVerificationService,
    private readonly userBootstrapService: UserBootstrapService,
    private readonly jwtRevocationService: JwtRevocationService,
    private readonly mfaService: MfaService,
    private readonly configurationService: ConfigurationService,
  ) {}

  async register(
    registerDto: RegisterDto,
    metadata: AuthRequestMetadata = {},
  ): Promise<AuthSessionResult> {
    const { username, email, password, firstName, lastName, role } =
      registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ username }, { email }],
    });

    if (existingUser) {
      throw new ConflictException(bStatic('errors.auto.backend.k2ecb24ae5a71'));
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = this.userRepository.create({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: email === 'admin@example.com' ? UserRole.ADMIN : role,
      onboardingCompleted: false,
    });

    const savedUser = await this.userRepository.save(user);

    await this.userBootstrapService.ensureUserDefaults(savedUser);

    const session = await this.createSession(savedUser, metadata);
    await this.securityAudit.log('auth.register', {
      userId: savedUser.id,
      ip: metadata.ip,
    });
    return session;
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    const normalizedUsername = username.trim();
    if (
      normalizedUsername.length < AuthService.USERNAME_MIN_LENGTH ||
      normalizedUsername.length > AuthService.USERNAME_MAX_LENGTH
    ) {
      throw new BadRequestException(
        'username must be between 3 and 64 characters.',
      );
    }
    if (!AuthService.USERNAME_ALLOWED_PATTERN.test(normalizedUsername)) {
      throw new BadRequestException(
        'username can only contain letters, numbers, dots, and underscores.',
      );
    }

    const existingUser = await this.userRepository.findOne({
      where: { username: normalizedUsername },
      select: ['id'],
    });
    return !existingUser;
  }

  async isEmailAvailable(email: string): Promise<boolean> {
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail.length === 0) {
      throw new BadRequestException('email is required.');
    }
    if (normalizedEmail.length > 254) {
      throw new BadRequestException('email must be at most 254 characters.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new BadRequestException('email must be a valid email address.');
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: normalizedEmail },
      select: ['id'],
    });
    return !existingUser;
  }

  async login(
    loginDto: LoginDto,
    metadata: AuthRequestMetadata = {},
  ): Promise<AuthSessionResult> {
    const { username, password } = loginDto;
    const normalizedUsername = username.trim().toLowerCase();
    await this.abusePreventionService.assertIpAllowed(metadata.ip);
    await this.abusePreventionService.assertAccountAllowed(normalizedUsername);

    if (loginDto.honeypot && loginDto.honeypot.trim().length > 0) {
      await this.abusePreventionService.markHoneypotHit(
        metadata.ip,
        '/api/auth/login',
      );
      await this.securityAudit.log('auth.login.failure', {
        username: normalizedUsername,
        reason: 'honeypot_filled',
        ip: metadata.ip,
      });
      throw new UnauthorizedException(bStatic('errors.auto.backend.ke417846ec08a'));
    }

    const requiresCaptcha = await this.abusePreventionService.requiresCaptcha(
      normalizedUsername,
      metadata.ip,
    );
    if (requiresCaptcha) {
      const captchaValid = await this.captchaVerificationService.verify(
        loginDto.captchaToken,
        metadata.ip,
      );
      if (!captchaValid) {
        await this.abusePreventionService.registerLoginFailure(
          normalizedUsername,
          metadata.ip,
        );
        await this.securityAudit.log('auth.login.failure', {
          username: normalizedUsername,
          reason: 'captcha_failed',
          ip: metadata.ip,
        });
        throw new UnauthorizedException(bStatic('errors.auto.backend.kce377da800dc'));
      }
    }

    // Find user by username or email
    const user = await this.userRepository.findOne({
      where: [{ username }, { email: username }],
    });

    if (!user) {
      await this.abusePreventionService.registerLoginFailure(
        normalizedUsername,
        metadata.ip,
      );
      await this.securityAudit.log('auth.login.failure', {
        username: normalizedUsername,
        reason: 'user_not_found',
        ip: metadata.ip,
      });
      throw new UnauthorizedException(bStatic('errors.auto.backend.ke417846ec08a'));
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const state = await this.abusePreventionService.registerLoginFailure(
        normalizedUsername,
        metadata.ip,
      );
      await this.securityAudit.log('auth.login.failure', {
        userId: user.id,
        reason: 'bad_password',
        ip: metadata.ip,
        accountLocked: state.accountLocked,
        ipBlocked: state.ipBlocked,
      });
      throw new UnauthorizedException(bStatic('errors.auto.backend.ke417846ec08a'));
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException(bStatic('errors.auto.backend.kf60b18c7d371'));
    }

    try {
      await this.mfaService.assertSecondFactor(
        user,
        loginDto.mfaCode,
        loginDto.mfaRecoveryCode,
      );
    } catch (error) {
      await this.abusePreventionService.registerLoginFailure(
        normalizedUsername,
        metadata.ip,
      );
      await this.securityAudit.log('auth.login.failure', {
        userId: user.id,
        reason: 'mfa_verification_failed',
        ip: metadata.ip,
      });
      throw error;
    }

    await this.abusePreventionService.resetLoginFailures(
      normalizedUsername,
      metadata.ip,
    );

    const session = await this.createSession(user, metadata);
    await this.securityAudit.log('auth.login.success', {
      userId: user.id,
      ip: metadata.ip,
    });
    return session;
  }

  async validateUser(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException(bStatic('errors.auto.backend.kdf19e5c63dda'));
    }

    return user;
  }

  async getUserProfile(userId: number): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'username',
        'email',
        'firstName',
        'lastName',
        'profilePictureUrl',
        'role',
        'themeColor',
        'onboardingCompleted',
        'onboardingCompletedAt',
        'onboardingUseCase',
        'privacyPolicyAcceptedAt',
        'privacyPolicyVersion',
        'mfaEnabled',
        'mfaEnrolledAt',
        'sessionTimeoutMinutes',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new UnauthorizedException(bStatic('errors.auto.backend.k01eb94695483'));
    }

    return user;
  }

  async validateGoogleUser(
    googleUser: OAuthUserProfile,
  ): Promise<AuthSessionResult> {
    const { email, firstName, lastName } = googleUser;

    // Check if user already exists by email
    let user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      // Create new user with Google profile
      const username = await this.generateUniqueOAuthUsername(email, 'google');
      user = this.userRepository.create({
        username,
        email,
        password: '', // OAuth users don't need passwords
        firstName,
        lastName,
        role: UserRole.USER,
        isActive: true,
        onboardingCompleted: false,
      });

      user = await this.userRepository.save(user);
      await this.userBootstrapService.ensureUserDefaults(user);
    }

    return this.createSession(user, {});
  }

  async validateMicrosoftUser(
    microsoftUser: OAuthUserProfile,
  ): Promise<AuthSessionResult> {
    const { email, firstName, lastName, displayName } = microsoftUser;

    if (!email) {
      throw new UnauthorizedException(
        bStatic('errors.auto.backend.k045ef2ac90b1'),
      );
    }

    // Check if user already exists by email
    let user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      // Create new user with Microsoft profile
      const username = await this.generateUniqueOAuthUsername(
        email,
        'microsoft',
      );
      user = this.userRepository.create({
        username,
        email,
        password: '', // OAuth users don't need passwords
        firstName: firstName || displayName?.split(' ')[0] || '',
        lastName: lastName || displayName?.split(' ').slice(1).join(' ') || '',
        role: UserRole.USER,
        isActive: true,
        onboardingCompleted: false,
      });

      user = await this.userRepository.save(user);
      await this.userBootstrapService.ensureUserDefaults(user);
    }

    return this.createSession(user, {});
  }

  async refreshSession(
    refreshToken: string | undefined,
    metadata: AuthRequestMetadata = {},
  ): Promise<AuthSessionResult> {
    if (!refreshToken) {
      throw new UnauthorizedException(bStatic('errors.auto.backend.kaa55202f05e0'));
    }

    const { user, ...tokens } = await this.tokenService.rotateRefreshToken(
      refreshToken,
      metadata,
    );
    await this.securityAudit.log('auth.refresh', {
      userId: user.id,
      ip: metadata.ip,
    });
    return {
      response: this.buildResponse(user, tokens),
      refreshToken: tokens.refreshToken,
      refreshExpiresAt: tokens.refreshExpiresAt,
      user,
    };
  }

  async logout(
    userId: number,
    refreshToken: string | null,
    metadata: AuthRequestMetadata = {},
  ): Promise<void> {
    await this.tokenService.revokeToken(refreshToken, 'logout');
    await this.jwtRevocationService.revokeToken(metadata.accessToken);
    await this.securityAudit.log('auth.logout', {
      userId,
      ip: metadata.ip,
    });
  }

  async issueWidgetToken(userId: number): Promise<WidgetTokenIssueResult> {
    const user = await this.validateUser(userId);
    return this.tokenService.issueWidgetToken(user);
  }

  async completeOnboarding(
    userId: number,
    dto: CompleteOnboardingDto,
    metadata: AuthRequestMetadata = {},
  ): Promise<Partial<User>> {
    const privacyPolicyVersion = this.resolvePolicyVersion(
      dto.privacyPolicyVersion,
      'PRIVACY_POLICY_VERSION',
    );
    const termsOfServiceVersion = this.resolvePolicyVersion(
      dto.termsOfServiceVersion,
      'TERMS_OF_SERVICE_VERSION',
    );
    const marketingConsentVersion = this.resolvePolicyVersion(
      undefined,
      'MARKETING_CONSENT_VERSION',
      termsOfServiceVersion,
    );

    const savedUser = await this.userRepository.manager.transaction(
      async (manager) => {
        const userRepository = manager.getRepository(User);
        const user = await userRepository.findOne({
          where: { id: userId, isActive: true },
        });

        if (!user) {
          throw new UnauthorizedException(
            bStatic('errors.auto.backend.kdf19e5c63dda'),
          );
        }

        const now = new Date();
        if (dto.username !== undefined) {
          const normalizedUsername = dto.username.trim();
          if (normalizedUsername.length > 0 && normalizedUsername !== user.username) {
            const conflictingUser = await userRepository.findOne({
              where: { username: normalizedUsername, id: Not(userId) },
              select: ['id'],
            });
            if (conflictingUser) {
              throw new ConflictException(
                bStatic('errors.auto.backend.k2ecb24ae5a71'),
              );
            }
            user.username = normalizedUsername;
          }
        } else if (!this.isValidUsername(user.username)) {
          user.username = await this.generateUniqueUsernameFromSeed(
            user.username || user.email,
          );
        }

        if (dto.firstName !== undefined) {
          user.firstName = dto.firstName;
        }
        if (dto.lastName !== undefined) {
          user.lastName = dto.lastName;
        }
        if (dto.profilePictureUrl !== undefined) {
          user.profilePictureUrl = dto.profilePictureUrl;
        }

        user.language = dto.language;
        user.preferredLanguage = dto.language;
        user.timezone = dto.timezone;
        user.timeFormat = dto.timeFormat;
        user.weekStartDay = dto.weekStartDay;
        user.defaultCalendarView = dto.defaultCalendarView;
        user.themeColor = dto.themeColor;
        user.privacyPolicyAcceptedAt = now;
        user.privacyPolicyVersion = privacyPolicyVersion;
        user.onboardingCompleted = true;
        user.onboardingCompletedAt = now;
        user.onboardingUseCase = dto.calendarUseCase ?? null;
        user.onboardingGoogleCalendarSyncRequested =
          dto.setupGoogleCalendarSync ?? false;
        user.onboardingMicrosoftCalendarSyncRequested =
          dto.setupMicrosoftCalendarSync ?? false;

        const persistedUser = await userRepository.save(user);
        await Promise.all([
          this.appendConsentRecord(
            manager,
            persistedUser.id,
            'privacy_policy',
            'accepted',
            privacyPolicyVersion,
            metadata,
          ),
          this.appendConsentRecord(
            manager,
            persistedUser.id,
            'terms_of_service',
            'accepted',
            termsOfServiceVersion,
            metadata,
          ),
          this.appendConsentRecord(
            manager,
            persistedUser.id,
            'marketing_email',
            dto.productUpdatesEmailConsent ? 'accepted' : 'revoked',
            marketingConsentVersion,
            metadata,
          ),
        ]);

        return persistedUser;
      },
    );

    await this.securityAudit.log('auth.onboarding.completed', {
      userId: savedUser.id,
      ip: metadata.ip,
      onboardingUseCase: savedUser.onboardingUseCase,
      setupGoogleCalendarSync: savedUser.onboardingGoogleCalendarSyncRequested,
      setupMicrosoftCalendarSync:
        savedUser.onboardingMicrosoftCalendarSyncRequested,
      productUpdatesEmailConsent: dto.productUpdatesEmailConsent ?? false,
      privacyPolicyVersion,
      termsOfServiceVersion,
    });

    return {
      id: savedUser.id,
      username: savedUser.username,
      email: savedUser.email,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      profilePictureUrl: savedUser.profilePictureUrl ?? null,
      themeColor: savedUser.themeColor,
      language: savedUser.language,
      timezone: savedUser.timezone,
      timeFormat: savedUser.timeFormat,
      weekStartDay: savedUser.weekStartDay,
      defaultCalendarView: savedUser.defaultCalendarView,
      onboardingCompleted: savedUser.onboardingCompleted,
      onboardingCompletedAt: savedUser.onboardingCompletedAt,
      onboardingUseCase: savedUser.onboardingUseCase,
      onboardingGoogleCalendarSyncRequested:
        savedUser.onboardingGoogleCalendarSyncRequested,
      onboardingMicrosoftCalendarSyncRequested:
        savedUser.onboardingMicrosoftCalendarSyncRequested,
      privacyPolicyAcceptedAt: savedUser.privacyPolicyAcceptedAt,
      privacyPolicyVersion: savedUser.privacyPolicyVersion,
      updatedAt: savedUser.updatedAt,
    };
  }

  private async createSession(
    user: User,
    metadata: AuthRequestMetadata = {},
  ): Promise<AuthSessionResult> {
    const tokens = await this.tokenService.issueTokens(user, metadata);
    return {
      response: this.buildResponse(user, tokens),
      refreshToken: tokens.refreshToken,
      refreshExpiresAt: tokens.refreshExpiresAt,
      user,
    };
  }

  private resolvePolicyVersion(
    explicitVersion: string | undefined,
    configKey: string,
    fallbackVersion = 'v1.0',
  ): string {
    const trimmed = explicitVersion?.trim();
    if (trimmed && trimmed.length > 0) {
      return trimmed.slice(0, 64);
    }

    const configured = this.configurationService.getValue(configKey)?.trim();
    if (configured && configured.length > 0) {
      return configured.slice(0, 64);
    }

    return fallbackVersion;
  }

  private async appendConsentRecord(
    manager: EntityManager,
    userId: number,
    consentType: UserConsentType,
    decision: UserConsentDecision,
    policyVersion: string,
    metadata: AuthRequestMetadata,
  ): Promise<void> {
    const now = new Date();
    const repository = manager.getRepository(UserConsent);
    const record = repository.create({
      userId,
      consentType,
      policyVersion,
      decision,
      acceptedAt: decision === 'accepted' ? now : null,
      revokedAt: decision === 'revoked' ? now : null,
      source: 'onboarding',
      ip: metadata.ip ? metadata.ip.slice(0, 64) : null,
      userAgent: metadata.userAgent
        ? metadata.userAgent.slice(0, 255)
        : null,
    });
    await repository.save(record);
  }

  private buildResponse(user: User, tokens: TokenIssueResult): AuthResponseDto {
    return {
      access_token: tokens.accessToken,
      token_type: 'Bearer',
      expires_in: tokens.accessExpiresIn,
      refresh_expires_at: tokens.refreshExpiresAt.toISOString(),
      issued_at: new Date().toISOString(),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePictureUrl: user.profilePictureUrl ?? null,
        role: user.role,
        themeColor: user.themeColor,
        onboardingCompleted: user.onboardingCompleted,
        mfaEnabled: user.mfaEnabled,
      },
    };
  }

  private async generateUniqueOAuthUsername(
    email: string,
    provider: OAuthProvider,
  ): Promise<string> {
    const localPart = email.split('@')[0] ?? '';
    const providerSuffix = `_${provider}`;
    const sanitizedBase = this.sanitizeUsernameSeed(localPart);
    const effectiveBase =
      sanitizedBase.length > 0 ? sanitizedBase : 'user';
    const truncatedBase = effectiveBase.slice(
      0,
      AuthService.USERNAME_MAX_LENGTH - providerSuffix.length,
    );
    return this.generateUniqueUsername(`${truncatedBase}${providerSuffix}`);
  }

  private async generateUniqueUsernameFromSeed(seed: string): Promise<string> {
    const sanitizedSeed = this.sanitizeUsernameSeed(seed);
    let base = sanitizedSeed.length > 0 ? sanitizedSeed : 'user';
    if (base.length < AuthService.USERNAME_MIN_LENGTH) {
      base = `${base}${'user'.slice(0, AuthService.USERNAME_MIN_LENGTH - base.length)}`;
    }
    return this.generateUniqueUsername(
      base.slice(0, AuthService.USERNAME_MAX_LENGTH),
    );
  }

  private async generateUniqueUsername(baseCandidate: string): Promise<string> {
    let candidate = baseCandidate.slice(0, AuthService.USERNAME_MAX_LENGTH);
    let sequence = 0;

    while (sequence < 10_000) {
      const existingUser = await this.userRepository.findOne({
        where: { username: candidate },
        select: ['id'],
      });
      if (!existingUser) {
        return candidate;
      }

      sequence += 1;
      const sequenceSuffix = `_${sequence}`;
      candidate = `${baseCandidate.slice(
        0,
        AuthService.USERNAME_MAX_LENGTH - sequenceSuffix.length,
      )}${sequenceSuffix}`;
    }

    throw new ConflictException(
      'Unable to allocate a unique username for this account.',
    );
  }

  private sanitizeUsernameSeed(seed: string): string {
    return seed
      .trim()
      .toLowerCase()
      .replace(/[^a-zA-Z0-9_.]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^[_\.]+|[_\.]+$/g, '');
  }

  private isValidUsername(value: string | undefined | null): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    return (
      value.length >= AuthService.USERNAME_MIN_LENGTH &&
      value.length <= AuthService.USERNAME_MAX_LENGTH &&
      AuthService.USERNAME_ALLOWED_PATTERN.test(value)
    );
  }
}
