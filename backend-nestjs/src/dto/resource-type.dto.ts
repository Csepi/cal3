import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  Min,
} from 'class-validator';

export class CreateResourceTypeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  minBookingDuration?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bufferTime?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  customerInfoFields?: string[];

  @IsOptional()
  @IsBoolean()
  waitlistEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  recurringEnabled?: boolean;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsInt()
  organisationId: number;
}

export class UpdateResourceTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  minBookingDuration?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bufferTime?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  customerInfoFields?: string[];

  @IsOptional()
  @IsBoolean()
  waitlistEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  recurringEnabled?: boolean;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
