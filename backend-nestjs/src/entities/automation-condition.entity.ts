import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { AutomationRule } from './automation-rule.entity';

export enum ConditionField {
  // Event properties
  EVENT_TITLE = 'event.title',
  EVENT_DESCRIPTION = 'event.description',
  EVENT_LOCATION = 'event.location',
  EVENT_NOTES = 'event.notes',
  EVENT_DURATION = 'event.duration',
  EVENT_IS_ALL_DAY = 'event.is_all_day',
  EVENT_COLOR = 'event.color',
  EVENT_STATUS = 'event.status',

  // Calendar properties
  EVENT_CALENDAR_ID = 'event.calendar.id',
  EVENT_CALENDAR_NAME = 'event.calendar.name',

  // Webhook properties (supports dynamic JSON path access)
  WEBHOOK_DATA = 'webhook.data',
}

export enum ConditionOperator {
  // String operators
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  MATCHES = 'matches', // regex
  NOT_MATCHES = 'not_matches',
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty',

  // Numeric operators
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
  LESS_THAN_OR_EQUAL = 'less_than_or_equal',

  // Boolean operators
  IS_TRUE = 'is_true',
  IS_FALSE = 'is_false',

  // Array operators
  IN = 'in',
  NOT_IN = 'not_in',
  IN_LIST = 'in_list', // Alias for frontend compatibility
  NOT_IN_LIST = 'not_in_list', // Alias for frontend compatibility
}

export enum ConditionLogicOperator {
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
}

@Entity('automation_conditions')
export class AutomationCondition {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => AutomationRule, (rule) => rule.conditions, {
    onDelete: 'CASCADE',
  })
  rule!: AutomationRule;

  @Column()
  ruleId!: number;

  @Column({
    type: 'varchar',
    length: 100,
  })
  field!: ConditionField;

  @Column({
    type: 'varchar',
    length: 50,
  })
  operator!: ConditionOperator;

  @Column({ type: 'text' })
  value!: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  groupId!: string;

  @Column({
    type: 'varchar',
    length: 10,
    default: ConditionLogicOperator.AND,
  })
  logicOperator!: ConditionLogicOperator;

  @Column({ default: 0 })
  order!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
