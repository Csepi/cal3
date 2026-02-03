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
 * Enumeration for organization user roles
 */
export enum OrganisationRoleType {
  ADMIN = 'admin', // Full organization control
  EDITOR = 'editor', // Edit resources and reservations
  USER = 'user', // View access only
}

/**
 * OrganisationUser Entity
 *
 * Represents the relationship between a user and an organisation with a specific role.
 * This is separate from OrganisationAdmin (which is for Cal3-admin level assignments)
 * and provides organization-level role management.
 *
 * Role Hierarchy:
 * - ADMIN: Can manage organization settings, users, and all resources
 * - EDITOR: Can edit resources, reservations, and resource types
 * - USER: Can view resource calendars and basic organization info
 *
 * Special Notes:
 * - Users must have Store or Enterprise plans to be assigned any role
 * - Users can have different roles in different organizations
 * - Organization admins (from OrganisationAdmin entity) automatically get ADMIN role here
 * - Granular permissions can further restrict access when enabled
 */
@Entity('organisation_users')
@Unique(['organisationId', 'userId']) // Prevent duplicate role assignments
export class OrganisationUser {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  organisationId!: number;

  @Column()
  userId!: number;

  @Column({
    type: 'varchar',
    enum: OrganisationRoleType,
    default: OrganisationRoleType.USER,
  })
  role!: OrganisationRoleType;

  @Column({ nullable: true })
  assignedById!: number | null; // Who assigned this role (org admin or Cal3 admin)

  @Column({ default: false })
  isOrganisationAdmin!: boolean; // True if this user is also an OrganisationAdmin

  @CreateDateColumn()
  assignedAt!: Date;

  // Relationships
  @ManyToOne(() => Organisation, (organisation) => organisation.users, {
    onDelete: 'CASCADE',
  })
  organisation!: Organisation;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;

  @ManyToOne(() => User, { nullable: true })
  assignedBy!: User | null; // Who assigned this role
}
