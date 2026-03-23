import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { timestampTzType } from './column-types';
import { AutomationRule } from './automation-rule.entity';
import { Event } from './event.entity';

export enum AutomationScheduledTriggerStatus {
  SCHEDULED = 'scheduled',
  RUNNING = 'running',
  FIRED = 'fired',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

@Entity('automation_scheduled_triggers')
@Unique('uq_automation_scheduled_triggers_rule_event_occurrence', [
  'ruleId',
  'eventId',
  'occurrenceId',
])
@Index('idx_automation_scheduled_triggers_status_scheduledAt', [
  'status',
  'scheduledAt',
])
@Index('idx_automation_scheduled_triggers_event_rule', ['eventId', 'ruleId'])
export class AutomationScheduledTrigger {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => AutomationRule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ruleId' })
  rule!: AutomationRule;

  @Column()
  ruleId!: number;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event!: Event;

  @Column()
  eventId!: number;

  @Column({ type: 'varchar', length: 255, default: '' })
  occurrenceId!: string;

  @Column({ type: timestampTzType })
  scheduledAt!: Date;

  @Column({
    type: 'varchar',
    length: 20,
    default: AutomationScheduledTriggerStatus.SCHEDULED,
  })
  status!: AutomationScheduledTriggerStatus;

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @Column({ type: timestampTzType, nullable: true })
  firedAt!: Date | null;

  @Column({ type: timestampTzType, nullable: true })
  cancelledAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  lastError!: string | null;

  @CreateDateColumn({ type: timestampTzType })
  createdAt!: Date;

  @UpdateDateColumn({ type: timestampTzType })
  updatedAt!: Date;
}
