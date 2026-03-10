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

import { bStatic } from '../../i18n/runtime';

/**
 * DTO for creating a reservation calendar
 */
export class CreateReservationCalendarDto {
  @IsString({ message: bStatic('errors.auto.backend.kdd152a33c1f4') })
  @MinLength(1, { message: bStatic('errors.auto.backend.k6b41f8df9138') })
  @MaxLength(100, { message: bStatic('errors.auto.backend.kf60cf41d7520') })
  @Transform(({ value }) => value?.trim())
  name!: string;

  @IsOptional()
  @IsString({ message: bStatic('errors.auto.backend.kec639b99acba') })
  @MaxLength(500, { message: bStatic('errors.auto.backend.k4ad894881666') })
  @Transform(({ value }) => value?.trim())
  description?: string;

  @IsOptional()
  @IsHexColor({ message: bStatic('errors.auto.backend.k6f24337db8fd') })
  color?: string;

  @IsOptional()
  @IsObject({ message: bStatic('errors.auto.backend.kc02c191df94d') })
  reservationRules?: unknown;

  @IsOptional()
  @IsArray({ message: bStatic('errors.auto.backend.k8c9594febc25') })
  @ArrayUnique({ message: bStatic('errors.auto.backend.k3fa8e75cce0a') })
  @IsNumber({}, { each: true, message: bStatic('errors.auto.backend.k58a6a32abf39') })
  @IsPositive({ each: true, message: bStatic('errors.auto.backend.kfca50583c175') })
  @Type(() => Number)
  editorUserIds?: number[];

  @IsOptional()
  @IsArray({ message: bStatic('errors.auto.backend.k770df69ad171') })
  @ArrayUnique({ message: bStatic('errors.auto.backend.kc919606b9097') })
  @IsNumber(
    {},
    { each: true, message: bStatic('errors.auto.backend.kdd6abebc3607') },
  )
  @IsPositive({ each: true, message: bStatic('errors.auto.backend.k163fad6125e4') })
  @Type(() => Number)
  reviewerUserIds?: number[];
}

/**
 * DTO for assigning a role to a user for a reservation calendar
 */
export class AssignRoleDto {
  @IsNumber({}, { message: bStatic('errors.auto.backend.kba7f58f064f8') })
  @IsPositive({ message: bStatic('errors.auto.backend.k95c43921a00b') })
  @Transform(({ value }) =>
    typeof value === 'number' ? value : parseInt(String(value ?? ''), 10),
  )
  userId!: number;

  @IsEnum(ReservationCalendarRoleType, {
    message: bStatic('errors.auto.backend.k8b715a74dd42'),
  })
  role!: ReservationCalendarRoleType;
}

/**
 * DTO for updating reservation calendar settings
 */
export class UpdateReservationCalendarDto {
  @IsOptional()
  @IsString({ message: bStatic('errors.auto.backend.kdd152a33c1f4') })
  @MinLength(1, { message: bStatic('errors.auto.backend.k6b41f8df9138') })
  @MaxLength(100, { message: bStatic('errors.auto.backend.kf60cf41d7520') })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @IsOptional()
  @IsString({ message: bStatic('errors.auto.backend.kec639b99acba') })
  @MaxLength(500, { message: bStatic('errors.auto.backend.k4ad894881666') })
  @Transform(({ value }) => value?.trim())
  description?: string;

  @IsOptional()
  @IsHexColor({ message: bStatic('errors.auto.backend.k6f24337db8fd') })
  color?: string;

  @IsOptional()
  @IsObject({ message: bStatic('errors.auto.backend.kc02c191df94d') })
  reservationRules?: unknown;
}
