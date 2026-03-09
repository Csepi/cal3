import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { toContainsLikePattern } from '../common/database/query-safety';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(search?: string): Promise<Partial<User>[]> {
    const baseQuery = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.username',
        'user.email',
        'user.firstName',
        'user.lastName',
      ])
      .where('user.isActive = :isActive', { isActive: true });

    if (search) {
      const pattern = toContainsLikePattern(search);
      baseQuery.andWhere(
        `(
          user.username ILIKE :pattern ESCAPE '\\'
          OR user.email ILIKE :pattern ESCAPE '\\'
          OR user.firstName ILIKE :pattern ESCAPE '\\'
          OR user.lastName ILIKE :pattern ESCAPE '\\'
        )`,
        { pattern },
      );
      baseQuery.take(20);
    } else {
      baseQuery.orderBy('user.username', 'ASC').take(50);
    }

    return baseQuery.getMany();
  }

  async findOne(id: number): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { id, isActive: true },
      select: [
        'id',
        'username',
        'email',
        'firstName',
        'lastName',
        'createdAt',
        'updatedAt',
      ],
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
