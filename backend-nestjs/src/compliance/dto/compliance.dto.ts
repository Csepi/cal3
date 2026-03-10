import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type { UserConsentType } from '../../entities/user-consent.entity';
import { SanitizeText } from '../../common/validation/sanitize.decorator';

const normalizeArrayParam = (value: unknown): string[] | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (Array.isArray(value)) {
    const values = value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : String(entry)))
      .filter((entry) => entry.length > 0);
    return values.length > 0 ? values : undefined;
  }
  if (typeof value === 'string') {
    const values = value
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
    return values.length > 0 ? values : undefined;
  }
  return undefined;
};

export class UpsertConsentDto {
  @IsEnum(['accepted', 'revoked'] as const)
  decision!: 'accepted' | 'revoked';

  @SanitizeText({ trim: true })
  @IsString()
  @MaxLength(64)
  policyVersion!: string;

  @IsOptional()
  @SanitizeText({ trim: true })
  @IsString()
  @MaxLength(64)
  source?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class AcceptPrivacyPolicyDto {
  @SanitizeText({ trim: true })
  @IsString()
  @MaxLength(64)
  version!: string;
}

export class CreateDataSubjectRequestDto {
  @IsEnum(['access', 'export', 'delete'] as const)
  requestType!: 'access' | 'export' | 'delete';

  @IsOptional()
  @SanitizeText({ trim: true })
  @IsString()
  @MaxLength(1000)
  reason?: string;

  @IsOptional()
  @SanitizeText({ trim: true, toLowerCase: true })
  @IsString()
  @MaxLength(254)
  confirmEmail?: string;
}

export class DataSubjectRequestQueryDto {
  @IsOptional()
  @Transform(({ value }) => normalizeArrayParam(value))
  statuses?: string[];

  @IsOptional()
  @Transform(({ value }) => normalizeArrayParam(value))
  requestTypes?: string[];

  @IsOptional()
  @SanitizeText({ trim: true })
  @IsString()
  @MaxLength(120)
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
}

export class UpdateDataSubjectRequestDto {
  @IsEnum(
    ['pending', 'in_progress', 'completed', 'rejected'] as const,
  )
  status!: 'pending' | 'in_progress' | 'completed' | 'rejected';

  @IsOptional()
  @SanitizeText({ trim: true })
  @IsString()
  @MaxLength(2000)
  adminNotes?: string;
}

export class ComplianceAuditExportQueryDto {
  @IsOptional()
  @SanitizeText({ trim: true })
  @IsString()
  from?: string;

  @IsOptional()
  @SanitizeText({ trim: true })
  @IsString()
  to?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeArrayParam(value))
  categories?: string[];

  @IsOptional()
  @IsEnum(['json', 'csv'] as const)
  format?: 'json' | 'csv';
}

export const USER_CONSENT_TYPES: UserConsentType[] = [
  'privacy_policy',
  'terms_of_service',
  'marketing_email',
  'data_processing',
  'cookie_analytics',
];
