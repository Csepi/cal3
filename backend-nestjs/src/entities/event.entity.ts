import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { timestampTzType } from './column-types';
import { Calendar } from './calendar.entity';
import { User } from './user.entity';
import { EventComment } from './event-comment.entity';

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
  id!: number;

  @Column({ length: 300 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'date' })
  startDate!: Date;

  @Column({ type: 'time', nullable: true })
  startTime!: string | null;

  @Column({ type: 'date', nullable: true })
  endDate!: Date | null;

  @Column({ type: 'time', nullable: true })
  endTime!: string | null;

  @Column({ default: false })
  isAllDay!: boolean;

  @Column({ type: 'varchar', length: 200, nullable: true })
  location!: string | null;

  @Column({
    type: 'varchar',
    default: EventStatus.CONFIRMED,
  })
  status!: EventStatus;

  @Column({
    type: 'varchar',
    default: RecurrenceType.NONE,
  })
  recurrenceType!: RecurrenceType;

  @Column({ type: 'json', nullable: true })
  recurrenceRule!: string | Record<string, unknown> | null; // Store complex recurrence rules as JSON

  @Column({ type: 'integer', nullable: true })
  parentEventId!: number | null; // Reference to the original event in a recurring series

  @Column({ type: 'varchar', length: 255, nullable: true })
  recurrenceId!: string | null; // Unique identifier for the recurring series

  @Column({ type: 'date', nullable: true })
  originalDate!: Date | null; // Original date for modified instances of recurring events

  @Column({ default: false })
  isRecurrenceException!: boolean; // True if this is a modified instance of a recurring event

  @Column({ type: 'varchar', length: 7, nullable: true })
  color!: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true }) // Emoji/icon for event (e.g., đźŽ‰, đź“ť, đźŽŻ)
  icon!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'json', nullable: true })
  tags?: string[];

  @Column({ type: 'json', nullable: true })
  automationTasks!: Array<{
    title: string;
    description?: string;
    dueMinutesBefore?: number;
    createdAt: string;
    createdByRuleId?: number;
  }>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Many events belong to one calendar
  @ManyToOne(() => Calendar, (calendar) => calendar.events, {
    onDelete: 'CASCADE',
  })
  calendar!: Calendar;

  @Column()
  calendarId!: number;

  // Many events are created by one user
  @ManyToOne(() => User, (user) => user.createdEvents, { onDelete: 'CASCADE' })
  createdBy!: User;

  @Column()
  createdById!: number;

  @Column({ type: 'integer', nullable: true })
  taskId?: number;

  @Column({ type: timestampTzType, nullable: true })
  taskSyncedAt?: Date;

  @Column({ type: 'varchar', length: 64, nullable: true })
  taskSyncChecksum?: string;

  @OneToMany(() => EventComment, (comment) => comment.event, {
    cascade: true,
  })
  comments?: EventComment[];
}
