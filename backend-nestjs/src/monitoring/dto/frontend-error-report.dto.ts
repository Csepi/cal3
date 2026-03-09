import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class FrontendErrorReportDto {
  @IsString()
  @MaxLength(180)
  source!: string;

  @IsString()
  @MaxLength(400)
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  stack?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  url?: string;

  @IsOptional()
  @IsString()
  @IsIn(['error', 'warn', 'info'])
  severity?: 'error' | 'warn' | 'info';

  @IsOptional()
  @IsObject()
  details?: Record<string, unknown>;
}
