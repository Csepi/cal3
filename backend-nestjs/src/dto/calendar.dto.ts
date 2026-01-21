import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CalendarVisibility,
  SharePermission,
} from '../entities/calendar.entity';

export class CreateCalendarDto {
  @ApiProperty({ example: 'Work Calendar', description: 'Calendar name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'My work-related events',
    description: 'Calendar description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: '#3b82f6',
    description: 'Calendar color (hex code)',
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: '📅', description: 'Calendar icon (emoji)' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    enum: CalendarVisibility,
    example: CalendarVisibility.PRIVATE,
    description: 'Calendar visibility level',
  })
  @IsOptional()
  @IsEnum(CalendarVisibility)
  visibility?: CalendarVisibility;

  @ApiPropertyOptional({
    example: 2,
    description: 'Optional calendar group ID to place the calendar into',
  })
  @IsOptional()
  @IsNumber()
  groupId?: number | null;

  @ApiPropertyOptional({
    example: 10,
    description: 'Hidden calendar importance rank (higher = more important)',
  })
  @IsOptional()
  @IsNumber()
  rank?: number;
}

export class UpdateCalendarDto {
  @ApiPropertyOptional({
    example: 'Updated Calendar Name',
    description: 'Calendar name',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'Updated description',
    description: 'Calendar description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: '#ef4444',
    description: 'Calendar color (hex code)',
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: '📅', description: 'Calendar icon (emoji)' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    enum: CalendarVisibility,
    example: CalendarVisibility.SHARED,
    description: 'Calendar visibility level',
  })
  @IsOptional()
  @IsEnum(CalendarVisibility)
  visibility?: CalendarVisibility;

  @ApiPropertyOptional({
    example: 2,
    description: 'Calendar group ID (set to null to remove)',
  })
  @IsOptional()
  @IsNumber()
  groupId?: number | null;

  @ApiPropertyOptional({
    example: 10,
    description: 'Hidden calendar importance rank (higher = more important)',
  })
  @IsOptional()
  @IsNumber()
  rank?: number;
}

export class ShareCalendarDto {
  @ApiProperty({
    example: [1, 2, 3],
    description: 'Array of user IDs to share with',
  })
  @IsArray()
  @IsNumber({}, { each: true })
  userIds: number[];

  @ApiProperty({
    enum: SharePermission,
    example: SharePermission.READ,
    description: 'Permission level for shared users',
  })
  @IsEnum(SharePermission)
  permission: SharePermission;
}

export class CalendarResponseDto {
  @ApiProperty({ example: 1, description: 'Calendar ID' })
  id: number;

  @ApiProperty({ example: 'Work Calendar', description: 'Calendar name' })
  name: string;

  @ApiProperty({
    example: 'My work-related events',
    description: 'Calendar description',
  })
  description?: string;

  @ApiProperty({ example: '#3b82f6', description: 'Calendar color' })
  color: string;

  @ApiPropertyOptional({ example: '📅', description: 'Calendar icon' })
  icon?: string;

  @ApiProperty({ enum: CalendarVisibility, description: 'Calendar visibility' })
  visibility: CalendarVisibility;

  @ApiProperty({ example: true, description: 'Whether calendar is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Calendar owner information' })
  owner: {
    id: number;
    username: string;
    email: string;
  };

  @ApiProperty({ description: 'Users this calendar is shared with' })
  sharedWith?: Array<{
    id: number;
    username: string;
    permission: SharePermission;
  }>;

  @ApiProperty({
    example: '2025-09-15T10:00:00Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-09-15T10:00:00Z',
    description: 'Last update timestamp',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    example: 3,
    description: 'Group ID the calendar belongs to',
  })
  groupId?: number | null;

  @ApiPropertyOptional({
    description: 'Group metadata when calendar is grouped',
    example: { id: 3, name: 'Family', isVisible: true },
  })
  group?: {
    id: number;
    name: string;
    isVisible: boolean;
  } | null;

  @ApiPropertyOptional({
    example: 10,
    description: 'Hidden calendar importance rank (higher = more important)',
  })
  rank?: number;
}
