import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Calendar } from './calendar.entity';

@Entity('calendar_groups')
export class CalendarGroup {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 200 })
  name!: string;

  @Column({ default: true })
  isVisible!: boolean;

  @Column()
  ownerId!: number;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  owner!: User;

  @OneToMany(() => Calendar, (calendar) => calendar.group)
  calendars!: Calendar[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
