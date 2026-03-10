import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

import { bStatic } from '../../i18n/runtime';

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{6})$/;

export class CreateTaskLabelDto {
  @IsString()
  @MaxLength(64)
  name!: string;

  @IsOptional()
  @Matches(HEX_COLOR_REGEX, {
    message: bStatic('errors.auto.backend.kdb97389aba96'),
  })
  color?: string;
}
