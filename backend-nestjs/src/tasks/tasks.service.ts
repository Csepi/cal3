import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { Task, TaskPriority, TaskStatus } from '../entities/task.entity';
import { TaskLabel } from '../entities/task-label.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { UpdateTaskLabelsDto } from './dto/update-task-labels.dto';
import { CreateTaskLabelDto } from './dto/create-task-label.dto';
import { TaskCalendarBridgeService } from './task-calendar-bridge.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    @InjectRepository(TaskLabel)
    private readonly labelsRepository: Repository<TaskLabel>,
    private readonly taskCalendarBridgeService: TaskCalendarBridgeService,
  ) {}

  async create(ownerId: number, dto: CreateTaskDto) {
    const labels = await this.resolveLabels(ownerId, dto.labelIds);

    const task = this.tasksRepository.create({
      title: dto.title,
      body: dto.body ?? null,
      bodyFormat: dto.bodyFormat ?? 'markdown',
      color: dto.color ?? '#eab308',
      priority: dto.priority ?? TaskPriority.MEDIUM,
      status: dto.status ?? TaskStatus.TODO,
      place: dto.place ?? null,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      dueEnd: dto.dueEnd ? new Date(dto.dueEnd) : null,
      dueTimezone: dto.dueTimezone ?? null,
      ownerId,
      assigneeId: dto.assigneeId ?? null,
      labels,
    });

    const savedTask = await this.tasksRepository.save(task);
    await this.taskCalendarBridgeService.syncTask(savedTask);
    return this.findOne(ownerId, savedTask.id);
  }

  async findAll(ownerId: number, query: QueryTasksDto) {
    const qb = this.baseQuery(ownerId);

    if (query.status) {
      qb.andWhere('task.status = :status', { status: query.status });
    }

    if (query.priority) {
      qb.andWhere('task.priority = :priority', { priority: query.priority });
    }

    if (query.search) {
      qb.andWhere(
        '(task.title ILIKE :search OR task.body ILIKE :search OR task.place ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.dueFrom) {
      qb.andWhere('task.dueDate >= :dueFrom', { dueFrom: query.dueFrom });
    }

    if (query.dueTo) {
      qb.andWhere('task.dueDate <= :dueTo', { dueTo: query.dueTo });
    }

    if (query.labelIds?.length) {
      qb.andWhere('label.id IN (:...labelIds)', {
        labelIds: query.labelIds,
      });
    }

    const limit = query.limit ?? 25;
    const page = query.page ?? 1;

    if (query.sortBy) {
      const sortDirection = query.sortDirection ?? 'desc';
      qb.orderBy(
        `task.${query.sortBy}`,
        sortDirection.toUpperCase() as 'ASC' | 'DESC',
      );
    } else {
      const priorityRankAlias = 'task_priority_rank';
      const dueDateNullAlias = 'task_due_date_null';

      qb.addSelect(
        `
        CASE
          WHEN task.priority = :priorityHigh THEN 0
          WHEN task.priority = :priorityMedium THEN 1
          ELSE 2
        END
      `,
        priorityRankAlias,
      );

      qb.addSelect(
        'CASE WHEN task.dueDate IS NULL THEN 1 ELSE 0 END',
        dueDateNullAlias,
      );

      qb.setParameter('priorityHigh', TaskPriority.HIGH);
      qb.setParameter('priorityMedium', TaskPriority.MEDIUM);

      qb.orderBy(priorityRankAlias, 'ASC')
        .addOrderBy(dueDateNullAlias, 'ASC')
        .addOrderBy('task.dueDate', 'ASC')
        .addOrderBy('task.createdAt', 'DESC');
    }

    qb.take(limit).skip((page - 1) * limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(ownerId: number, id: number) {
    const task = await this.tasksRepository.findOne({
      where: { id, ownerId },
      relations: ['labels'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(ownerId: number, id: number, dto: UpdateTaskDto) {
    const task = await this.findOne(ownerId, id);

    if (dto.title !== undefined) {
      task.title = dto.title;
    }
    if (dto.body !== undefined) {
      task.body = dto.body ?? null;
    }
    if (dto.bodyFormat !== undefined) {
      task.bodyFormat = dto.bodyFormat;
    }
    if (dto.color !== undefined) {
      task.color = dto.color;
    }
    if (dto.priority !== undefined) {
      task.priority = dto.priority;
    }
    if (dto.status !== undefined) {
      task.status = dto.status;
    }
    if (dto.place !== undefined) {
      task.place = dto.place ?? null;
    }
    if (dto.dueDate !== undefined) {
      task.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }
    if (dto.dueEnd !== undefined) {
      task.dueEnd = dto.dueEnd ? new Date(dto.dueEnd) : null;
    }
    if (dto.dueTimezone !== undefined) {
      task.dueTimezone = dto.dueTimezone ?? null;
    }
    if (dto.assigneeId !== undefined) {
      task.assigneeId = dto.assigneeId ?? null;
    }

    if (dto.labelIds !== undefined) {
      task.labels = await this.resolveLabels(ownerId, dto.labelIds);
    }

    const updatedTask = await this.tasksRepository.save(task);
    await this.taskCalendarBridgeService.syncTask(updatedTask);
    return this.findOne(ownerId, task.id);
  }

  async remove(ownerId: number, id: number) {
    const task = await this.findOne(ownerId, id);
    await this.taskCalendarBridgeService.removeMirroredEvent(task);
    await this.tasksRepository.remove(task);
    return { success: true };
  }

  async addLabels(ownerId: number, taskId: number, dto: UpdateTaskLabelsDto) {
    const task = await this.tasksRepository.findOne({
      where: { id: taskId, ownerId },
      relations: ['labels'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const labelsToAttach: TaskLabel[] = [];

    if (dto.labelIds?.length) {
      labelsToAttach.push(...(await this.resolveLabels(ownerId, dto.labelIds)));
    }

    if (dto.inlineLabels?.length) {
      const createdInline = await this.createInlineLabels(
        ownerId,
        dto.inlineLabels,
      );
      labelsToAttach.push(...createdInline);
    }

    const existing = new Map<number, TaskLabel>();
    (task.labels ?? []).forEach((label) => existing.set(label.id, label));
    labelsToAttach.forEach((label) => existing.set(label.id, label));

    task.labels = Array.from(existing.values());
    await this.tasksRepository.save(task);

    return this.findOne(ownerId, taskId);
  }

  async removeLabel(ownerId: number, taskId: number, labelId: number) {
    const task = await this.tasksRepository.findOne({
      where: { id: taskId, ownerId },
      relations: ['labels'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    task.labels = (task.labels ?? []).filter((label) => label.id !== labelId);
    await this.tasksRepository.save(task);
    return this.findOne(ownerId, taskId);
  }

  private baseQuery(ownerId: number): SelectQueryBuilder<Task> {
    return this.tasksRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.labels', 'label')
      .where('task.ownerId = :ownerId', { ownerId })
      .distinct(true);
  }

  private async resolveLabels(ownerId: number, ids?: number[]) {
    if (!ids || ids.length === 0) {
      return [];
    }

    const labels = await this.labelsRepository.find({
      where: { id: In(ids), userId: ownerId },
    });

    if (labels.length !== ids.length) {
      throw new ForbiddenException('One or more labels are invalid.');
    }

    return labels;
  }

  private async createInlineLabels(
    ownerId: number,
    inlineLabels: CreateTaskLabelDto[],
  ): Promise<TaskLabel[]> {
    if (!inlineLabels.length) {
      return [];
    }

    const entities = inlineLabels.map((input) =>
      this.labelsRepository.create({
        name: input.name,
        color: input.color ?? '#3b82f6',
        userId: ownerId,
      }),
    );

    return this.labelsRepository.save(entities);
  }
}
