import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Organisation } from '../../entities/organisation.entity';
import { ResourceType } from '../../entities/resource-type.entity';
import { Resource } from '../../entities/resource.entity';
import { Reservation } from '../../entities/reservation.entity';

import { logError } from '../errors/error-logger';
import { buildErrorContext } from '../errors/error-context';
export interface CascadeDeletePreview {
  resourceTypes?: number;
  resources?: number;
  reservations?: number;
  totalItems?: number;
  details?: string[];
}

export interface CascadeDeleteResult extends CascadeDeletePreview {
  success: boolean;
  message: string;
}

/**
 * CascadeDeletionService
 *
 * Handles safe cascade deletion of organizations, resource types, and resources.
 * All operations are performed within database transactions to ensure atomicity.
 *
 * Features:
 * - Preview mode: Show what will be deleted without executing
 * - Transaction support: All-or-nothing deletion
 * - Audit logging: Track all cascade operations
 * - Safety checks: Validate existence before deletion
 */
@Injectable()
export class CascadeDeletionService {
  private readonly logger = new Logger(CascadeDeletionService.name);

  constructor(
    @InjectRepository(Organisation)
    private organisationRepository: Repository<Organisation>,
    @InjectRepository(ResourceType)
    private resourceTypeRepository: Repository<ResourceType>,
    @InjectRepository(Resource)
    private resourceRepository: Repository<Resource>,
    private dataSource: DataSource,
  ) {}

  /**
   * Preview what will be deleted when deleting an organization
   */
  async previewOrganizationDeletion(
    organisationId: number,
  ): Promise<CascadeDeletePreview> {
    const organisation = await this.organisationRepository.findOne({
      where: { id: organisationId },
      relations: ['resourceTypes'],
    });

    if (!organisation) {
      throw new NotFoundException(`Organisation #${organisationId} not found`);
    }

    const resourceTypeIds = organisation.resourceTypes.map((rt) => rt.id);
    let resourceCount = 0;
    let reservationCount = 0;
    const details: string[] = [];

    if (resourceTypeIds.length > 0) {
      const resources = await this.resourceRepository
        .createQueryBuilder('resource')
        .leftJoinAndSelect('resource.reservations', 'reservation')
        .leftJoinAndSelect('resource.resourceType', 'resourceType')
        .where('resourceType.id IN (:...resourceTypeIds)', { resourceTypeIds })
        .getMany();

      resourceCount = resources.length;
      reservationCount = resources.reduce(
        (sum, r) => sum + (r.reservations?.length || 0),
        0,
      );

      details.push(`Organisation: ${organisation.name}`);
      details.push(`${resourceTypeIds.length} resource type(s)`);
      details.push(`${resourceCount} resource(s)`);
      details.push(`${reservationCount} reservation(s)`);
    } else {
      details.push(`Organisation: ${organisation.name}`);
      details.push('0 resource types');
      details.push('0 resources');
      details.push('0 reservations');
    }

    return {
      resourceTypes: resourceTypeIds.length,
      resources: resourceCount,
      reservations: reservationCount,
      totalItems: resourceTypeIds.length + resourceCount + reservationCount + 1,
      details,
    };
  }

  /**
   * Delete an organization and all its related entities
   */
  async deleteOrganization(
    organisationId: number,
    userId: number,
  ): Promise<CascadeDeleteResult> {
    const preview = await this.previewOrganizationDeletion(organisationId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const organisation = await queryRunner.manager.findOne(Organisation, {
        where: { id: organisationId },
        relations: ['resourceTypes'],
      });

      if (!organisation) {
        throw new NotFoundException(
          `Organisation #${organisationId} not found`,
        );
      }

      // Delete reservations first
      const resourceTypeIds = organisation.resourceTypes.map((rt) => rt.id);
      if (resourceTypeIds.length > 0) {
        const resources = await queryRunner.manager.find(Resource, {
          where: { resourceType: { id: In(resourceTypeIds) } },
          relations: ['reservations'],
        });

        const reservationIds = resources
          .flatMap((r) => r.reservations || [])
          .map((res) => res.id);

        if (reservationIds.length > 0) {
          await queryRunner.manager.delete(Reservation, reservationIds);
          this.logger.log(
            `Deleted ${reservationIds.length} reservations for organisation ${organisationId}`,
          );
        }

        // Delete resources
        const resourceIds = resources.map((r) => r.id);
        if (resourceIds.length > 0) {
          await queryRunner.manager.delete(Resource, resourceIds);
          this.logger.log(
            `Deleted ${resourceIds.length} resources for organisation ${organisationId}`,
          );
        }

        // Delete resource types
        await queryRunner.manager.delete(ResourceType, resourceTypeIds);
        this.logger.log(
          `Deleted ${resourceTypeIds.length} resource types for organisation ${organisationId}`,
        );
      }

      // Finally delete the organization
      await queryRunner.manager.delete(Organisation, organisationId);
      this.logger.log(
        `Deleted organisation ${organisationId} by user ${userId}`,
      );

      await queryRunner.commitTransaction();

      return {
        success: true,
        message: 'Organisation and all related entities deleted successfully',
        ...preview,
      };
    } catch (error) {
      logError(
        error,
        buildErrorContext({ action: 'cascade-deletion.service' }),
      );
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to delete organisation ${organisationId}:`,
        error,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Preview what will be deleted when deleting a resource type
   */
  async previewResourceTypeDeletion(
    resourceTypeId: number,
  ): Promise<CascadeDeletePreview> {
    const resourceType = await this.resourceTypeRepository.findOne({
      where: { id: resourceTypeId },
      relations: ['resources', 'resources.reservations'],
    });

    if (!resourceType) {
      throw new NotFoundException(`ResourceType #${resourceTypeId} not found`);
    }

    const resourceCount = resourceType.resources?.length || 0;
    const reservationCount =
      resourceType.resources?.reduce(
        (sum, r) => sum + (r.reservations?.length || 0),
        0,
      ) || 0;

    const details: string[] = [
      `Resource Type: ${resourceType.name}`,
      `${resourceCount} resource(s)`,
      `${reservationCount} reservation(s)`,
    ];

    return {
      resources: resourceCount,
      reservations: reservationCount,
      totalItems: 1 + resourceCount + reservationCount,
      details,
    };
  }

