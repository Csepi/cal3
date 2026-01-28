# Database Abstraction Layer

This folder centralizes database configuration, pooling, and error handling for the NestJS backend.

## Structure

- `database.config.ts` - configuration factory that maps environment variables to TypeORM options.
- `database.connection-pool.ts` - pool parsing and driver-specific pool option mapping.
- `database.error-handler.ts` - normalized error classification utilities.
- `database.types.ts` - shared TypeScript interfaces and error types.
- `database.module.ts` - NestJS module that exports `TypeOrmModule` configured via the factory.

## Usage

```ts
// app.module.ts
import { DatabaseModule } from './common/database/database.module';

@Module({
  imports: [
    DatabaseModule,
    // other modules...
  ],
})
export class AppModule {}
```

## Environment Variables

The abstraction preserves existing mappings:

- `DB_TYPE` (`postgres`, `mssql`, or `sqlite`)
- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_SSL`
- `DB_SSL_REJECT_UNAUTHORIZED`
- `DB_SYNCHRONIZE`
- `DB_LOGGING`
- `DB_POOL_MAX`
- `DB_POOL_MIN`
- `DB_IDLE_TIMEOUT`
- `DB_CONNECTION_TIMEOUT`
- `DB_DATABASE` (SQLite file path)

## Notes

- PostgreSQL and Azure SQL (MSSQL) are both supported through the same config factory.
- Pool settings are preserved and mapped to driver-specific options.
- Error handlers are optional utilities for service-level error normalization.
