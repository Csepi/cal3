import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { AutomationRule, TriggerType } from './automation-rule.entity';
import { Event } from './event.entity';

export enum AuditLogStatus {
  SUCCESS = 'success',
  PARTIAL_SUCCESS = 'partial_success',
  FAILURE = 'failure',
  SKIPPED = 'skipped',
}

@Entity('automation_audit_logs')
export class AutomationAuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => AutomationRule, (rule) => rule.auditLogs, {
    onDelete: 'CASCADE',
  })
  rule: AutomationRule;

  @Column()
  ruleId: number;

  @ManyToOne(() => Event, { onDelete: 'SET NULL', nullable: true })
  event: Event;

  @Column({ nullable: true })
  eventId: number;

  @Column({
    type: 'varchar',
    length: 50,
  })
  triggerType: TriggerType;

  @Column({ type: 'json', nullable: true })
  triggerContext: Record<string, any>;

  @Column({ type: 'json' })
  conditionsResult: {
    passed: boolean;
    evaluations: Array<{
      conditionId: number;
      field: string;
      operator: string;
      expectedValue: string;
      actualValue: any;
      passed: boolean;
    }>;
  };

  @Column({ type: 'json', nullable: true })
  actionResults: Array<{
    actionId: number;
    actionType: string;
    success: boolean;
    result: any;
    errorMessage?: string;
  }>;

  @Column({
    type: 'varchar',
    length: 20,
  })
  status: AuditLogStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ default: 0 })
  duration_ms: number;

  @CreateDateColumn()
  executedAt: Date;
}
