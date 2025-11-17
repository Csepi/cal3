import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TaskLabelsService } from './task-labels.service';
import { CreateTaskLabelDto } from './dto/create-task-label.dto';
import { UpdateTaskLabelDto } from './dto/update-task-label.dto';

@Controller(['tasks/labels', 'task-labels'])
@UseGuards(JwtAuthGuard)
export class TaskLabelsController {
  constructor(private readonly taskLabelsService: TaskLabelsService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.taskLabelsService.findAll(req.user.id);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateTaskLabelDto) {
    return this.taskLabelsService.create(req.user.id, dto);
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskLabelDto,
  ) {
    return this.taskLabelsService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.taskLabelsService.remove(req.user.id, id);
  }
}
