import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { timestampTzType } from './column-types';

@Entity('idempotency_records')
@Index(['key', 'userId', 'scope'], { unique: true })
export class IdempotencyRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 128 })
  key!: string;

  @Column({ length: 128 })
  scope!: string;

  @Column()
  userId!: number;

  @Column({ length: 128 })
  requestHash!: string;

  @Column({ type: 'text', nullable: true })
  responsePayload?: string | null;

  @Column({ type: timestampTzType })
  expiresAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
