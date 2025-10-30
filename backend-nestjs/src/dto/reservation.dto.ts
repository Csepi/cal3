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

export class CreateReservationDto {
  @IsDateString()
  startTime: Date;

  @IsDateString()
  endTime: Date;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsObject()
  customerInfo?: Record<string, any>;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsInt()
  resourceId: number;
}

export class UpdateReservationDto {
  @IsOptional()
  @IsDateString()
  startTime?: Date;

  @IsOptional()
  @IsDateString()
  endTime?: Date;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsObject()
  customerInfo?: Record<string, any>;

  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateRecurringReservationDto {
  @IsDateString()
  startTime: Date;

  @IsDateString()
  endTime: Date;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsObject()
  customerInfo?: Record<string, any>;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsInt()
  resourceId: number;

  @IsObject()
  recurrencePattern: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: Date;
    count?: number;
    daysOfWeek?: number[];
  };
}
