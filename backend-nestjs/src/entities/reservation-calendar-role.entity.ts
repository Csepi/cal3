import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { ReservationCalendar } from './reservation-calendar.entity';

/**
 * Enumeration for reservation calendar roles
 */
export enum ReservationCalendarRoleType {
  EDITOR = 'editor', // Can create, edit, and delete reservations
  REVIEWER = 'reviewer', // Can view and approve/reject reservations
}

/**
 * ReservationCalendarRole Entity
 *
 * Manages role-based access control for reservation calendars.
 * Users can be assigned different roles that determine their permissions
 * within a specific reservation calendar.
 *
 * Role Permissions:
 * - Editor: Can create, edit, delete, and approve reservations
 * - Reviewer: Can view reservations and approve/reject them
 *
 * Special Rules:
 * - Organisation admins automatically get editor role (managed at service level)
 * - Organisation admins cannot be removed from reservation calendars
 * - Users can only see reservation calendars where they have a role
 */
@Entity('reservation_calendar_roles')
@Unique(['reservationCalendarId', 'userId']) // Prevent duplicate role assignments
export class ReservationCalendarRole {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  reservationCalendarId: number;

  @Column()
  userId: number;

  @Column({
    type: 'varchar',
    enum: ReservationCalendarRoleType,
  })
  role: ReservationCalendarRoleType;

  @Column({ nullable: true })
  assignedById: number; // Organisation admin who assigned this role

  @Column({ default: false })
  isOrganisationAdmin: boolean; // True if this role is auto-assigned due to org admin status

  @CreateDateColumn()
  assignedAt: Date;

  // Relationships
  @ManyToOne(() => ReservationCalendar, (calendar) => calendar.roles, {
    onDelete: 'CASCADE',
  })
  reservationCalendar: ReservationCalendar;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => User, { nullable: true })
  assignedBy: User; // Organisation admin who assigned this role
}
