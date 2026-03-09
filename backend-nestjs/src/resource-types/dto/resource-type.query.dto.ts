import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class ResourceTypeListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  organisationId?: number;
}

