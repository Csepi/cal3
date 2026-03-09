import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type AuditEventCategory =
  | 'security'
  | 'permission'
  | 'mutation'
  | 'api_error'
  | 'frontend_error'
  | 'system';

export type AuditEventSeverity = 'info' | 'warn' | 'critical';
export type AuditEventOutcome = 'success' | 'failure' | 'denied';

@Entity({ name: 'audit_events' })
export class AuditEvent {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn()
  @Index('idx_audit_events_created_at')
  createdAt!: Date;

  @Column({ type: 'varchar', length: 32 })
  @Index('idx_audit_events_category')
  category!: AuditEventCategory;

  @Column({ type: 'varchar', length: 160 })
  @Index('idx_audit_events_action')
  action!: string;

  @Column({ type: 'varchar', length: 16 })
  @Index('idx_audit_events_severity')
  severity!: AuditEventSeverity;

  @Column({ type: 'varchar', length: 16 })
  outcome!: AuditEventOutcome;

  @Column({ type: 'varchar', length: 64, nullable: true })
  @Index('idx_audit_events_request_id')
  requestId?: string | null;

  @Column({ type: 'int', nullable: true })
  @Index('idx_audit_events_user_id')
  userId?: number | null;

  @Column({ type: 'int', nullable: true })
  @Index('idx_audit_events_org_id')
  organisationId?: number | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  resourceType?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  resourceId?: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip?: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  method?: string | null;

  @Column({ type: 'varchar', length: 400, nullable: true })
  path?: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  errorCode?: string | null;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string | null;

  @Column({ type: 'simple-json', nullable: true })
  beforeSnapshot?: Record<string, unknown> | null;

  @Column({ type: 'simple-json', nullable: true })
  afterSnapshot?: Record<string, unknown> | null;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  @Index('idx_audit_events_fingerprint')
  fingerprint?: string | null;
}
