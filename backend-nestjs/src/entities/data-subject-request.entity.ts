import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type DataSubjectRequestType = 'access' | 'export' | 'delete';

export type DataSubjectRequestStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'rejected';

@Entity({ name: 'data_subject_requests' })
@Index('idx_dsr_status_created', ['status', 'createdAt'])
@Index('idx_dsr_user_type_status', ['userId', 'requestType', 'status'])
export class DataSubjectRequest {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  @Index('idx_dsr_user_id')
  userId!: number;

  @Column({ type: 'varchar', length: 16 })
  requestType!: DataSubjectRequestType;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status!: DataSubjectRequestStatus;

  @Column({ type: 'text', nullable: true })
  reason?: string | null;

  @Column({ type: 'int', nullable: true })
  handledByUserId?: number | null;

  @Column({ type: 'text', nullable: true })
  adminNotes?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date | null;

  @Column({ type: 'simple-json', nullable: true })
  payload?: Record<string, unknown> | null;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
