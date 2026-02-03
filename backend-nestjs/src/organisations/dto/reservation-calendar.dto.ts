import {
  IsString,
  IsOptional,
  IsArray,
  ArrayUnique,
  IsNumber,
  IsPositive,
  IsEnum,
  IsObject,
  MinLength,
  MaxLength,
  IsHexColor,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ReservationCalendarRoleType } from '../../entities/reservation-calendar-role.entity';

/**
 * DTO for creating a reservation calendar
 */
export class CreateReservationCalendarDto {
  @IsString({ message: 'Name must be a string' })
  @MinLength(1, { message: 'Name cannot be empty' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  name!: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  @Transform(({ value }) => value?.trim())
  description?: string;

  @IsOptional()
  @IsHexColor({ message: 'Color must be a valid hex color (e.g., #3b82f6)' })
  color?: string;

  @IsOptional()
  @IsObject({ message: 'Reservation rules must be a valid object' })
  reservationRules?: unknown;

  @IsOptional()
  @IsArray({ message: 'Editor user IDs must be an array' })
  @ArrayUnique({ message: 'Editor user IDs must be unique' })
  @IsNumber({}, { each: true, message: 'Each editor user ID must be a number' })
  @IsPositive({ each: true, message: 'Each editor user ID must be positive' })
  @Type(() => Number)
  editorUserIds?: number[];

  @IsOptional()
  @IsArray({ message: 'Reviewer user IDs must be an array' })
  @ArrayUnique({ message: 'Reviewer user IDs must be unique' })
  @IsNumber(
    {},
    { each: true, message: 'Each reviewer user ID must be a number' },
  )
  @IsPositive({ each: true, message: 'Each reviewer user ID must be positive' })
  @Type(() => Number)
  reviewerUserIds?: number[];
}

/**
 * DTO for assigning a role to a user for a reservation calendar
 */
export class AssignRoleDto {
  @IsNumber({}, { message: 'User ID must be a number' })
  @IsPositive({ message: 'User ID must be a positive number' })
  @Transform(({ value }) =>
    typeof value === 'number' ? value : parseInt(String(value ?? ''), 10),
  )
  userId!: number;

  @IsEnum(ReservationCalendarRoleType, {
    message: 'Role must be either "editor" or "reviewer"',
  })
  role!: ReservationCalendarRoleType;
}

/**
 * DTO for updating reservation calendar settings
 */
export class UpdateReservationCalendarDto {
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @MinLength(1, { message: 'Name cannot be empty' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  @Transform(({ value }) => value?.trim())
  description?: string;

  @IsOptional()
  @IsHexColor({ message: 'Color must be a valid hex color (e.g., #3b82f6)' })
  color?: string;

  @IsOptional()
  @IsObject({ message: 'Reservation rules must be a valid object' })
  reservationRules?: unknown;
}
