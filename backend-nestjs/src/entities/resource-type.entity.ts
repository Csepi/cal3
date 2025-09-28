import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Organisation } from './organisation.entity';
import { Resource } from './resource.entity';
import { OperatingHours } from './operating-hours.entity';

@Entity('resource_types')
export class ResourceType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 30 })
  minBookingDuration: number;

  @Column({ type: 'int', default: 0 })
  bufferTime: number;

  @Column({ type: 'json', default: () => "'[\"name\", \"phone\", \"email\"]'" })
  customerInfoFields: string[];

  @Column({ default: false })
  waitlistEnabled: boolean;

  @Column({ default: false })
  recurringEnabled: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  organisationId: number;

  @ManyToOne(() => Organisation, (organisation) => organisation.resourceTypes)
  organisation: Organisation;

  @OneToMany(() => Resource, (resource) => resource.resourceType)
  resources: Resource[];

  @OneToMany(() => OperatingHours, (hours) => hours.resourceType)
  operatingHours: OperatingHours[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}