  /**
   * Delete a resource type and all its related entities
   */
  async deleteResourceType(
    resourceTypeId: number,
    userId: number,
  ): Promise<CascadeDeleteResult> {
    const preview = await this.previewResourceTypeDeletion(resourceTypeId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const resourceType = await queryRunner.manager.findOne(ResourceType, {
        where: { id: resourceTypeId },
        relations: ['resources', 'resources.reservations'],
      });

      if (!resourceType) {
        throw new NotFoundException(
          `ResourceType #${resourceTypeId} not found`,
        );
      }

      // Delete reservations
      const reservationIds =
        resourceType.resources
          ?.flatMap((r) => r.reservations || [])
          .map((res) => res.id) || [];

      if (reservationIds.length > 0) {
        await queryRunner.manager.delete(Reservation, reservationIds);
        this.logger.log(
          `Deleted ${reservationIds.length} reservations for resource type ${resourceTypeId}`,
        );
      }

      // Delete resources
      const resourceIds = resourceType.resources?.map((r) => r.id) || [];
      if (resourceIds.length > 0) {
        await queryRunner.manager.delete(Resource, resourceIds);
        this.logger.log(
          `Deleted ${resourceIds.length} resources for resource type ${resourceTypeId}`,
        );
      }

      // Delete resource type
      await queryRunner.manager.delete(ResourceType, resourceTypeId);
      this.logger.log(
        `Deleted resource type ${resourceTypeId} by user ${userId}`,
      );

      await queryRunner.commitTransaction();

      return {
        success: true,
        message: 'Resource type and all related entities deleted successfully',
        ...preview,
      };
    } catch (error) {
      logError(
        error,
        buildErrorContext({ action: 'cascade-deletion.service' }),
      );
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to delete resource type ${resourceTypeId}:`,
        error,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Preview what will be deleted when deleting a resource
   */
  async previewResourceDeletion(
    resourceId: number,
  ): Promise<CascadeDeletePreview> {
    const resource = await this.resourceRepository.findOne({
      where: { id: resourceId },
      relations: ['reservations', 'resourceType'],
    });

    if (!resource) {
      throw new NotFoundException(`Resource #${resourceId} not found`);
    }

    const reservationCount = resource.reservations?.length || 0;

    const details: string[] = [
      `Resource: ${resource.name}`,
      `Type: ${resource.resourceType?.name || 'Unknown'}`,
      `${reservationCount} reservation(s)`,
    ];

    return {
      reservations: reservationCount,
      totalItems: 1 + reservationCount,
      details,
    };
  }

  /**
   * Delete a resource and all its related reservations
   */
  async deleteResource(
    resourceId: number,
    userId: number,
  ): Promise<CascadeDeleteResult> {
    const preview = await this.previewResourceDeletion(resourceId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const resource = await queryRunner.manager.findOne(Resource, {
        where: { id: resourceId },
        relations: ['reservations'],
      });

      if (!resource) {
        throw new NotFoundException(`Resource #${resourceId} not found`);
      }

      // Delete reservations
      const reservationIds = resource.reservations?.map((r) => r.id) || [];
      if (reservationIds.length > 0) {
        await queryRunner.manager.delete(Reservation, reservationIds);
        this.logger.log(
          `Deleted ${reservationIds.length} reservations for resource ${resourceId}`,
        );
      }

      // Delete resource
      await queryRunner.manager.delete(Resource, resourceId);
      this.logger.log(`Deleted resource ${resourceId} by user ${userId}`);

      await queryRunner.commitTransaction();

      return {
        success: true,
        message: 'Resource and all related reservations deleted successfully',
        ...preview,
      };
    } catch (error) {
      logError(
        error,
        buildErrorContext({ action: 'cascade-deletion.service' }),
      );
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to delete resource ${resourceId}:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
