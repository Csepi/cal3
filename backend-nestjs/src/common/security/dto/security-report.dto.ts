import { IsObject, IsOptional, MaxLength } from 'class-validator';
import { SanitizeText } from '../../validation/sanitize.decorator';

export class SecurityReportDto {
  @IsOptional()
  @IsObject()
  report?: Record<string, unknown>;

  @IsOptional()
  @SanitizeText({ trim: true, maxLength: 2000 })
  @MaxLength(2000)
  cspReport?: string;
}

