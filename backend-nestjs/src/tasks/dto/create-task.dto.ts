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
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TaskPriority, TaskStatus } from '../../entities/task.entity';

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{6})$/;

const SUPPORTED_BODY_FORMATS = ['markdown'] as const;

export class CreateTaskDto {
  @IsString()
  @MaxLength(240)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000, {
    message: 'Markdown body is limited to 8k characters to keep sync payloads small.',
  })
  body?: string | null;

  @IsOptional()
  @IsIn(SUPPORTED_BODY_FORMATS)
  bodyFormat?: (typeof SUPPORTED_BODY_FORMATS)[number];

  @IsOptional()
  @Matches(HEX_COLOR_REGEX, { message: 'Color must be a valid 6-digit hex value.' })
  color?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  place?: string | null;

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @IsOptional()
  @IsDateString()
  dueEnd?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  dueTimezone?: string | null;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  assigneeId?: number | null;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(12)
  @IsInt({ each: true })
  @Type(() => Number)
  labelIds?: number[];
}
