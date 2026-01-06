import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { timestampWithTimeZoneType } from './column-types';
import { NotificationMessage } from './notification-message.entity';
import { NotificationThreadState } from './notification-thread-state.entity';

@Entity('notification_threads')
@Index(['threadKey'], { unique: true })
export class NotificationThread {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 160 })
  threadKey!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  contextType?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  contextId?: string | null;

  @Column({ type: 'varchar', length: 250, nullable: true })
  title?: string | null;

  @Column({ type: timestampWithTimeZoneType, nullable: true })
  lastMessageAt?: Date | null;

  @OneToMany(() => NotificationMessage, (message) => message.thread)
  messages?: NotificationMessage[];

  @OneToMany(() => NotificationThreadState, (threadState) => threadState.thread)
  threadStates?: NotificationThreadState[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
