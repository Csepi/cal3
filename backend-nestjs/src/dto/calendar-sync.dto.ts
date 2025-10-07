import { IsEnum, IsString, IsArray, IsBoolean, IsOptional, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { SyncProvider } from '../entities/calendar-sync.entity';

export class CalendarSyncDto {
  @IsString()
  externalId: string;

  @IsString()
  localName: string;

  @IsOptional()
  @IsBoolean()
  bidirectionalSync?: boolean = true;

  @IsOptional()
  @IsBoolean()
  triggerAutomationRules?: boolean = false;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  selectedRuleIds?: number[];
}

export class SyncCalendarsDto {
  @IsEnum(SyncProvider)
  provider: SyncProvider;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CalendarSyncDto)
  calendars: CalendarSyncDto[];
}

export class ProviderSyncStatusDto {
  provider: SyncProvider;
  isConnected: boolean;
  calendars: ExternalCalendarDto[];
  syncedCalendars: SyncedCalendarInfoDto[];
}

export class CalendarSyncStatusDto {
  providers: ProviderSyncStatusDto[];
}

export class ExternalCalendarDto {
  id: string;
  name: string;
  description?: string;
  primary?: boolean;
  accessRole?: string;
}

export class SyncedCalendarInfoDto {
  localName: string;
  externalId: string;
  externalName: string;
  provider: string;
  lastSync: string;
  bidirectionalSync: boolean;
}