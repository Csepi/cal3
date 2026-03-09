import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  MaxLength,
  Min,
} from 'class-validator';
import { SanitizeText } from '../../common/validation/sanitize.decorator';
import {
  IsSafeText,
  IsStrongPassword,
} from '../../common/validation/security.validators';

export class UpdateUserPasswordDto {
  @SanitizeText({ maxLength: 128 })
  @IsStrongPassword()
  password!: string;
}

export class AddUserToOrganizationDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  organizationId!: number;
}

export class ClearLogsQueryDto {
  @IsOptional()
  @IsDateString()
  before?: string;
}

export class UnshareUsersDto {
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  userIds!: number[];
}

export class SimpleColorUpdateDto {
  @SanitizeText({ trim: true, maxLength: 16, toLowerCase: true })
  @MaxLength(16)
  @IsSafeText()
  color!: string;
}

