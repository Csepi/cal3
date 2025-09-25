import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resource } from '../entities/resource.entity';
import { ResourceType } from '../entities/resource-type.entity';
import { CreateResourceDto, UpdateResourceDto } from '../dto/resource.dto';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resource)
    private resourceRepository: Repository<Resource>,
    @InjectRepository(ResourceType)
    private resourceTypeRepository: Repository<ResourceType>,
  ) {}

  async create(createDto: CreateResourceDto): Promise<Resource> {
    const resourceType = await this.resourceTypeRepository.findOne({
      where: { id: createDto.resourceTypeId },
    });

    if (!resourceType) {
      throw new NotFoundException(`ResourceType #${createDto.resourceTypeId} not found`);
    }

    const resource = this.resourceRepository.create({
      ...createDto,
      resourceType,
    });

    return await this.resourceRepository.save(resource);
  }

  async findAll(resourceTypeId?: number): Promise<Resource[]> {
    if (resourceTypeId) {
      return await this.resourceRepository.find({
        where: { resourceType: { id: resourceTypeId } },
        relations: ['resourceType', 'managedBy'],
      });
    }
    return await this.resourceRepository.find({
      relations: ['resourceType', 'managedBy'],
    });
  }

  async findOne(id: number): Promise<Resource> {
    const resource = await this.resourceRepository.findOne({
      where: { id },
      relations: ['resourceType', 'managedBy'],
    });

    if (!resource) {
      throw new NotFoundException(`Resource #${id} not found`);
    }

    return resource;
  }

  async update(id: number, updateDto: UpdateResourceDto): Promise<Resource> {
    const resource = await this.findOne(id);

    // Handle managedBy relationship if provided
    if (updateDto.managedById !== undefined) {
      if (updateDto.managedById) {
        // In a real implementation, you'd validate the user exists
        resource.managedBy = { id: updateDto.managedById } as any;
      } else {
        resource.managedBy = null as any;
      }
      delete updateDto.managedById;
    }

    // Update other fields
    Object.assign(resource, updateDto);
    return await this.resourceRepository.save(resource);
  }

  async remove(id: number): Promise<void> {
    const resource = await this.resourceRepository.findOne({
      where: { id },
      relations: ['reservations'],
    });

    if (!resource) {
      throw new NotFoundException(`Resource #${id} not found`);
    }

    // Check if there are any reservations for this resource
    if (resource.reservations && resource.reservations.length > 0) {
      const activeReservations = resource.reservations.filter(
        r => r.status !== 'cancelled' && r.status !== 'completed'
      );

      if (activeReservations.length > 0) {
        throw new BadRequestException(`Cannot delete resource with active reservations. Cancel or complete ${activeReservations.length} reservation(s) first.`);
      }
    }

    await this.resourceRepository.remove(resource);
  }
}