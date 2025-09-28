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
import { ResourceType } from './resource-type.entity';

/**
 * OrganisationResourceTypePermission Entity
 *
 * Provides granular permissions for specific resource types within an organization.
 * This entity is only used when Organisation.useGranularResourcePermissions = true.
 *
 * When granular permissions are enabled:
 * - Users must be explicitly granted permission to edit specific resource types
 * - Organization role (ADMIN/EDITOR/USER) does not automatically grant resource access
 * - Organization admins can assign/revoke these permissions
 *
 * When granular permissions are disabled:
 * - This entity is ignored
 * - Organization role determines access to ALL resource types
 *
 * Permission Logic:
 * - canEdit: User can create, modify, and delete this resource type
 * - No canView flag: Organization membership always grants view access
 */
@Entity('organisation_resource_type_permissions')
@Unique(['organisationId', 'userId', 'resourceTypeId']) // Prevent duplicate permissions
export class OrganisationResourceTypePermission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  organisationId: number;

  @Column()
  userId: number;

  @Column()
  resourceTypeId: number;

  @Column({ default: false })
  canEdit: boolean; // Can create, modify, delete this resource type

  @Column({ nullable: true })
  assignedById: number; // Organization admin who granted this permission

  @CreateDateColumn()
  assignedAt: Date;

  // Relationships
  @ManyToOne(() => Organisation, { onDelete: 'CASCADE' })
  organisation: Organisation;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => ResourceType, { onDelete: 'CASCADE' })
  resourceType: ResourceType;

  @ManyToOne(() => User, { nullable: true })
  assignedBy: User; // Organization admin who granted this permission
}