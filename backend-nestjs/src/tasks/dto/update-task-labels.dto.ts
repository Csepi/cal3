import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTaskLabelDto } from './create-task-label.dto';

export class UpdateTaskLabelsDto {
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(20)
  @IsInt({ each: true })
  @Type(() => Number)
  labelIds?: number[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskLabelDto)
  inlineLabels?: CreateTaskLabelDto[];
}
