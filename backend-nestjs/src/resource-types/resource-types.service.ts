import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceType } from '../entities/resource-type.entity';
import { Organisation } from '../entities/organisation.entity';
import { CreateResourceTypeDto, UpdateResourceTypeDto } from '../dto/resource-type.dto';

@Injectable()
export class ResourceTypesService {
  constructor(
    @InjectRepository(ResourceType)
    private resourceTypeRepository: Repository<ResourceType>,
    @InjectRepository(Organisation)
    private organisationRepository: Repository<Organisation>,
  ) {}

  async create(createDto: CreateResourceTypeDto): Promise<ResourceType> {
    const organisation = await this.organisationRepository.findOne({
      where: { id: createDto.organisationId },
    });

    if (!organisation) {
      throw new NotFoundException(`Organisation #${createDto.organisationId} not found`);
    }

    const resourceType = this.resourceTypeRepository.create({
      ...createDto,
      organisation,
    });

    return await this.resourceTypeRepository.save(resourceType);
  }

  async findAll(organisationId?: number): Promise<ResourceType[]> {
    if (organisationId) {
      return await this.resourceTypeRepository.find({
        where: { organisation: { id: organisationId } },
        relations: ['organisation', 'resources', 'operatingHours'],
      });
    }
    return await this.resourceTypeRepository.find({
      relations: ['organisation', 'resources', 'operatingHours'],
    });
  }

  async findAllByOrganizations(organizationIds: number[], organisationId?: number): Promise<ResourceType[]> {
    console.log('🔍 ResourceTypesService.findAllByOrganizations called with orgIds:', organizationIds, 'organisationId:', organisationId);

    const queryBuilder = this.resourceTypeRepository
      .createQueryBuilder('resourceType')
      .leftJoinAndSelect('resourceType.organisation', 'organisation')
      .leftJoinAndSelect('resourceType.resources', 'resources')
      .leftJoinAndSelect('resourceType.operatingHours', 'operatingHours')
      .where('resourceType.organisationId IN (:...organizationIds)', { organizationIds });

    if (organisationId) {
      queryBuilder.andWhere('resourceType.organisationId = :organisationId', { organisationId });
    }

    const resourceTypes = await queryBuilder.getMany();
    console.log('📋 Found resource types:', resourceTypes.map(rt => `${rt.id}:${rt.name} (org: ${rt.organisationId})`));

    return resourceTypes;
  }

  async findOne(id: number): Promise<ResourceType> {
    const resourceType = await this.resourceTypeRepository.findOne({
      where: { id },
      relations: ['organisation', 'resources', 'operatingHours'],
    });

    if (!resourceType) {
      throw new NotFoundException(`ResourceType #${id} not found`);
    }

    return resourceType;
  }

  async update(id: number, updateDto: UpdateResourceTypeDto): Promise<ResourceType> {
    const resourceType = await this.findOne(id);
    Object.assign(resourceType, updateDto);
    return await this.resourceTypeRepository.save(resourceType);
  }

  async remove(id: number): Promise<void> {
    const resourceType = await this.findOne(id);
    await this.resourceTypeRepository.remove(resourceType);
  }

  /**
   * Update resource type color
   */
  async updateColor(id: number, color: string): Promise<ResourceType> {
    const resourceType = await this.findOne(id);
    resourceType.color = color;
    return await this.resourceTypeRepository.save(resourceType);
  }
}