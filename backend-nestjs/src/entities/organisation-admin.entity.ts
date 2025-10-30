import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Organisation } from './organisation.entity';

/**
 * OrganisationAdmin Entity
 *
 * Represents the relationship between a user and an organisation where the user
 * has administrative privileges within that organisation. Organisation admins can:
 * - Add/remove users from the organisation
 * - Create and manage reservation calendars
 * - Assign editor/reviewer roles to reservation calendars
 * - Automatically become editors of all reservation calendars in their organisation
 */
@Entity('organisation_admins')
@Unique(['organisationId', 'userId']) // Prevent duplicate admin assignments
export class OrganisationAdmin {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  organisationId: number;

  @Column()
  userId: number;

  @Column({ nullable: true })
  assignedById: number; // Global admin who assigned this role

  @CreateDateColumn()
  assignedAt: Date;

  // Relationships
  @ManyToOne(() => Organisation, { onDelete: 'CASCADE' })
  organisation: Organisation;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => User, { nullable: true })
  assignedBy: User; // Global admin who assigned this role
}
