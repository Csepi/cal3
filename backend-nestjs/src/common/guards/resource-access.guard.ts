import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resource } from '../../entities/resource.entity';
import { PermissionResolverService } from '../services/permission-resolver.service';

export type ResourceAccessAction = 'view' | 'edit' | 'delete';

export interface ResourceAccessPolicy {
  canUserViewResource(userId: number, resourceId: number): Promise<boolean>;
  canUserEditResource(userId: number, resourceId: number): Promise<boolean>;
  canUserDeleteResource(userId: number, resourceId: number): Promise<boolean>;
}

export const RESOURCE_ACCESS_ACTION_KEY = 'resourceAccessAction';
export const RESOURCE_ACCESS_MESSAGE_KEY = 'resourceAccessMessage';

@Injectable()
export class ResourceAccessGuard
  implements CanActivate, ResourceAccessPolicy
{
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionResolver: PermissionResolverService,
    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handlerAction =
      this.reflector.get<ResourceAccessAction>(
        RESOURCE_ACCESS_ACTION_KEY,
        context.getHandler(),
      ) || 'view';

    const request = context.switchToHttp().getRequest();
    const resourceId = Number(
      request?.params?.id ?? request?.params?.resourceId,
    );
    const userId = Number(request?.user?.id);

    if (!resourceId || !userId) {
      throw new ForbiddenException('Resource not found');
    }

    const customMessage =
      this.reflector.get<string>(
        RESOURCE_ACCESS_MESSAGE_KEY,
        context.getHandler(),
      ) || undefined;

    if (handlerAction === 'edit') {
      return this.assertAccess(
        this.canUserEditResource(userId, resourceId),
        customMessage ?? 'You do not have permission to edit this resource',
      );
    }

    if (handlerAction === 'delete') {
      return this.assertAccess(
        this.canUserDeleteResource(userId, resourceId),
        customMessage ?? 'You do not have permission to delete this resource',
      );
    }

    return this.assertAccess(
      this.canUserViewResource(userId, resourceId),
      customMessage ?? 'You do not have permission to view this resource',
    );
  }

  async canUserViewResource(
    userId: number,
    resourceId: number,
  ): Promise<boolean> {
    const resource = await this.resourceRepository.findOne({
      where: { id: resourceId },
      relations: ['resourceType'],
    });
    if (!resource || !resource.resourceType) {
      throw new ForbiddenException('Resource not found');
    }

    return this.permissionResolver.canUserAccessOrganization(
      userId,
      resource.resourceType.organisationId,
    );
  }

  async canUserEditResource(
    userId: number,
    resourceId: number,
  ): Promise<boolean> {
    const resource = await this.resourceRepository.findOne({
      where: { id: resourceId },
      relations: ['resourceType'],
    });
    if (!resource || !resource.resourceType) {
      throw new ForbiddenException('Resource not found');
    }

    return this.permissionResolver.canUserEditResourceType(
      userId,
      resource.resourceType.id,
    );
  }

  async canUserDeleteResource(
    userId: number,
    resourceId: number,
  ): Promise<boolean> {
    return this.canUserEditResource(userId, resourceId);
  }

  private async assertAccess(
    accessPromise: Promise<boolean>,
    message: string,
  ): Promise<boolean> {
    const canAccess = await accessPromise;
    if (!canAccess) {
      throw new ForbiddenException(message);
    }
    return true;
  }
}
