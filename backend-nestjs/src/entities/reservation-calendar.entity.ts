import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Organisation } from './organisation.entity';
import { Calendar } from './calendar.entity';
import { ReservationCalendarRole } from './reservation-calendar-role.entity';

/**
 * ReservationCalendar Entity
 *
 * Extends the regular Calendar concept to provide reservation-specific functionality
 * within an organisation context. Reservation calendars have role-based access control
 * where users can be assigned as either editors or reviewers.
 *
 * Key features:
 * - Linked to a specific organisation
 * - Has role-based access control (editor/reviewer)
 * - Organisation admins automatically become editors
 * - Only visible to users with assigned roles
 */
@Entity('reservation_calendars')
export class ReservationCalendar {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  calendarId: number; // FK to the base Calendar entity

  @Column()
  organisationId: number;

  @Column({ nullable: true })
  createdById: number;

  @Column({ type: 'text', nullable: true })
  reservationRules: string; // JSON string for reservation-specific rules

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToOne(() => Calendar, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'calendarId' })
  calendar: Calendar;

  @ManyToOne(() => Organisation, { onDelete: 'CASCADE' })
  organisation: Organisation;

  @ManyToOne(() => User, { nullable: true })
  createdBy: User;

  @OneToMany(() => ReservationCalendarRole, (role) => role.reservationCalendar, { cascade: true })
  roles: ReservationCalendarRole[];
}