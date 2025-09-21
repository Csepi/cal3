import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Calendar } from './calendar.entity';
import { User } from './user.entity';

export enum EventStatus {
  CONFIRMED = 'confirmed',
  TENTATIVE = 'tentative',
  CANCELLED = 'cancelled',
}

export enum RecurrenceType {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 300 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'time', nullable: true })
  startTime: string;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ type: 'time', nullable: true })
  endTime: string;

  @Column({ default: false })
  isAllDay: boolean;

  @Column({ length: 200, nullable: true })
  location: string;

  @Column({
    type: 'varchar',
    default: EventStatus.CONFIRMED,
  })
  status: EventStatus;

  @Column({
    type: 'varchar',
    default: RecurrenceType.NONE,
  })
  recurrenceType: RecurrenceType;

  @Column({ type: 'json', nullable: true })
  recurrenceRule: any; // Store complex recurrence rules as JSON

  @Column({ nullable: true })
  parentEventId: number; // Reference to the original event in a recurring series

  @Column({ nullable: true })
  recurrenceId: string; // Unique identifier for the recurring series

  @Column({ type: 'date', nullable: true })
  originalDate: Date; // Original date for modified instances of recurring events

  @Column({ default: false })
  isRecurrenceException: boolean; // True if this is a modified instance of a recurring event

  @Column({ length: 7, nullable: true })
  color: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Many events belong to one calendar
  @ManyToOne(() => Calendar, (calendar) => calendar.events, { onDelete: 'CASCADE' })
  calendar: Calendar;

  @Column()
  calendarId: number;

  // Many events are created by one user
  @ManyToOne(() => User, (user) => user.createdEvents, { onDelete: 'CASCADE' })
  createdBy: User;

  @Column()
  createdById: number;
}