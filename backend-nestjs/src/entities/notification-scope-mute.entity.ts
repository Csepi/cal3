import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('notification_scope_mutes')
@Index(['userId', 'scopeType', 'scopeId'], { unique: true })
export class NotificationScopeMute {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  userId!: number;

  @Column({ type: 'varchar', length: 32 })
  scopeType!: string;

  @Column({ type: 'varchar', length: 120 })
  scopeId!: string;

  @Column({ type: 'boolean', default: true })
  isMuted!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
