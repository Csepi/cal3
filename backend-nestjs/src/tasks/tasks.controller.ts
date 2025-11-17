import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { UpdateTaskLabelsDto } from './dto/update-task-labels.dto';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(req.user.id, dto);
  }

  @Get()
  findAll(@Req() req: any, @Query() query: QueryTasksDto) {
    return this.tasksService.findAll(req.user.id, query);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.tasksService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.tasksService.remove(req.user.id, id);
  }

  @Post(':id/labels')
  addLabels(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskLabelsDto,
  ) {
    return this.tasksService.addLabels(req.user.id, id, dto);
  }

  @Delete(':id/labels/:labelId')
  removeLabel(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Param('labelId', ParseIntPipe) labelId: number,
  ) {
    return this.tasksService.removeLabel(req.user.id, id, labelId);
  }
}
