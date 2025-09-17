import { IsString, IsOptional, IsEmail, MinLength, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'john_doe', description: 'Username' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  username?: string;

  @ApiPropertyOptional({ example: 'john@example.com', description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'John', description: 'First name' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe', description: 'Last name' })
  @IsOptional()
  @IsString()
  lastName?: string;
}

export class UpdateThemeDto {
  @ApiPropertyOptional({ example: '#3b82f6', description: 'Theme color in hex format' })
  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'Theme color must be a valid hex color' })
  themeColor?: string;
}

export class ChangePasswordDto {
  @ApiPropertyOptional({ example: 'oldpassword123', description: 'Current password' })
  @IsString()
  currentPassword: string;

  @ApiPropertyOptional({ example: 'newpassword123', description: 'New password (min 6 characters)' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}