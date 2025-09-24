import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResourceType } from '../entities/resource-type.entity';
import { Organisation } from '../entities/organisation.entity';
import { ResourceTypesController } from './resource-types.controller';
import { ResourceTypesService } from './resource-types.service';

@Module({
  imports: [TypeOrmModule.forFeature([ResourceType, Organisation])],
  controllers: [ResourceTypesController],
  providers: [ResourceTypesService],
  exports: [ResourceTypesService],
})
export class ResourceTypesModule {}