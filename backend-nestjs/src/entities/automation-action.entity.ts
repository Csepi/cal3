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
  SET_EVENT_COLOR = 'set_event_color',
  ADD_EVENT_TAG = 'add_event_tag',
  SEND_NOTIFICATION = 'send_notification',
  UPDATE_EVENT_TITLE = 'update_event_title',
  UPDATE_EVENT_DESCRIPTION = 'update_event_description',
  CANCEL_EVENT = 'cancel_event',
  MOVE_TO_CALENDAR = 'move_to_calendar',
  CREATE_TASK = 'create_task',
  WEBHOOK = 'webhook',
}

@Entity('automation_actions')
export class AutomationAction {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => AutomationRule, (rule) => rule.actions, {
    onDelete: 'CASCADE',
  })
  rule!: AutomationRule;

  @Column()
  ruleId!: number;

  @Column({
    type: 'varchar',
    length: 50,
  })
  actionType!: ActionType;

  @Column({ type: 'json' })
  actionConfig!: Record<string, unknown>;

  @Column({ default: 0 })
  order!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
