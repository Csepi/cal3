import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user_notification_preferences')
@Unique(['userId', 'eventType'])
@Index(['userId'])
export class UserNotificationPreference {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  userId!: number;

  @Column({ type: 'varchar', length: 120 })
  eventType!: string;

  @Column({ type: 'json' })
  channels!: Record<string, boolean>;

  @Column({ type: 'varchar', length: 24, default: 'immediate' })
  digest!: string;

  @Column({ type: 'json', nullable: true })
  fallbackOrder?: string[] | null;

  @Column({ type: 'json', nullable: true })
  quietHours?: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  orgScope?: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
