import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type LogLevel =
  | 'log'
  | 'info'
  | 'error'
  | 'warn'
  | 'debug'
  | 'verbose'
  | 'trace';

@Entity({ name: 'app_logs' })
export class LogEntry {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @Index('idx_app_logs_level')
  @Column({ type: 'varchar', length: 16 })
  level!: LogLevel;

  @Index('idx_app_logs_context')
  @Column({ type: 'varchar', length: 128, nullable: true })
  context?: string | null;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'text', nullable: true })
  stack?: string | null;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, unknown> | null;
}
