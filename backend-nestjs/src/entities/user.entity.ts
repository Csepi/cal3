import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { Calendar } from './calendar.entity';
import { Event } from './event.entity';
import { Exclude } from 'class-transformer';

export enum UserRole {
  OBSERVER = 'observer',
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 255 })
  username: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255 })
  @Exclude()
  password: string;

  @Column({ length: 100, nullable: true })
  firstName: string;

  @Column({ length: 100, nullable: true })
  lastName: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({
    type: 'varchar',
    default: UserRole.USER,
  })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // One user owns many calendars
  @OneToMany(() => Calendar, (calendar) => calendar.owner, { cascade: true })
  ownedCalendars: Calendar[];

  // Many users can have access to many calendars (shared calendars)
  @ManyToMany(() => Calendar, (calendar) => calendar.sharedWith)
  sharedCalendars: Calendar[];

  // One user creates many events
  @OneToMany(() => Event, (event) => event.createdBy, { cascade: true })
  createdEvents: Event[];
}