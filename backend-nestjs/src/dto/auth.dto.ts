import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

export class RegisterDto {
  @ApiProperty({ example: 'john_doe', description: 'Unique username' })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ example: 'john@example.com', description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'User password (min 6 characters)' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: 'John', description: 'User first name' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe', description: 'User last name' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    example: UserRole.USER,
    description: 'User role (admin only)'
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class LoginDto {
  @ApiProperty({ example: 'john_doe or john@example.com', description: 'Username or email' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @IsString()
  password: string;
}

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'JWT access token' })
  access_token: string;

  @ApiProperty({ example: 'Bearer', description: 'Token type' })
  token_type: string;

  @ApiProperty({ example: 3600, description: 'Token expiration time in seconds' })
  expires_in: number;

  @ApiProperty({ description: 'User information' })
  user: {
    id: number;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: UserRole;
  };
}