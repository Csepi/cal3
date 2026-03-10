import { IsNumber, IsPositive, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

import { bStatic } from '../../i18n/runtime';

/**
 * DTO for assigning an organisation admin
 */
export class AssignOrganisationAdminDto {
  @IsNumber({}, { message: bStatic('errors.auto.backend.kba7f58f064f8') })
  @IsPositive({ message: bStatic('errors.auto.backend.k95c43921a00b') })
  @Transform(({ value }: { value: unknown }) =>
    Number.parseInt(String(value), 10),
  )
  userId!: number;
}

/**
 * DTO for adding a user to an organisation
 */
export class AddUserToOrganisationDto {
  @IsNumber({}, { message: bStatic('errors.auto.backend.kba7f58f064f8') })
  @IsPositive({ message: bStatic('errors.auto.backend.k95c43921a00b') })
  @Transform(({ value }: { value: unknown }) =>
    Number.parseInt(String(value), 10),
  )
  userId!: number;
}

/**
 * DTO for creating an organisation
 */
export class CreateOrganisationDto {
  @IsNumber({}, { message: bStatic('errors.auto.backend.k23ddd162086f') })
  @IsPositive({ message: bStatic('errors.auto.backend.k6522dbb45e16') })
  @Transform(({ value }: { value: unknown }) =>
    Number.parseInt(String(value), 10),
  )
  organisationId!: number;

  @IsOptional()
  @IsNumber({}, { message: bStatic('errors.auto.backend.k6000922e1653') })
  @IsPositive({ message: bStatic('errors.auto.backend.ka20e95ea0330') })
  @Transform(({ value }: { value: unknown }) =>
    value ? Number.parseInt(String(value), 10) : undefined,
  )
  adminUserId?: number;
}
