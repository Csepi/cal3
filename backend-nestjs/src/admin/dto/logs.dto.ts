import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import type { LogLevel } from '../../entities/log-entry.entity';

const LOG_LEVEL_VALUES: LogLevel[] = [
  'log',
  'error',
  'warn',
  'debug',
  'verbose',
];

const normalizeToArray = (value: unknown): string[] | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (Array.isArray(value)) {
    const collected = value
      .map((entry) => (typeof entry === 'string' ? entry : String(entry ?? '')))
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
    return collected.length > 0 ? collected : undefined;
  }

  if (typeof value === 'string') {
    const pieces = value
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
    return pieces.length > 0 ? pieces : undefined;
  }

  const coerced = String(value).trim();
  return coerced.length > 0 ? [coerced] : undefined;
};

export class LogQueryDto {
  @IsOptional()
  @IsArray()
  @IsEnum(LOG_LEVEL_VALUES, { each: true })
  @Transform(({ value }) => {
    const normalized = normalizeToArray(value);
    return normalized
      ?.map((entry) => entry.toLowerCase())
      .filter((entry): entry is LogLevel =>
        LOG_LEVEL_VALUES.includes(entry as LogLevel),
      );
  })
  levels?: LogLevel[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => normalizeToArray(value))
  contexts?: string[];

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}

export class UpdateLogSettingsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  retentionDays?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  autoCleanupEnabled?: boolean;
}
