import { SetMetadata } from '@nestjs/common';
import { OrganisationRoleType } from '../../entities/organisation-user.entity';

export interface OrganisationScopeOptions {
  source?: 'params' | 'body' | 'query' | 'header';
  field?: string;
  minimumRole?: OrganisationRoleType;
}

export const ORGANISATION_SCOPE_KEY = 'organisation-scope';

export const OrganisationScope = (options: OrganisationScopeOptions = {}) =>
  SetMetadata(ORGANISATION_SCOPE_KEY, options);
