import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, Matches, MaxLength } from 'class-validator';
import { SanitizeText } from '../../common/validation/sanitize.decorator';

import { bStatic } from '../../i18n/runtime';

export class UpdateOrganisationColorDto {
  @SanitizeText({ trim: true, toLowerCase: true, maxLength: 16 })
  @MaxLength(16)
  @Matches(/^#([a-f0-9]{3}|[a-f0-9]{6})$/, {
    message: bStatic('errors.auto.backend.k52f93662a917'),
  })
  color!: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  cascadeToResourceTypes?: boolean;
}

