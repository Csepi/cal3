import { IsNumber, IsEnum, IsOptional } from 'class-validator';
import { OrganisationRoleType } from '../entities/organisation-user.entity';

export class AssignOrganisationUserDto {
  @IsNumber()
  userId!: number;

  @IsEnum(OrganisationRoleType)
  role!: OrganisationRoleType;

  @IsOptional()
  @IsNumber()
  assignedById?: number;
}

export class UpdateOrganisationUserRoleDto {
  @IsEnum(OrganisationRoleType)
  role!: OrganisationRoleType;
}
