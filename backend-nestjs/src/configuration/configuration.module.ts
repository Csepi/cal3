import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigurationSetting } from '../entities/configuration-setting.entity';
import { ConfigurationService } from './configuration.service';

@Module({
  imports: [TypeOrmModule.forFeature([ConfigurationSetting])],
  providers: [ConfigurationService],
  exports: [ConfigurationService],
})
export class ConfigurationModule {}
