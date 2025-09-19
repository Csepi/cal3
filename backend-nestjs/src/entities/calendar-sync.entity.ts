import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Calendar } from './calendar.entity';

export enum SyncProvider {
  GOOGLE = 'google',
  MICROSOFT = 'microsoft',
}

export enum SyncStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
}

@Entity('calendar_sync_connections')
export class CalendarSyncConnection {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: number;

  @Column()
  provider: SyncProvider;

  @Column({ nullable: true })
  providerUserId: string;

  @Column({ nullable: true })
  accessToken: string;

  @Column({ nullable: true })
  refreshToken: string;

  @Column({ nullable: true, type: 'timestamp' })
  tokenExpiresAt: Date;

  @Column({
    default: SyncStatus.ACTIVE,
  })
  status: SyncStatus;

  @Column({ nullable: true, type: 'timestamp' })
  lastSyncAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('synced_calendars')
export class SyncedCalendar {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => CalendarSyncConnection, { onDelete: 'CASCADE' })
  syncConnection: CalendarSyncConnection;

  @Column()
  syncConnectionId: number;

  @ManyToOne(() => Calendar, { onDelete: 'CASCADE' })
  localCalendar: Calendar;

  @Column()
  localCalendarId: number;

  @Column()
  externalCalendarId: string;

  @Column()
  externalCalendarName: string;

  @Column({ default: true })
  bidirectionalSync: boolean;

  @Column({ nullable: true, type: 'timestamp' })
  lastSyncAt: Date;

  @Column({ nullable: true })
  syncToken: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('sync_event_mappings')
export class SyncEventMapping {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => SyncedCalendar, { onDelete: 'CASCADE' })
  syncedCalendar: SyncedCalendar;

  @Column()
  syncedCalendarId: number;

  @Column()
  localEventId: number;

  @Column()
  externalEventId: string;

  @Column({ nullable: true, type: 'timestamp' })
  lastModifiedLocal: Date;

  @Column({ nullable: true, type: 'timestamp' })
  lastModifiedExternal: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}