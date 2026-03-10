import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

const normalizeToArray = (value: unknown): string[] | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (Array.isArray(value)) {
    const normalized = value
      .map((entry) => String(entry ?? '').trim())
      .filter((entry) => entry.length > 0);
    return normalized.length ? normalized : undefined;
  }
  if (typeof value === 'string') {
    const normalized = value
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
    return normalized.length ? normalized : undefined;
  }
  return undefined;
};

export class PersonalAuditQueryDto {
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => normalizeToArray(value))
  categories?: string[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => normalizeToArray(value))
  outcomes?: string[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => normalizeToArray(value))
  severities?: string[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => normalizeToArray(value))
  actions?: string[];

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeAutomation?: boolean = true;
}
