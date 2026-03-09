import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import type {
  AuditEventCategory,
  AuditEventOutcome,
  AuditEventSeverity,
} from '../../entities/audit-event.entity';

const CATEGORY_VALUES: AuditEventCategory[] = [
  'security',
  'permission',
  'mutation',
  'api_error',
  'frontend_error',
  'system',
];

const SEVERITY_VALUES: AuditEventSeverity[] = ['info', 'warn', 'critical'];
const OUTCOME_VALUES: AuditEventOutcome[] = ['success', 'failure', 'denied'];

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

export class AuditEventQueryDto {
  @IsOptional()
  @IsArray()
  @IsEnum(CATEGORY_VALUES, { each: true })
  @Transform(({ value }) =>
    normalizeToArray(value)?.filter((entry): entry is AuditEventCategory =>
      CATEGORY_VALUES.includes(entry as AuditEventCategory),
    ),
  )
  categories?: AuditEventCategory[];

  @IsOptional()
  @IsArray()
  @IsEnum(SEVERITY_VALUES, { each: true })
  @Transform(({ value }) =>
    normalizeToArray(value)?.filter((entry): entry is AuditEventSeverity =>
      SEVERITY_VALUES.includes(entry as AuditEventSeverity),
    ),
  )
  severities?: AuditEventSeverity[];

  @IsOptional()
  @IsArray()
  @IsEnum(OUTCOME_VALUES, { each: true })
  @Transform(({ value }) =>
    normalizeToArray(value)?.filter((entry): entry is AuditEventOutcome =>
      OUTCOME_VALUES.includes(entry as AuditEventOutcome),
    ),
  )
  outcomes?: AuditEventOutcome[];

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
  @Min(0)
  offset?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}
