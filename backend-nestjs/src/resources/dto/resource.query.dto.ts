import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class ResourceListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  resourceTypeId?: number;
}

