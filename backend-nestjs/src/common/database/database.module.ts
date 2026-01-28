import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createTypeOrmOptions } from './database.config';

/**
 * Centralized database module that configures TypeORM from environment variables.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => createTypeOrmOptions(),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
