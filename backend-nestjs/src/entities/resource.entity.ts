import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  BeforeInsert,
} from 'typeorm';
import { ResourceType } from './resource-type.entity';
import { Reservation } from './reservation.entity';
import { User } from './user.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity('resources')
export class Resource {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 1 })
  capacity: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ unique: true, nullable: true })
  publicBookingToken: string;

  @BeforeInsert()
  generatePublicBookingToken() {
    if (!this.publicBookingToken) {
      this.publicBookingToken = uuidv4();
    }
  }

  @ManyToOne(() => ResourceType, (resourceType) => resourceType.resources)
  resourceType: ResourceType;

  @ManyToOne(() => User)
  managedBy: User;

  @OneToMany(() => Reservation, (reservation) => reservation.resource)
  reservations: Reservation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
