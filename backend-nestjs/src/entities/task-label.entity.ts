import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Task } from './task.entity';

@Entity('task_labels')
export class TaskLabel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 64 })
  name: string;

  @Column({ length: 7, default: '#3b82f6' })
  color: string;

  @ManyToOne(() => User, (user) => user.taskLabels, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column()
  userId: number;

  @ManyToMany(() => Task, (task) => task.labels)
  tasks: Task[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
