import { Injectable } from '@nestjs/common';
import { UserPermissionsService } from './user-permissions.service';

@Injectable()
export class PermissionResolverService {
  constructor(private readonly userPermissionsService: UserPermissionsService) {}

  canUserAccessOrganization(userId: number, organizationId: number) {
    return this.userPermissionsService.canUserAccessOrganization(
      userId,
      organizationId,
    );
  }

  canUserAdminOrganization(userId: number, organizationId: number) {
    return this.userPermissionsService.canUserAdminOrganization(
      userId,
      organizationId,
    );
  }

  canUserEditResourceType(userId: number, resourceTypeId: number) {
    return this.userPermissionsService.canUserEditResourceType(
      userId,
      resourceTypeId,
    );
  }

  canUserModifyOrganizationSettings(userId: number, organizationId: number) {
    return this.userPermissionsService.canUserModifyOrganizationSettings(
      userId,
      organizationId,
    );
  }
}
