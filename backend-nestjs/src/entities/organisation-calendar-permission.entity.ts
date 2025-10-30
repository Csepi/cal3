import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Organisation } from './organisation.entity';
import { ReservationCalendar } from './reservation-calendar.entity';

/**
 * OrganisationCalendarPermission Entity
 *
 * Provides granular permissions for specific reservation calendars within an organization.
 * This entity is only used when Organisation.useGranularCalendarPermissions = true.
 *
 * When granular permissions are enabled:
 * - Users must be explicitly granted permission to view/edit specific calendars
 * - Organization membership does not automatically grant calendar access
 * - Organization admins can assign/revoke these permissions
 *
 * When granular permissions are disabled:
 * - This entity is ignored
 * - Organization membership automatically grants access to ALL calendars
 *
 * Permission Levels:
 * - canView: User can see the calendar and its reservations
 * - canEdit: User can create, modify, and delete reservations in this calendar
 *
 * Hierarchy:
 * - canEdit implies canView
 * - Organization admins can always view/edit all calendars in their organization
 */
@Entity('organisation_calendar_permissions')
@Unique(['organisationId', 'userId', 'reservationCalendarId']) // Prevent duplicate permissions
export class OrganisationCalendarPermission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  organisationId: number;

  @Column()
  userId: number;

  @Column()
  reservationCalendarId: number;

  @Column({ default: false })
  canView: boolean; // Can see calendar and reservations

  @Column({ default: false })
  canEdit: boolean; // Can create, modify, delete reservations (implies canView)

  @Column({ nullable: true })
  assignedById: number; // Organization admin who granted this permission

  @CreateDateColumn()
  assignedAt: Date;

  // Relationships
  @ManyToOne(() => Organisation, { onDelete: 'CASCADE' })
  organisation: Organisation;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => ReservationCalendar, { onDelete: 'CASCADE' })
  reservationCalendar: ReservationCalendar;

  @ManyToOne(() => User, { nullable: true })
  assignedBy: User; // Organization admin who granted this permission
}
