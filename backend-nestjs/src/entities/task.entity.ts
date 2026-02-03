import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { timestampTzType } from './column-types';
import { User } from './user.entity';
import { Event } from './event.entity';
import { TaskLabel } from './task-label.entity';

export enum TaskPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 240 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  body!: string | null;

  @Column({ length: 20, default: 'markdown' })
  bodyFormat!: string;

  @Column({ length: 7, default: '#eab308' })
  color!: string;

  @Column({
    type: 'varchar',
    length: 16,
    default: TaskPriority.MEDIUM,
  })
  priority!: TaskPriority;

  @Column({
    type: 'varchar',
    length: 16,
    default: TaskStatus.TODO,
  })
  status!: TaskStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  place!: string | null;

  @Column({ type: timestampTzType, nullable: true })
  dueDate!: Date | null;

  @Column({ type: timestampTzType, nullable: true })
  dueEnd!: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  dueTimezone!: string | null;

  @Column({ type: timestampTzType, nullable: true })
  lastSyncedAt!: Date | null;

  @ManyToOne(() => User, (user) => user.tasks, { onDelete: 'CASCADE' })
  owner!: User;

  @Column()
  ownerId!: number;

  @ManyToOne(() => User, (user) => user.assignedTasks, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  assignee!: User | null;

  @Column({ type: 'integer', nullable: true })
  assigneeId!: number | null;

  @ManyToOne(() => Event, { nullable: true, onDelete: 'SET NULL' })
  mirroredEvent!: Event | null;

  @Column({ type: 'integer', nullable: true })
  calendarEventId!: number | null;

  @ManyToMany(() => TaskLabel, (label) => label.tasks, {
    cascade: true,
  })
  @JoinTable({
    name: 'task_label_assignments',
    joinColumn: { name: 'taskId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'labelId', referencedColumnName: 'id' },
  })
  labels!: TaskLabel[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
