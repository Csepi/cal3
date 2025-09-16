import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event } from '../entities/event.entity';
import { Calendar, CalendarShare } from '../entities/calendar.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Event, Calendar, CalendarShare])],
  providers: [EventsService],
  controllers: [EventsController],
  exports: [EventsService],
})
export class EventsModule {}