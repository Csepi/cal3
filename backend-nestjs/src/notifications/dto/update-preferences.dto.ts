import { Type } from 'class-transformer';
import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class NotificationChannelPreferenceDto {
  @IsString()
  eventType!: string;

  @IsObject()
  channels!: Record<string, boolean>;

  @IsOptional()
  @IsString()
  digest?: string;

  @IsOptional()
  @IsArray()
  fallbackOrder?: string[];

  @IsOptional()
  @IsObject()
  quietHours?: Record<string, unknown> | null;
}

export class UpdateNotificationPreferencesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationChannelPreferenceDto)
  preferences!: NotificationChannelPreferenceDto[];
}
