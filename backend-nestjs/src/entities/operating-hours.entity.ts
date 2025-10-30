import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { ResourceType } from './resource-type.entity';

@Entity('operating_hours')
export class OperatingHours {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  dayOfWeek: number;

  @Column({ type: 'time' })
  openTime: string;

  @Column({ type: 'time' })
  closeTime: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => ResourceType, (resourceType) => resourceType.operatingHours)
  resourceType: ResourceType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
