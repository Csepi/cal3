import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SharePermission } from '../entities/calendar.entity';

export class CreateCalendarGroupDto {
  @ApiProperty({ example: 'Family', description: 'Group name' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether calendars inside the group are visible by default',
  })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}

export class UpdateCalendarGroupDto {
  @ApiPropertyOptional({ example: 'Friends', description: 'Updated group name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Toggle visibility for all calendars in the group',
  })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}

export class AssignCalendarsToGroupDto {
  @ApiProperty({
    example: [1, 2, 3],
    description: 'Calendar IDs to assign to the group',
  })
  @IsArray()
  @IsNumber({}, { each: true })
  calendarIds: number[];
}

export class ShareCalendarGroupDto {
  @ApiProperty({
    example: [11, 42],
    description: 'User IDs to share the grouped calendars with',
  })
  @IsArray()
  @IsNumber({}, { each: true })
  userIds: number[];

  @ApiProperty({
    enum: SharePermission,
    example: SharePermission.READ,
    description: 'Permission to grant for each calendar in the group',
  })
  @IsEnum(SharePermission)
  permission: SharePermission;
}

export class CalendarGroupResponseDto {
  @ApiProperty({ example: 5, description: 'Group ID' })
  id: number;

  @ApiProperty({ example: 'Work', description: 'Group name' })
  name: string;

  @ApiProperty({ example: true, description: 'Whether the group is visible' })
  isVisible: boolean;

  @ApiProperty({ example: 1, description: 'Group owner ID' })
  ownerId: number;
}
