import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UsagePlan } from '../../entities/user.entity';
import { UpdateProfileDto } from '../../dto/user-profile.dto';
import { OrganisationRoleType } from '../../entities/organisation-user.entity';

export class AdminCreateUserDto {
  @ApiProperty({ example: 'jane.doe', description: 'Unique username' })
  @IsString()
  @MinLength(3)
  username!: string;

  @ApiProperty({
    example: 'jane@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'superSecret123',
    description: 'Initial password (minimum 6 characters)',
  })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ example: 'Jane', description: 'First name' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe', description: 'Last name' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    example: UserRole.USER,
    description: 'Role assigned to the user',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    example: [UsagePlan.STORE],
    isArray: true,
    enum: UsagePlan,
    description: 'Usage plans enabled for the user',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(UsagePlan, { each: true })
  usagePlans?: UsagePlan[];

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the account is active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AdminUpdateUserDto extends UpdateProfileDto {
  @ApiPropertyOptional({
    enum: UserRole,
    example: UserRole.USER,
    description: 'Role assigned to the user',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the account is active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: [UsagePlan.ENTERPRISE],
    isArray: true,
    enum: UsagePlan,
    description: 'Usage plans enabled for the user',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(UsagePlan, { each: true })
  usagePlans?: UsagePlan[];
}

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: UserRole,
    example: UserRole.USER,
    description: 'New role that should be assigned to the user',
  })
  @IsEnum(UserRole)
  role!: UserRole;
}

export class AddUserToOrganisationRoleDto {
  @ApiProperty({ example: 42, description: 'User identifier' })
  @IsNumber()
  userId!: number;

  @ApiProperty({
    enum: OrganisationRoleType,
    example: OrganisationRoleType.USER,
    description: 'Role the user should assume within the organisation',
  })
  @IsEnum(OrganisationRoleType)
  role!: OrganisationRoleType;
}
