import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { timestampType } from './column-types';
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
  id!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;

  @Column()
  userId!: number;

  @Column()
  provider!: SyncProvider;

  @Column({ nullable: true, type: 'varchar' })
  providerUserId!: string | null;

  @Column({ nullable: true, type: 'varchar' })
  accessToken!: string | null;

  @Column({ nullable: true, type: 'varchar' })
  refreshToken!: string | null;

  @Column({ nullable: true, type: timestampType })
  tokenExpiresAt!: Date | null;

  @Column({
    default: SyncStatus.ACTIVE,
  })
  status!: SyncStatus;

  @Column({ nullable: true, type: timestampType })
  lastSyncAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('synced_calendars')
export class SyncedCalendar {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => CalendarSyncConnection, { onDelete: 'CASCADE' })
  syncConnection!: CalendarSyncConnection;

  @Column()
  syncConnectionId!: number;

  @ManyToOne(() => Calendar, { onDelete: 'CASCADE' })
  localCalendar!: Calendar;

  @Column()
  localCalendarId!: number;

  @Column()
  externalCalendarId!: string;

  @Column()
  externalCalendarName!: string;

  @Column({ default: true })
  bidirectionalSync!: boolean;

  @Column({ nullable: true, type: timestampType })
  lastSyncAt!: Date;

  @Column({ nullable: true, type: 'varchar' })
  syncToken!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('sync_event_mappings')
@Index(
  'IDX_sync_event_mappings_unique',
  ['syncedCalendarId', 'externalEventId'],
  {
    unique: true,
  },
)
export class SyncEventMapping {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => SyncedCalendar, { onDelete: 'CASCADE' })
  syncedCalendar!: SyncedCalendar;

  @Column()
  syncedCalendarId!: number;

  @Column()
  localEventId!: number;

  @Column()
  externalEventId!: string;

  @Column({ nullable: true, type: timestampType })
  lastModifiedLocal!: Date;

  @Column({ nullable: true, type: timestampType })
  lastModifiedExternal!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
