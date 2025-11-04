import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { NotificationThread } from './notification-thread.entity';
import { User } from './user.entity';

@Entity('notification_thread_states')
@Unique(['threadId', 'userId'])
@Index(['userId', 'isMuted'])
export class NotificationThreadState {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  threadId!: number;

  @ManyToOne(() => NotificationThread, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'threadId' })
  thread!: NotificationThread;

  @Column({ type: 'int' })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'boolean', default: false })
  isMuted!: boolean;

  @Column({ type: 'boolean', default: false })
  isArchived!: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastReadAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
