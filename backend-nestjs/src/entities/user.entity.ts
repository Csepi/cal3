import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { Calendar } from './calendar.entity';
import { Event } from './event.entity';
import { Organisation } from './organisation.entity';
import { OrganisationAdmin } from './organisation-admin.entity';
import { ReservationCalendarRole } from './reservation-calendar-role.entity';
import { AgentProfile } from './agent-profile.entity';
import { Exclude } from 'class-transformer';

export enum UserRole {
  OBSERVER = 'observer',
  USER = 'user',
  ADMIN = 'admin',
}

export enum UsagePlan {
  CHILD = 'child',
  USER = 'user',
  STORE = 'store',
  ENTERPRISE = 'enterprise',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 255 })
  username: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255 })
  @Exclude()
  password: string;

  @Column({ length: 100, nullable: true })
  firstName: string;

  @Column({ length: 100, nullable: true })
  lastName: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({
    type: 'varchar',
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ length: 7, default: '#3b82f6' })
  themeColor: string;

  @Column({ default: 1 }) // 0 = Sunday, 1 = Monday, 2 = Tuesday, etc.
  weekStartDay: number;

  @Column({ default: 'month' }) // 'month' or 'week'
  defaultCalendarView: string;

  @Column({ default: 'UTC' }) // User's timezone (e.g., 'America/New_York', 'Europe/London', 'UTC')
  timezone: string;

  @Column({ default: '24h' }) // '12h' or '24h'
  timeFormat: string;

  @Column({ default: 'en' }) // User's preferred language (e.g., 'en', 'de', 'fr', 'es', 'hu')
  language: string;

  @Column({ type: 'json', default: () => '\'["user"]\'' }) // Array of usage plans
  usagePlans: UsagePlan[];

  @Column({ default: false }) // Hide the Reservations tab in the UI
  hideReservationsTab: boolean;

  @Column({ type: 'json', nullable: true }) // Array of resource IDs to hide in calendar view
  hiddenResourceIds: number[];

  @Column({ type: 'json', nullable: true }) // Array of calendar IDs visible in calendar view (null = all visible)
  visibleCalendarIds: number[];

  @Column({ type: 'json', nullable: true }) // Array of resource type IDs visible in calendar view (null = all visible)
  visibleResourceTypeIds: number[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // One user owns many calendars
  @OneToMany(() => Calendar, (calendar) => calendar.owner, { cascade: true })
  ownedCalendars: Calendar[];

  // Many users can have access to many calendars (shared calendars)
  @ManyToMany(() => Calendar, (calendar) => calendar.sharedWith)
  sharedCalendars: Calendar[];

  // One user creates many events
  @OneToMany(() => Event, (event) => event.createdBy, { cascade: true })
  createdEvents: Event[];

  // Many users can belong to many organisations
  @ManyToMany(() => Organisation, (organisation) => organisation.users)
  organisations: Organisation[];

  // Organisation admin relationships
  @OneToMany(() => OrganisationAdmin, (orgAdmin) => orgAdmin.user)
  organisationAdminRoles: OrganisationAdmin[];

  @OneToMany(() => OrganisationAdmin, (orgAdmin) => orgAdmin.assignedBy)
  assignedOrganisationAdminRoles: OrganisationAdmin[];

  // Reservation calendar role relationships
  @OneToMany(() => ReservationCalendarRole, (role) => role.user)
  reservationCalendarRoles: ReservationCalendarRole[];

  @OneToMany(() => ReservationCalendarRole, (role) => role.assignedBy)
  assignedReservationCalendarRoles: ReservationCalendarRole[];

  @OneToMany(() => AgentProfile, (agent) => agent.user)
  agentProfiles: AgentProfile[];
}
