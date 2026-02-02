import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import {
  RESOURCE_ACCESS_ACTION_KEY,
  RESOURCE_ACCESS_MESSAGE_KEY,
  ResourceAccessAction,
  ResourceAccessGuard,
} from '../guards/resource-access.guard';

export const RequireResourceAccess = (
  action: ResourceAccessAction,
  message?: string,
) =>
  applyDecorators(
    SetMetadata(RESOURCE_ACCESS_ACTION_KEY, action),
    SetMetadata(RESOURCE_ACCESS_MESSAGE_KEY, message),
    UseGuards(ResourceAccessGuard),
  );
