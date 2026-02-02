import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import {
  ORGANIZATION_ACCESS_ACTION_KEY,
  ORGANIZATION_ACCESS_MESSAGE_KEY,
  OrganizationAccessGuard,
} from '../guards/organization-access.guard';

export const RequireOrgAdmin = (message?: string) =>
  applyDecorators(
    SetMetadata(ORGANIZATION_ACCESS_ACTION_KEY, 'admin'),
    SetMetadata(ORGANIZATION_ACCESS_MESSAGE_KEY, message),
    UseGuards(OrganizationAccessGuard),
  );
