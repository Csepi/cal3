import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { AutomationRule, TriggerType } from './automation-rule.entity';
import { Event } from './event.entity';
import { User } from './user.entity';

export enum AuditLogStatus {
  SUCCESS = 'success',
  PARTIAL_SUCCESS = 'partial_success',
  FAILURE = 'failure',
  SKIPPED = 'skipped',
}

@Entity('automation_audit_logs')
export class AutomationAuditLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => AutomationRule, (rule) => rule.auditLogs, {
    onDelete: 'CASCADE',
  })
  rule!: AutomationRule;

  @Column()
  ruleId!: number;

  @ManyToOne(() => Event, { onDelete: 'SET NULL', nullable: true })
  event!: Event | null;

  @Column({ type: 'integer', nullable: true })
  eventId!: number | null;

  @Column({
    type: 'varchar',
    length: 50,
  })
  triggerType!: TriggerType;

  @Column({ type: 'json', nullable: true })
  triggerContext!: Record<string, unknown> | null;

  @Column({ type: 'json' })
  conditionsResult!: {
    passed: boolean;
    evaluations: Array<{
      conditionId: number;
      field: string;
      operator: string;
      expectedValue: string;
      actualValue: unknown;
      passed: boolean;
    }>;
  };

  @Column({ type: 'json', nullable: true })
  actionResults!: Array<{
    actionId: number;
    actionType: string;
    success: boolean;
    result: unknown;
    errorMessage?: string;
  }>;

  @Column({
    type: 'varchar',
    length: 20,
  })
  status!: AuditLogStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ default: 0 })
  duration_ms!: number;

  // Alias for API compatibility
  get executionTimeMs(): number {
    return this.duration_ms;
  }

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  executedBy!: User | null;

  @Column({ type: 'integer', nullable: true })
  executedByUserId!: number | null;

  @CreateDateColumn()
  executedAt!: Date;
}
