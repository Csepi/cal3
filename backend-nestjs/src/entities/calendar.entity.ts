import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinTable,
} from 'typeorm';
import { User } from './user.entity';
import { Event } from './event.entity';
import { ReservationCalendar } from './reservation-calendar.entity';

export enum CalendarVisibility {
  PRIVATE = 'private',
  SHARED = 'shared',
  PUBLIC = 'public',
}

export enum SharePermission {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin',
}

@Entity('calendars')
export class Calendar {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 500, nullable: true })
  description: string;

  @Column({ length: 7, default: '#3b82f6' }) // Default blue color
  color: string;

  @Column({ length: 10, nullable: true }) // Emoji/icon for calendar (e.g., 📅, 🎉, 📝)
  icon: string;

  @Column({
    type: 'varchar',
    default: CalendarVisibility.PRIVATE,
  })
  visibility: CalendarVisibility;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isReservationCalendar: boolean; // Indicates if this is a reservation calendar

  @Column({ default: false })
  isTasksCalendar: boolean;

  @Column({ nullable: true })
  organisationId: number; // For reservation calendars, links to organisation

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Many calendars belong to one owner (user)
  @ManyToOne(() => User, (user) => user.ownedCalendars, { onDelete: 'CASCADE' })
  owner: User;

  @Column()
  ownerId: number;

  // Many calendars can be shared with many users
  @ManyToMany(() => User, (user) => user.sharedCalendars, {
    cascade: true,
  })
  @JoinTable({
    name: 'calendar_shares',
    joinColumn: { name: 'calendarId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  sharedWith: User[];

  // One calendar has many events
  @OneToMany(() => Event, (event) => event.calendar, { cascade: true })
  events: Event[];

  // Reservation calendar configuration (one-to-one relationship)
  @OneToMany(
    () => ReservationCalendar,
    (reservationCalendar) => reservationCalendar.calendar,
  )
  reservationCalendarConfig: ReservationCalendar[];
}

// Separate entity for calendar sharing permissions
@Entity('calendar_shares')
export class CalendarShare {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  calendarId: number;

  @Column()
  userId: number;

  @Column({
    type: 'varchar',
    default: SharePermission.READ,
  })
  permission: SharePermission;

  @CreateDateColumn()
  sharedAt: Date;

  @ManyToOne(() => Calendar, { onDelete: 'CASCADE' })
  calendar: Calendar;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;
}
