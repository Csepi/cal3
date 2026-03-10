import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiKeyScope, ApiKeyTier } from '../../entities/api-key.entity';
import { SanitizeText } from '../../common/validation/sanitize.decorator';
import { IsSafeText } from '../../common/validation/security.validators';

export class CreateApiKeyDto {
  @ApiProperty({ description: 'Human-friendly API key name', maxLength: 120 })
  @SanitizeText({ trim: true })
  @IsString()
  @MaxLength(120)
  @IsSafeText()
  name!: string;

  @ApiPropertyOptional({
    enum: ApiKeyScope,
    isArray: true,
    description: 'Permission scopes. Default: read',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ApiKeyScope, { each: true })
  scopes?: ApiKeyScope[];

  @ApiPropertyOptional({
    enum: ApiKeyTier,
    description: 'Rate-limit tier override. Default: user',
  })
  @IsOptional()
  @IsEnum(ApiKeyTier)
  tier?: ApiKeyTier;

  @ApiPropertyOptional({
    description: 'Optional API key expiry in days',
    minimum: 1,
    example: 90,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  expiresInDays?: number;

  @ApiPropertyOptional({
    description: 'Rotation policy in days',
    minimum: 1,
    example: 90,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  rotateInDays?: number;
}

export class ApiKeySummaryDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  prefix!: string;

  @ApiProperty({ enum: ApiKeyScope, isArray: true })
  scopes!: ApiKeyScope[];

  @ApiProperty({ enum: ApiKeyTier })
  tier!: ApiKeyTier;

  @ApiProperty()
  isActive!: boolean;

  @ApiPropertyOptional()
  expiresAt!: string | null;

  @ApiPropertyOptional()
  rotateAfter!: string | null;

  @ApiPropertyOptional()
  lastUsedAt!: string | null;

  @ApiProperty()
  usageCount!: number;
}

export class CreateApiKeyResponseDto {
  @ApiProperty({ description: 'Plaintext API key. Shown once only.' })
  apiKey!: string;

  @ApiProperty({ type: ApiKeySummaryDto })
  key!: ApiKeySummaryDto;
}

