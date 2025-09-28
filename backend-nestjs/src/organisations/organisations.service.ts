import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organisation } from '../entities/organisation.entity';
import { User } from '../entities/user.entity';
import { OrganisationUser, OrganisationRoleType } from '../entities/organisation-user.entity';
import { CreateOrganisationDto, UpdateOrganisationDto } from '../dto/organisation.dto';

@Injectable()
export class OrganisationsService {
  constructor(
    @InjectRepository(Organisation)
    private organisationRepository: Repository<Organisation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(OrganisationUser)
    private organisationUserRepository: Repository<OrganisationUser>,
  ) {}

  async create(createDto: CreateOrganisationDto): Promise<Organisation> {
    const organisation = this.organisationRepository.create(createDto);
    return await this.organisationRepository.save(organisation);
  }

  async findAll(): Promise<Organisation[]> {
    return await this.organisationRepository.find({
      relations: ['users', 'resourceTypes'],
    });
  }

  async findOne(id: number): Promise<Organisation> {
    const organisation = await this.organisationRepository.findOne({
      where: { id },
      relations: ['users', 'resourceTypes'],
    });
    if (!organisation) {
      throw new NotFoundException(`Organisation #${id} not found`);
    }
    return organisation;
  }

  async update(id: number, updateDto: UpdateOrganisationDto): Promise<Organisation> {
    const organisation = await this.findOne(id);
    Object.assign(organisation, updateDto);
    return await this.organisationRepository.save(organisation);
  }

  async remove(id: number): Promise<void> {
    const organisation = await this.findOne(id);
    await this.organisationRepository.remove(organisation);
  }

  async assignUser(organisationId: number, userId: number): Promise<Organisation> {
    const organisation = await this.findOne(organisationId);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User #${userId} not found`);
    }

    if (!organisation.users) {
      organisation.users = [];
    }

    if (!organisation.users.find(u => u.id === userId)) {
      organisation.users.push(user);
      await this.organisationRepository.save(organisation);
    }

    return organisation;
  }

  async removeUser(organisationId: number, userId: number): Promise<Organisation> {
    const organisation = await this.findOne(organisationId);

    if (organisation.users) {
      organisation.users = organisation.users.filter(u => u.id !== userId);
      await this.organisationRepository.save(organisation);
    }

    return organisation;
  }

  async findByUser(userId: number): Promise<Organisation[]> {
    return await this.organisationRepository
      .createQueryBuilder('organisation')
      .leftJoin('organisation.users', 'user')
      .where('user.id = :userId', { userId })
      .getMany();
  }
}