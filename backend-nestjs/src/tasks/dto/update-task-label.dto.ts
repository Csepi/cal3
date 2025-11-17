import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskLabelDto } from './create-task-label.dto';

export class UpdateTaskLabelDto extends PartialType(CreateTaskLabelDto) {}
