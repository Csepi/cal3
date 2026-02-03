import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { timestampType } from './column-types';
import { Resource } from './resource.entity';
import { User } from './user.entity';
import { Organisation } from './organisation.entity';

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
  id!: number;

  @Column({ type: timestampType })
  startTime!: Date;

  @Column({ type: timestampType })
  endTime!: Date;

  @Column({ type: 'int', default: 1 })
  quantity!: number;

  @Column({ type: 'json', nullable: true })
  customerInfo!: Record<string, unknown>;

  @Column({
    type: 'varchar',
    default: ReservationStatus.PENDING,
  })
  status!: ReservationStatus;

  @Column({ type: 'text', nullable: true })
  notes!: string;

  @Column({ type: 'int', nullable: true })
  parentReservationId!: number;

  @Column({ type: 'json', nullable: true })
  recurrencePattern!: Record<string, unknown>;

  @ManyToOne(() => Resource, (resource) => resource.reservations)
  resource!: Resource;

  @Column({ nullable: true })
  organisationId!: number;

  @ManyToOne(() => Organisation, (organisation) => organisation.reservations, {
    onDelete: 'SET NULL',
  })
  organisation!: Organisation;

  @ManyToOne(() => User, { nullable: true })
  createdBy!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @BeforeInsert()
  @BeforeUpdate()
  syncOrganisationScope() {
    if (!this.organisationId && this.resource?.organisationId) {
      this.organisationId = this.resource.organisationId;
    }
  }
}
