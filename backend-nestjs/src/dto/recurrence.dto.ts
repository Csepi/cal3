import {
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  IsArray,
  IsString,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RecurrenceType } from '../entities/event.entity';

export enum RecurrenceEndType {
  NEVER = 'never',
  COUNT = 'count',
  DATE = 'date',
}

export enum WeekDay {
  SUNDAY = 'SU',
  MONDAY = 'MO',
  TUESDAY = 'TU',
  WEDNESDAY = 'WE',
  THURSDAY = 'TH',
  FRIDAY = 'FR',
  SATURDAY = 'SA',
}

export class RecurrencePatternDto {
  @IsEnum(RecurrenceType)
  type!: RecurrenceType;

  @IsNumber()
  @IsOptional()
  interval?: number = 1;

  @IsArray()
  @IsEnum(WeekDay, { each: true })
  @IsOptional()
  daysOfWeek?: WeekDay[];

  @IsNumber()
  @IsOptional()
  dayOfMonth?: number;

  @IsNumber()
  @IsOptional()
  monthOfYear?: number;

  @IsEnum(RecurrenceEndType)
  @IsOptional()
  endType?: RecurrenceEndType = RecurrenceEndType.NEVER;

  @IsNumber()
  @IsOptional()
  count?: number;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  timezone?: string;
}

export class CreateRecurringEventDto {
  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsDateString()
  startDate!: string;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsOptional()
  isAllDay?: boolean = false;

  @IsString()
  @IsOptional()
  color?: string;

  @IsNumber()
  calendarId!: number;

  @ValidateNested()
  @Type(() => RecurrencePatternDto)
  recurrence!: RecurrencePatternDto;
}

export class UpdateRecurringEventDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsOptional()
  isAllDay?: boolean;

  @IsString()
  @IsOptional()
  color?: string;

  @IsNumber()
  @IsOptional()
  calendarId?: number;

  @ValidateNested()
  @Type(() => RecurrencePatternDto)
  @IsOptional()
  recurrence?: RecurrencePatternDto;

  @IsEnum(['this', 'future', 'all'])
  updateScope: 'this' | 'future' | 'all' = 'this';
}

export class RecurrenceInfoDto {
  @IsEnum(RecurrenceType)
  type!: RecurrenceType;

  @IsObject()
  @IsOptional()
  rule?: unknown;

  @IsString()
  @IsOptional()
  summary?: string;
}
