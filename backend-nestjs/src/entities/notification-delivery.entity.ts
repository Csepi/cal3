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
import { NotificationMessage } from './notification-message.entity';

@Entity('notification_deliveries')
@Index(['notificationId', 'channel'])
export class NotificationDelivery {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  notificationId!: number;

  @ManyToOne(() => NotificationMessage, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notificationId' })
  notification!: NotificationMessage;

  @Column({ type: 'varchar', length: 32 })
  channel!: string;

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status!: string;

  @Column({ type: 'int', default: 0 })
  attemptCount!: number;

  @Column({ type: timestampWithTimeZoneType, nullable: true })
  sentAt?: Date | null;

  @Column({ type: 'text', nullable: true })
  lastError?: string | null;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
