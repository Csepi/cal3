import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('notification_inbox_rules')
@Index(['userId', 'order'])
export class NotificationInboxRule {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  userId!: number;

  @Column({ type: 'varchar', length: 24, default: 'global' })
  scopeType!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  scopeId?: string | null;

  @Column({ type: 'varchar', length: 160 })
  name!: string;

  @Column({ type: 'int', default: 0 })
  order!: number;

  @Column({ type: 'boolean', default: true })
  isEnabled!: boolean;

  @Column({ type: 'boolean', default: false })
  continueProcessing!: boolean;

  @Column({ type: 'json' })
  conditions!: unknown[];

  @Column({ type: 'json' })
  actions!: unknown[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
