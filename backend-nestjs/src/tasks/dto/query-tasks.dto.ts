import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TaskPriority, TaskStatus } from '../../entities/task.entity';

const SORTABLE_COLUMNS = ['updatedAt', 'createdAt', 'dueDate'] as const;
const SORT_DIRECTIONS = ['asc', 'desc'] as const;

export class QueryTasksDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsDateString()
  dueFrom?: string;

  @IsOptional()
  @IsDateString()
  dueTo?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(10)
  @IsInt({ each: true })
  @Type(() => Number)
  labelIds?: number[];

  @IsOptional()
  @IsIn(SORTABLE_COLUMNS)
  sortBy?: (typeof SORTABLE_COLUMNS)[number];

  @IsOptional()
  @IsIn(SORT_DIRECTIONS)
  sortDirection?: (typeof SORT_DIRECTIONS)[number];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 25;
}
