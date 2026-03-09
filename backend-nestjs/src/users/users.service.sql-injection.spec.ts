import type { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';

describe('UsersService SQL injection safety', () => {
  it('uses parameterized ILIKE search pattern for user search', async () => {
    const qb = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    const repository = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    } as unknown as Repository<User>;

    const service = new UsersService(repository);
    const payload = "' OR 1=1; DROP TABLE users; --_%\\";

    await service.findAll(payload);

    expect(qb.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('ILIKE :pattern'),
      expect.objectContaining({
        pattern: expect.any(String),
      }),
    );

    const [, params] = qb.andWhere.mock.calls[0] as [string, { pattern: string }];
    expect(params.pattern).toContain('\\%');
    expect(params.pattern).toContain('\\_');
    expect(params.pattern).toContain('\\\\');
  });
});
