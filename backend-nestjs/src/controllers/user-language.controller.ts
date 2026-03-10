import { Body, Controller, Patch, Request, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { RequestWithUser } from '../common/types/request-with-user';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../entities/user.entity';
import { UpdateLanguagePreferenceDto } from '../dto/user-profile.dto';

@Controller('users/me')
@UseGuards(JwtAuthGuard)
export class UserLanguageController {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Patch('language')
  async updateLanguage(
    @Request() req: RequestWithUser,
    @Body() dto: UpdateLanguagePreferenceDto,
  ) {
    const userId = req.user.id;
    const preferredLanguage = dto.preferredLanguage;

    await this.userRepository.update(userId, {
      preferredLanguage,
      language: preferredLanguage,
    });

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'language', 'preferredLanguage'],
    });

    return {
      id: user?.id ?? userId,
      preferredLanguage,
      language: preferredLanguage,
    };
  }
}

