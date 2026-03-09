import { IsOptional, IsString, MaxLength } from 'class-validator';
import { SanitizeText } from '../../common/validation/sanitize.decorator';
import { IsSafeText } from '../../common/validation/security.validators';

export class ListUsersQueryDto {
  @IsOptional()
  @SanitizeText({ trim: true, maxLength: 80 })
  @IsString()
  @MaxLength(80)
  @IsSafeText()
  search?: string;
}

