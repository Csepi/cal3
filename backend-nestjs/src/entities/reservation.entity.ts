import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Resource } from './resource.entity';
import { User } from './user.entity';

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  WAITLIST = 'waitlist',
}

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'json', nullable: true })
  customerInfo: Record<string, any>;

  @Column({
    type: 'varchar',
    default: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'int', nullable: true })
  parentReservationId: number;

  @Column({ type: 'json', nullable: true })
  recurrencePattern: Record<string, any>;

  @ManyToOne(() => Resource, (resource) => resource.reservations)
  resource: Resource;

  @ManyToOne(() => User, { nullable: true })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
