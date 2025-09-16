import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(search?: string): Promise<Partial<User>[]> {
    let users: User[];

    if (search) {
      users = await this.userRepository.find({
        where: [
          { username: Like(`%${search}%`), isActive: true },
          { email: Like(`%${search}%`), isActive: true },
          { firstName: Like(`%${search}%`), isActive: true },
          { lastName: Like(`%${search}%`), isActive: true },
        ],
        select: ['id', 'username', 'email', 'firstName', 'lastName'],
        take: 20, // Limit results for performance
      });
    } else {
      users = await this.userRepository.find({
        where: { isActive: true },
        select: ['id', 'username', 'email', 'firstName', 'lastName'],
        take: 50,
        order: { username: 'ASC' },
      });
    }

    return users;
  }

  async findOne(id: number): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { id, isActive: true },
      select: ['id', 'username', 'email', 'firstName', 'lastName', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username, isActive: true },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email, isActive: true },
    });
  }
}