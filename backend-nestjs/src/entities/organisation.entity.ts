import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from './user.entity';
import { ResourceType } from './resource-type.entity';
import { OrganisationAdmin } from './organisation-admin.entity';
import { ReservationCalendar } from './reservation-calendar.entity';
import { Reservation } from './reservation.entity';
import { Resource } from './resource.entity';

@Entity('organisations')
export class Organisation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 255, nullable: true })
  address: string;

  @Column({ length: 50, nullable: true })
  phone: string;

  @Column({ length: 255, nullable: true })
  email: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  useGranularResourcePermissions: boolean;

  @Column({ default: false })
  useGranularCalendarPermissions: boolean;

  @Column({ length: 7, default: '#f97316' })
  color: string;

  @ManyToMany(() => User, (user) => user.organisations)
  @JoinTable({
    name: 'organisation_users',
    joinColumn: { name: 'organisationId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  users: User[];

  @OneToMany(() => ResourceType, (resourceType) => resourceType.organisation)
  resourceTypes: ResourceType[];

  @OneToMany(() => Resource, (resource) => resource.organisation)
  resources: Resource[];

  // Organisation admin relationships
  @OneToMany(() => OrganisationAdmin, (orgAdmin) => orgAdmin.organisation)
  organisationAdmins: OrganisationAdmin[];

  // Reservation calendar relationships
  @OneToMany(
    () => ReservationCalendar,
    (reservationCalendar) => reservationCalendar.organisation,
  )
  reservationCalendars: ReservationCalendar[];

  @OneToMany(() => Reservation, (reservation) => reservation.organisation)
  reservations: Reservation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
