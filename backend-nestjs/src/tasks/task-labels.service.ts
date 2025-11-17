import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskLabel } from '../entities/task-label.entity';
import { CreateTaskLabelDto } from './dto/create-task-label.dto';
import { UpdateTaskLabelDto } from './dto/update-task-label.dto';

@Injectable()
export class TaskLabelsService {
  constructor(
    @InjectRepository(TaskLabel)
    private readonly labelsRepository: Repository<TaskLabel>,
  ) {}

  async create(userId: number, dto: CreateTaskLabelDto) {
    const label = this.labelsRepository.create({
      name: dto.name,
      color: dto.color ?? '#3b82f6',
      userId,
    });
    return this.labelsRepository.save(label);
  }

  async findAll(userId: number) {
    return this.labelsRepository.find({
      where: { userId },
      order: { name: 'ASC' },
    });
  }

  async findOne(userId: number, id: number) {
    const label = await this.labelsRepository.findOne({
      where: { id, userId },
      relations: ['tasks'],
    });
    if (!label) {
      throw new NotFoundException('Label not found');
    }
    return label;
  }

  async update(userId: number, id: number, dto: UpdateTaskLabelDto) {
    const label = await this.findOne(userId, id);
    if (dto.name !== undefined) {
      label.name = dto.name;
    }
    if (dto.color !== undefined) {
      label.color = dto.color;
    }
    return this.labelsRepository.save(label);
  }

  async remove(userId: number, id: number) {
    const label = await this.findOne(userId, id);
    await this.labelsRepository.remove(label);
    return { success: true };
  }
}
