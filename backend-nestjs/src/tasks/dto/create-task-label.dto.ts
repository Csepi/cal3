import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{6})$/;

export class CreateTaskLabelDto {
  @IsString()
  @MaxLength(64)
  name: string;

  @IsOptional()
  @Matches(HEX_COLOR_REGEX, { message: 'Color must be a valid 6-digit hex value.' })
  color?: string;
}
