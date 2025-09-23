import { IsString, IsOptional, IsEmail, MinLength, Matches, IsNumber, IsIn, Min, Max, IsArray, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UsagePlan } from '../entities/user.entity';

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

  @ApiPropertyOptional({ example: 1, description: 'Week start day (0=Sunday, 1=Monday, etc.)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(6)
  weekStartDay?: number;

  @ApiPropertyOptional({ example: 'month', description: 'Default calendar view (month or week)' })
  @IsOptional()
  @IsString()
  @IsIn(['month', 'week'])
  defaultCalendarView?: string;

  @ApiPropertyOptional({ example: 'America/New_York', description: 'User timezone (e.g., America/New_York, Europe/London, UTC)' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: '24h', description: 'Time format preference (12h or 24h)' })
  @IsOptional()
  @IsString()
  @IsIn(['12h', '24h'])
  timeFormat?: string;
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

export class UpdateUsagePlansDto {
  @ApiPropertyOptional({ example: ['user', 'store'], description: 'Usage plans (multiple select) - Admin only' })
  @IsArray()
  @IsEnum(UsagePlan, { each: true })
  usagePlans: UsagePlan[];
}