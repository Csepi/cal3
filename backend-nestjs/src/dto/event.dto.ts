import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventStatus, RecurrenceType } from '../entities/event.entity';

export enum RecurrenceUpdateMode {
  SINGLE = 'single', // Update only this instance
  ALL = 'all', // Update all instances in the series
  FUTURE = 'future', // Update this and all future instances
}

export class CreateEventDto {
  @ApiProperty({ example: 'Team Meeting', description: 'Event title' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({
    example: 'Weekly team sync meeting',
    description: 'Event description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: '2025-09-20',
    description: 'Event start date (YYYY-MM-DD)',
  })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({
    example: '10:00',
    description: 'Event start time (HH:MM)',
  })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({
    example: '2025-09-20',
    description: 'Event end date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    example: '11:00',
    description: 'Event end time (HH:MM)',
  })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether event is all-day',
  })
  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @ApiPropertyOptional({
    example: 'Conference Room A',
    description: 'Event location',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    enum: EventStatus,
    example: EventStatus.CONFIRMED,
    description: 'Event status',
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional({
    enum: RecurrenceType,
    example: RecurrenceType.WEEKLY,
    description: 'Event recurrence type',
  })
  @IsOptional()
  @IsEnum(RecurrenceType)
  recurrenceType?: RecurrenceType;

  @ApiPropertyOptional({
    example: { interval: 1, until: '2024-12-31' },
    description: 'Recurrence rule configuration (JSON)',
  })
  @IsOptional()
  recurrenceRule?: unknown;

  @ApiPropertyOptional({
    example: '#ef4444',
    description: 'Event color (hex code)',
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: '🎉', description: 'Event icon (emoji)' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    example: 'Additional notes for the event',
    description: 'Event notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    example: 1,
    description:
      'Calendar ID where event will be created (optional for public events)',
  })
  @IsOptional()
  @IsNumber()
  calendarId?: number;
}

export class UpdateEventDto {
  @ApiPropertyOptional({
    example: 'Updated Meeting Title',
    description: 'Event title',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    example: 'Updated description',
    description: 'Event description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: '2025-09-21',
    description: 'Event start date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '14:00',
    description: 'Event start time (HH:MM)',
  })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({
    example: '2025-09-21',
    description: 'Event end date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    example: '15:00',
    description: 'Event end time (HH:MM)',
  })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether event is all-day',
  })
  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @ApiPropertyOptional({
    example: 'Conference Room B',
    description: 'Event location',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    enum: EventStatus,
    example: EventStatus.TENTATIVE,
    description: 'Event status',
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional({
    enum: RecurrenceType,
    example: RecurrenceType.MONTHLY,
    description: 'Event recurrence type',
  })
  @IsOptional()
  @IsEnum(RecurrenceType)
  recurrenceType?: RecurrenceType;

  @ApiPropertyOptional({
    example: { interval: 1, until: '2024-12-31' },
    description: 'Recurrence rule configuration (JSON)',
  })
  @IsOptional()
  recurrenceRule?: unknown;

  @ApiPropertyOptional({
    example: '#10b981',
    description: 'Event color (hex code)',
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: '🎉', description: 'Event icon (emoji)' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: 'Updated notes', description: 'Event notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Calendar ID to move event to (optional)',
  })
  @IsOptional()
  @IsNumber()
  calendarId?: number;

  @ApiPropertyOptional({
    enum: RecurrenceUpdateMode,
    example: RecurrenceUpdateMode.SINGLE,
    description:
      'How to update recurring events: single instance, all instances, or future instances',
  })
  @IsOptional()
  @IsEnum(RecurrenceUpdateMode)
  updateMode?: RecurrenceUpdateMode;
}

export class EventResponseDto {
  @ApiProperty({ example: 1, description: 'Event ID' })
  id!: number;

  @ApiProperty({ example: 'Team Meeting', description: 'Event title' })
  title!: string;

  @ApiProperty({
    example: 'Weekly team sync meeting',
    description: 'Event description',
  })
  description?: string;

  @ApiProperty({ example: '2025-09-20', description: 'Event start date' })
  startDate!: Date;

  @ApiProperty({ example: '10:00', description: 'Event start time' })
  startTime?: string;

  @ApiProperty({ example: '2025-09-20', description: 'Event end date' })
  endDate?: Date;

  @ApiProperty({ example: '11:00', description: 'Event end time' })
  endTime?: string;

  @ApiProperty({ example: false, description: 'Whether event is all-day' })
  isAllDay!: boolean;

  @ApiProperty({ example: 'Conference Room A', description: 'Event location' })
  location?: string;

  @ApiProperty({ enum: EventStatus, description: 'Event status' })
  status!: EventStatus;

  @ApiProperty({ enum: RecurrenceType, description: 'Event recurrence type' })
  recurrenceType!: RecurrenceType;

  @ApiProperty({ example: '#ef4444', description: 'Event color' })
  color?: string;

  @ApiProperty({ example: 'Additional notes', description: 'Event notes' })
  notes?: string;

  @ApiProperty({ description: 'Calendar information' })
  calendar!: {
    id: number;
    name: string;
    color: string;
  };

  @ApiProperty({ description: 'Event creator information' })
  createdBy!: {
    id: number;
    username: string;
  };

  @ApiProperty({
    example: '2025-09-15T10:00:00Z',
    description: 'Creation timestamp',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2025-09-15T10:00:00Z',
    description: 'Last update timestamp',
  })
  updatedAt!: Date;
}
