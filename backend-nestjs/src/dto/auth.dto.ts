import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';
import { SanitizeText } from '../common/validation/sanitize.decorator';
import {
  IsSafeText,
  IsStrongPassword,
} from '../common/validation/security.validators';

export class RegisterDto {
  @ApiProperty({ example: 'john_doe', description: 'Unique username' })
  @SanitizeText({ trim: true })
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  @IsSafeText()
  username!: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'User email address',
  })
  @SanitizeText({ trim: true, toLowerCase: true })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password (min 6 characters)',
  })
  @SanitizeText()
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  @IsStrongPassword()
  password!: string;

  @ApiPropertyOptional({ example: 'John', description: 'User first name' })
  @IsOptional()
  @SanitizeText({ trim: true })
  @IsString()
  @MaxLength(80)
  @IsSafeText()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe', description: 'User last name' })
  @IsOptional()
  @SanitizeText({ trim: true })
  @IsString()
  @MaxLength(80)
  @IsSafeText()
  lastName?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    example: UserRole.USER,
    description: 'User role (admin only)',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class LoginDto {
  @ApiProperty({
    example: 'john_doe or john@example.com',
    description: 'Username or email',
  })
  @SanitizeText({ trim: true })
  @IsString()
  @MinLength(1)
  @MaxLength(254)
  @IsSafeText()
  username!: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @SanitizeText()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;

  @ApiPropertyOptional({
    description:
      'Captcha token required when suspicious activity is detected.',
  })
  @IsOptional()
  @SanitizeText({ trim: true })
  @IsString()
  @MaxLength(2048)
  captchaToken?: string;

  @ApiPropertyOptional({
    description:
      'Honeypot field (must stay empty). Any value indicates bot activity.',
  })
  @IsOptional()
  @SanitizeText({ trim: true })
  @IsString()
  @MaxLength(120)
  honeypot?: string;
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  access_token!: string;

  @ApiProperty({ example: 'Bearer', description: 'Token type' })
  token_type!: string;

  @ApiProperty({
    example: 3600,
    description: 'Token expiration time in seconds',
  })
  expires_in!: number;

  @ApiProperty({
    example: '2025-11-07T21:00:00.000Z',
    description: 'Refresh token expiration timestamp (ISO8601)',
  })
  refresh_expires_at!: string;

  @ApiProperty({
    example: '2025-11-07T20:00:00.000Z',
    description: 'Access token issued timestamp (ISO8601)',
  })
  issued_at!: string;

  @ApiPropertyOptional({
    example: 'g3-r5f...refresh-token...',
    description:
      'Refresh token for native clients (omitted for browser-based clients).',
  })
  refresh_token?: string;

  @ApiProperty({ description: 'User information' })
  user!: {
    id: number;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: UserRole;
    themeColor: string;
  };
}

export class RefreshTokenRequestDto {
  @ApiPropertyOptional({
    description: 'Refresh token (optional when HttpOnly cookie is present).',
  })
  @IsOptional()
  @SanitizeText({ trim: true })
  @IsString()
  @MaxLength(4096)
  refreshToken?: string;
}
