import { IsNumber, IsPositive, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO for assigning an organisation admin
 */
export class AssignOrganisationAdminDto {
  @IsNumber({}, { message: 'User ID must be a number' })
  @IsPositive({ message: 'User ID must be a positive number' })
  @Transform(({ value }: { value: any }) => Number.parseInt(String(value), 10))
  userId!: number;
}

/**
 * DTO for adding a user to an organisation
 */
export class AddUserToOrganisationDto {
  @IsNumber({}, { message: 'User ID must be a number' })
  @IsPositive({ message: 'User ID must be a positive number' })
  @Transform(({ value }: { value: any }) => Number.parseInt(String(value), 10))
  userId!: number;
}

/**
 * DTO for creating an organisation
 */
export class CreateOrganisationDto {
  @IsNumber({}, { message: 'Organisation ID must be a number' })
  @IsPositive({ message: 'Organisation ID must be a positive number' })
  @Transform(({ value }: { value: any }) => Number.parseInt(String(value), 10))
  organisationId!: number;

  @IsOptional()
  @IsNumber({}, { message: 'Admin user ID must be a number' })
  @IsPositive({ message: 'Admin user ID must be a positive number' })
  @Transform(({ value }: { value: any }) =>
    value ? Number.parseInt(String(value), 10) : undefined,
  )
  adminUserId?: number;
}
