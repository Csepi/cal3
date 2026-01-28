import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../entities/user.entity';
import {
  RegisterDto,
  LoginDto,
  AuthResponseDto,
} from '../dto/auth.dto';
import { TokenService, TokenIssueResult } from './token.service';
import { SecurityAuditService } from '../logging/security-audit.service';
import { LoginAttemptService } from './services/login-attempt.service';
import { UserBootstrapService } from '../tasks/user-bootstrap.service';

export interface AuthRequestMetadata {
  ip?: string;
  userAgent?: string;
}

export interface AuthSessionResult {
  response: AuthResponseDto;
  refreshToken: string;
  refreshExpiresAt: Date;
  user: User;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly tokenService: TokenService,
    private readonly securityAudit: SecurityAuditService,
    private readonly loginAttemptService: LoginAttemptService,
    private readonly userBootstrapService: UserBootstrapService,
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
      throw new ConflictException('Username or email already exists');
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

  async login(
    loginDto: LoginDto,
    metadata: AuthRequestMetadata = {},
  ): Promise<AuthSessionResult> {
    const { username, password } = loginDto;

    // Find user by username or email
    const user = await this.userRepository.findOne({
      where: [{ username }, { email: username }],
    });

    if (!user) {
      this.loginAttemptService.registerFailure(username, metadata.ip);
      await this.securityAudit.log('auth.login.failure', {
        username,
        reason: 'user_not_found',
        ip: metadata.ip,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.loginAttemptService.registerFailure(username, metadata.ip);
      await this.securityAudit.log('auth.login.failure', {
        userId: user.id,
        reason: 'bad_password',
        ip: metadata.ip,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    this.loginAttemptService.reset(username, metadata.ip);

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
      throw new UnauthorizedException('User not found or inactive');
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
        'role',
        'themeColor',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async validateGoogleUser(googleUser: any): Promise<AuthSessionResult> {
    const { email, firstName, lastName } = googleUser;

    // Check if user already exists by email
    let user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      // Create new user with Google profile
      const username = email.split('@')[0] + '_google';
      user = this.userRepository.create({
        username,
        email,
        password: '', // OAuth users don't need passwords
        firstName,
        lastName,
        role: UserRole.USER,
        isActive: true,
      });

      user = await this.userRepository.save(user);
      await this.userBootstrapService.ensureUserDefaults(user);
    }

    return this.createSession(user, {});
  }

  async validateMicrosoftUser(
    microsoftUser: any,
  ): Promise<AuthSessionResult> {
    const { email, firstName, lastName, displayName } = microsoftUser;

    if (!email) {
      throw new UnauthorizedException(
        'Email is required for Microsoft authentication',
      );
    }

    // Check if user already exists by email
    let user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      // Create new user with Microsoft profile
      const username = email.split('@')[0] + '_microsoft';
      user = this.userRepository.create({
        username,
        email,
        password: '', // OAuth users don't need passwords
        firstName: firstName || displayName?.split(' ')[0] || '',
        lastName: lastName || displayName?.split(' ').slice(1).join(' ') || '',
        role: UserRole.USER,
        isActive: true,
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
      throw new UnauthorizedException('Refresh token missing');
    }

    const { user, ...tokens } =
      await this.tokenService.rotateRefreshToken(refreshToken, metadata);
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
    await this.securityAudit.log('auth.logout', {
      userId,
      ip: metadata.ip,
    });
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

  private buildResponse(
    user: User,
    tokens: TokenIssueResult,
  ): AuthResponseDto {
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
        role: user.role,
        themeColor: user.themeColor,
      },
    };
  }
}
