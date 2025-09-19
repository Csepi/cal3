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
import { CalendarSyncModule } from './calendar-sync/calendar-sync.module';
import { UserProfileController } from './controllers/user-profile.controller';
import { User } from './entities/user.entity';
import { Calendar, CalendarShare } from './entities/calendar.entity';
import { Event } from './entities/event.entity';
import { CalendarSyncConnection, SyncedCalendar, SyncEventMapping } from './entities/calendar-sync.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(
      process.env.DB_TYPE === 'postgres' ? {
        type: 'postgres',
        host: process.env.DB_HOST || 'cal2db.postgres.database.azure.com',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'db_admin',
        password: process.env.DB_PASSWORD || 'Enter.Enter',
        database: process.env.DB_NAME || 'cal3',
        entities: [User, Calendar, CalendarShare, Event, CalendarSyncConnection, SyncedCalendar, SyncEventMapping],
        synchronize: process.env.NODE_ENV !== 'production',
        ssl: { rejectUnauthorized: false },
        logging: process.env.NODE_ENV === 'development',
      } : {
        type: 'sqlite',
        database: process.env.DB_DATABASE || 'cal3.db',
        entities: [User, Calendar, CalendarShare, Event, CalendarSyncConnection, SyncedCalendar, SyncEventMapping],
        synchronize: true,
        logging: process.env.NODE_ENV === 'development',
      }
    ),
    AuthModule,
    UsersModule,
    CalendarsModule,
    EventsModule,
    AdminModule,
    CalendarSyncModule,
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [AppController, UserProfileController],
  providers: [AppService],
})
export class AppModule {}
