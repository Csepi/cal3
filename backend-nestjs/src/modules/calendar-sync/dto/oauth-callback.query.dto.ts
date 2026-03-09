import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { SyncProvider } from '../../../entities/calendar-sync.entity';
import { SanitizeText } from '../../../common/validation/sanitize.decorator';

export class CalendarSyncProviderParamDto {
  @IsEnum(SyncProvider)
  provider!: SyncProvider;
}

export class OAuthCallbackQueryDto {
  @SanitizeText({ trim: true, maxLength: 2048 })
  @IsString()
  @MaxLength(2048)
  code!: string;

  @IsOptional()
  @SanitizeText({ trim: true, maxLength: 512 })
  @IsString()
  @MaxLength(512)
  @Matches(/^[\w\-:.]+$/, {
    message: 'state contains unsupported characters',
  })
  state?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;
}

