import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { timestampWithTimeZoneType } from './column-types';
import { User } from './user.entity';
import { NotificationThread } from './notification-thread.entity';

@Entity('notification_messages')
@Index(['userId', 'isRead', 'archived', 'createdAt'])
@Index(['threadId', 'createdAt'])
export class NotificationMessage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', length: 120 })
  eventType!: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  title?: string | null;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'json', nullable: true })
  data?: Record<string, any> | null;

  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @Column({ type: timestampWithTimeZoneType, nullable: true })
  readAt?: Date | null;

  @Column({ type: 'boolean', default: false })
  archived!: boolean;

  @Column({ type: timestampWithTimeZoneType, nullable: true })
  archivedAt?: Date | null;

  @Column({ type: 'int', nullable: true })
  threadId?: number | null;

  @ManyToOne(() => NotificationThread, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'threadId' })
  thread?: NotificationThread | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  threadKey?: string | null;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
