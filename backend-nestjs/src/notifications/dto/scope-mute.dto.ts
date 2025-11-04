import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsString } from 'class-validator';

export type ScopeMuteType =
  | 'organisation'
  | 'calendar'
  | 'reservation'
  | 'resource'
  | 'thread';

export class ScopeMuteDto {
  @IsEnum(['organisation', 'calendar', 'reservation', 'resource', 'thread'])
  scopeType!: ScopeMuteType;

  @Transform(({ value }) => String(value))
  @IsString()
  scopeId!: string;

  @IsBoolean()
  isMuted!: boolean;
}
