import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CalendarsModule } from './calendars/calendars.module';
import { EventsModule } from './events/events.module';
import { AdminModule } from './admin/admin.module';
import { User } from './entities/user.entity';
import { Calendar, CalendarShare } from './entities/calendar.entity';
import { Event } from './entities/event.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(
      process.env.DB_TYPE === 'postgres' ? {
        type: 'postgres',
        host: process.env.DB_HOST || 'cal3-server.postgres.database.azure.com',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'cal3admin',
        password: process.env.DB_PASSWORD || 'Enter.Enter',
        database: process.env.DB_NAME || 'cal3',
        entities: [User, Calendar, CalendarShare, Event],
        synchronize: process.env.NODE_ENV !== 'production',
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        logging: process.env.NODE_ENV === 'development',
      } : {
        type: 'sqlite',
        database: ':memory:',
        entities: [User, Calendar, CalendarShare, Event],
        synchronize: true,
        logging: process.env.NODE_ENV === 'development',
      }
    ),
    AuthModule,
    UsersModule,
    CalendarsModule,
    EventsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
