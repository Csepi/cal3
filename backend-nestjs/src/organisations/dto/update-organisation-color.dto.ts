import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, Matches, MaxLength } from 'class-validator';
import { SanitizeText } from '../../common/validation/sanitize.decorator';

export class UpdateOrganisationColorDto {
  @SanitizeText({ trim: true, toLowerCase: true, maxLength: 16 })
  @MaxLength(16)
  @Matches(/^#([a-f0-9]{3}|[a-f0-9]{6})$/, {
    message: 'color must be a valid hex color (e.g. #3b82f6 or #fff)',
  })
  color!: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  cascadeToResourceTypes?: boolean;
}

