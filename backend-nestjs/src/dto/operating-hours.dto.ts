import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
  Matches,
} from 'class-validator';

import { bStatic } from '../i18n/runtime';

export class CreateOperatingHoursDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: bStatic('errors.auto.backend.kd347e6b22acf'),
  })
  openTime!: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: bStatic('errors.auto.backend.kd21691767631'),
  })
  closeTime!: string;

  @IsInt()
  resourceTypeId!: number;
}

export class UpdateOperatingHoursDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: bStatic('errors.auto.backend.kd347e6b22acf'),
  })
  openTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: bStatic('errors.auto.backend.kd21691767631'),
  })
  closeTime?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
