import {
  IsString,
  IsOptional,
  IsInt,
  IsDateString,
  IsObject,
  IsEnum,
  Min,
} from 'class-validator';
import { ReservationStatus } from '../entities/reservation.entity';
import { SanitizeText } from '../common/validation/sanitize.decorator';
import {
  IsAfterProperty,
  IsSafeText,
} from '../common/validation/security.validators';

import { bStatic } from '../i18n/runtime';

export class CreateReservationDto {
  @IsDateString()
  startTime!: Date;

  @IsDateString()
  @IsAfterProperty('startTime', {
    message: bStatic('errors.auto.backend.k5855f66b6cdc'),
  })
  endTime!: Date;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsObject()
  customerInfo?: Record<string, unknown>;

  @IsOptional()
  @SanitizeText({ trim: true, maxLength: 2048 })
  @IsString()
  @IsSafeText()
  notes?: string;

  @IsInt()
  @Min(1)
  resourceId!: number;
}

export class UpdateReservationDto {
  @IsOptional()
  @IsDateString()
  startTime?: Date;

  @IsOptional()
  @IsDateString()
  @IsAfterProperty('startTime', {
    message: bStatic('errors.auto.backend.k5855f66b6cdc'),
  })
  endTime?: Date;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsObject()
  customerInfo?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @IsOptional()
  @SanitizeText({ trim: true, maxLength: 2048 })
  @IsString()
  @IsSafeText()
  notes?: string;
}

export class CreateRecurringReservationDto {
  @IsDateString()
  startTime!: Date;

  @IsDateString()
  @IsAfterProperty('startTime', {
    message: bStatic('errors.auto.backend.k5855f66b6cdc'),
  })
  endTime!: Date;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsObject()
  customerInfo?: Record<string, unknown>;

  @IsOptional()
  @SanitizeText({ trim: true, maxLength: 2048 })
  @IsString()
  @IsSafeText()
  notes?: string;

  @IsInt()
  @Min(1)
  resourceId!: number;

  @IsObject()
  recurrencePattern!: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: Date;
    count?: number;
    daysOfWeek?: number[];
  };
}
