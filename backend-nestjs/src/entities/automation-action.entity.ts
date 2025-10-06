import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { AutomationRule } from './automation-rule.entity';

export enum ActionType {
  // V1 Actions
  SET_EVENT_COLOR = 'set_event_color',

  // Future Actions (defined but not implemented)
  SEND_NOTIFICATION = 'send_notification',
  MODIFY_EVENT_TITLE = 'modify_event_title',
  MODIFY_EVENT_DESCRIPTION = 'modify_event_description',
  CREATE_TASK = 'create_task',
  WEBHOOK = 'webhook',
  CREATE_REMINDER = 'create_reminder',
  MOVE_TO_CALENDAR = 'move_to_calendar',
}

@Entity('automation_actions')
export class AutomationAction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => AutomationRule, (rule) => rule.actions, {
    onDelete: 'CASCADE',
  })
  rule: AutomationRule;

  @Column()
  ruleId: number;

  @Column({
    type: 'varchar',
    length: 50,
  })
  actionType: ActionType;

  @Column({ type: 'json' })
  actionConfig: Record<string, any>;

  @Column({ default: 0 })
  order: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
