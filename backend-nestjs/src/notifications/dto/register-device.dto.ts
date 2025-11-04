import { IsIn, IsOptional, IsString } from 'class-validator';

export type PushDevicePlatform = 'web' | 'ios' | 'android';

export class RegisterDeviceDto {
  @IsIn(['web', 'ios', 'android'])
  platform!: PushDevicePlatform;

  @IsString()
  token!: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}
