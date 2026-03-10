import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { timestampType } from './column-types';
import { User } from './user.entity';
import { AutomationCondition } from './automation-condition.entity';
import { AutomationAction } from './automation-action.entity';
import { AutomationAuditLog } from './automation-audit-log.entity';

export enum TriggerType {
  EVENT_CREATED = 'event.created',
  EVENT_UPDATED = 'event.updated',
  EVENT_DELETED = 'event.deleted',
  EVENT_STARTS_IN = 'event.starts_in',
  EVENT_ENDS_IN = 'event.ends_in',
  CALENDAR_IMPORTED = 'calendar.imported',
  SCHEDULED_TIME = 'scheduled.time',
  WEBHOOK_INCOMING = 'webhook.incoming',
}

export enum ConditionLogic {
  AND = 'AND',
  OR = 'OR',
}

@Entity('automation_rules')
export class AutomationRule {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 200 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  triggerType!: TriggerType;

  @Column({ type: 'json', nullable: true })
  triggerConfig!: Record<string, unknown>;

  @Column({ default: true })
  isEnabled!: boolean;

  @Column({
    type: 'varchar',
    length: 10,
    default: ConditionLogic.AND,
  })
  conditionLogic!: ConditionLogic;

  @Column({ type: timestampType, nullable: true })
  lastExecutedAt!: Date;

  @Column({ default: 0 })
  executionCount!: number;

  @Column({ type: 'varchar', length: 64, nullable: true, unique: true })
  webhookToken!: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  webhookSecret!: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  webhookSecretPrevious!: string | null;

  @Column({ type: timestampType, nullable: true })
  webhookSecretRotatedAt!: Date | null;

  @Column({ type: timestampType, nullable: true })
  webhookSecretGraceUntil!: Date | null;

  @Column({ default: false })
  isApprovalRequired!: boolean;

  @Column({ type: timestampType, nullable: true })
  approvedAt!: Date | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  approvedBy!: User | null;

  @Column({ type: 'integer', nullable: true })
  approvedByUserId!: number | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  createdBy!: User;

  @Column()
  createdById!: number;

  @OneToMany(() => AutomationCondition, (condition) => condition.rule, {
    cascade: true,
  })
  conditions!: AutomationCondition[];

  @OneToMany(() => AutomationAction, (action) => action.rule, {
    cascade: true,
  })
  actions!: AutomationAction[];

  @OneToMany(() => AutomationAuditLog, (log) => log.rule)
  auditLogs!: AutomationAuditLog[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
