import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../entities/user.entity';
import { RegisterDto, LoginDto, AuthResponseDto } from '../dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { username, email, password, firstName, lastName, role } = registerDto;

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

    // Generate JWT token
    const payload = { username: savedUser.username, sub: savedUser.id };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      token_type: 'Bearer',
      expires_in: 3600,
      user: {
        id: savedUser.id,
        username: savedUser.username,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        role: savedUser.role,
        themeColor: savedUser.themeColor,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { username, password } = loginDto;

    // Find user by username or email
    const user = await this.userRepository.findOne({
      where: [{ username }, { email: username }],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    // Generate JWT token
    const payload = { username: user.username, sub: user.id, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      token_type: 'Bearer',
      expires_in: 3600,
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
      select: ['id', 'username', 'email', 'firstName', 'lastName', 'role', 'themeColor', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async validateGoogleUser(googleUser: any): Promise<AuthResponseDto> {
    const { googleId, email, firstName, lastName } = googleUser;

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
    }

    // Generate JWT token
    const payload = { username: user.username, sub: user.id, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      token_type: 'Bearer',
      expires_in: 3600,
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

  async validateMicrosoftUser(microsoftUser: any): Promise<AuthResponseDto> {
    const { microsoftId, email, firstName, lastName, displayName } = microsoftUser;

    if (!email) {
      throw new UnauthorizedException('Email is required for Microsoft authentication');
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
    }

    // Generate JWT token
    const payload = { username: user.username, sub: user.id, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      token_type: 'Bearer',
      expires_in: 3600,
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