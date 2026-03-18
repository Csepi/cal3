import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  Request,
  ConflictException,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import type { RequestWithUser } from '../common/types/request-with-user';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import * as bcrypt from 'bcryptjs';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AllowIncompleteOnboarding } from '../auth/decorators/allow-incomplete-onboarding.decorator';
import { User } from '../entities/user.entity';
import {
  Calendar,
  CalendarShare,
  SharePermission,
} from '../entities/calendar.entity';
import {
  UpdateProfileDto,
  UpdateThemeDto,
  ChangePasswordDto,
} from '../dto/user-profile.dto';
import { Task } from '../entities/task.entity';
import { TaskCalendarBridgeService } from '../tasks/task-calendar-bridge.service';
import { I18nService } from 'nestjs-i18n';
import { ConfigurationService } from '../configuration/configuration.service';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

interface UploadedImageFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const ALLOWED_PROFILE_PICTURE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

@ApiTags('User Profile')
@Controller('user')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserProfileController {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Calendar)
    private calendarRepository: Repository<Calendar>,
    @InjectRepository(CalendarShare)
    private readonly calendarShareRepository: Repository<CalendarShare>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly taskCalendarBridgeService: TaskCalendarBridgeService,
    private readonly i18nService: I18nService,
    private readonly configurationService: ConfigurationService,
  ) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req: RequestWithUser) {
    const user = await this.userRepository.findOne({
      where: { id: req.user.id },
      select: [
        'id',
        'username',
        'email',
        'firstName',
        'lastName',
        'profilePictureUrl',
        'role',
        'themeColor',
        'weekStartDay',
        'defaultCalendarView',
        'timezone',
        'timeFormat',
        'language',
        'preferredLanguage',
        'usagePlans',
        'hideReservationsTab',
        'hiddenResourceIds',
        'visibleCalendarIds',
        'visibleResourceTypeIds',
        'hiddenFromLiveFocusTags',
        'defaultTasksCalendarId',
        'onboardingCompleted',
        'onboardingCompletedAt',
        'onboardingUseCase',
        'onboardingGoogleCalendarSyncRequested',
        'onboardingMicrosoftCalendarSyncRequested',
        'privacyPolicyAcceptedAt',
        'privacyPolicyVersion',
        'createdAt',
        'updatedAt',
      ],
    });

    return user;
  }

  @Post('profile-picture')
  @AllowIncompleteOnboarding()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: 'Upload and set user profile picture' })
  async uploadProfilePicture(
    @Request() req: RequestWithUser,
    @UploadedFile() file?: UploadedImageFile,
  ) {
    if (!file) {
      throw new BadRequestException('Profile picture file is required.');
    }
    if (!file.mimetype || !ALLOWED_PROFILE_PICTURE_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        'Only JPG, PNG, GIF, and WEBP images are allowed.',
      );
    }
    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException('Profile picture must be 2MB or smaller.');
    }

    const extension = this.resolveExtension(file.originalname, file.mimetype);
    const filename = `${req.user.id}-${randomUUID()}${extension}`;
    const relativePath = `profile-pictures/${filename}`;
    const absolutePath = join(this.getUploadsRootDir(), relativePath);

    await fs.mkdir(join(this.getUploadsRootDir(), 'profile-pictures'), {
      recursive: true,
    });
    await fs.writeFile(absolutePath, file.buffer);

    const profilePictureUrl = `${this.configurationService.getBackendBaseUrl()}/uploads/${relativePath}`.replace(
      /\\/g,
      '/',
    );

    await this.userRepository.update(req.user.id, {
      profilePictureUrl,
    });

    return {
      profilePictureUrl,
    };
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Username or email already exists' })
  async updateProfile(
    @Request() req: RequestWithUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const userId = req.user.id;

    const currentUser = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'username', 'email', 'defaultTasksCalendarId'],
    });

    if (!currentUser) {
      throw new ConflictException(
        this.i18nService.t('errors.notFound', {
          lang: this.resolveLanguage(req),
          defaultValue: 'User not found',
        }),
      );
    }

    // Only run uniqueness checks for fields that actually changed.
    const usernameChanged =
      typeof updateProfileDto.username === 'string' &&
      updateProfileDto.username.trim().length > 0 &&
      updateProfileDto.username.trim() !== (currentUser.username ?? '').trim();
    const emailChanged =
      typeof updateProfileDto.email === 'string' &&
      updateProfileDto.email.trim().length > 0 &&
      updateProfileDto.email.trim().toLowerCase() !==
        (currentUser.email ?? '').trim().toLowerCase();

    if (usernameChanged || emailChanged) {
      const conflicts = await this.userRepository.findOne({
        where: [
          ...(usernameChanged
            ? [{ username: updateProfileDto.username!.trim(), id: Not(userId) }]
            : []),
          ...(emailChanged
            ? [{ email: updateProfileDto.email!.trim(), id: Not(userId) }]
            : []),
        ],
      });

      if (conflicts) {
        throw new ConflictException(
          this.i18nService.t('auth.usernameAlreadyExists', {
            lang: this.resolveLanguage(req),
            defaultValue: 'Username or email already exists',
          }),
        );
      }
    }

    const {
      defaultTasksCalendarId,
      language,
      preferredLanguage,
      hiddenFromLiveFocusTags,
      ...rest
    } = updateProfileDto;
    const updatePayload: QueryDeepPartialEntity<User> = { ...rest };
    const resolvedLanguage = preferredLanguage ?? language;
    if (resolvedLanguage) {
      updatePayload.language = resolvedLanguage;
      updatePayload.preferredLanguage = resolvedLanguage;
    }
    if (hiddenFromLiveFocusTags !== undefined) {
      updatePayload.hiddenFromLiveFocusTags =
        this.normalizeHiddenFromLiveFocusTags(hiddenFromLiveFocusTags);
    }

    const defaultCalendarProvided = defaultTasksCalendarId !== undefined;
    const currentDefaultCalendarId = currentUser.defaultTasksCalendarId ?? null;
    const requestedDefaultCalendarId = defaultTasksCalendarId ?? null;
    const defaultCalendarChanged =
      defaultCalendarProvided &&
      requestedDefaultCalendarId !== currentDefaultCalendarId;

    if (defaultCalendarChanged) {
      const calendarId = requestedDefaultCalendarId;

      if (calendarId === null) {
        updatePayload.defaultTasksCalendarId = () => 'NULL';
        await this.calendarRepository
          .createQueryBuilder()
          .update(Calendar)
          .set({ isTasksCalendar: false })
          .where('ownerId = :userId', { userId })
          .execute();
      } else {
        const calendar = await this.calendarRepository.findOne({
          where: {
            id: calendarId,
            isActive: true,
          },
          select: ['id', 'ownerId', 'isTasksCalendar'],
        });

        if (!calendar) {
          throw new ConflictException(
            this.i18nService.t('validation.invalidCalendar', {
              lang: this.resolveLanguage(req),
              defaultValue:
                'Invalid Tasks calendar. Select one you own or can edit.',
            }),
          );
        }

        const ownsCalendar = calendar.ownerId === userId;
        let hasWriteAccess = ownsCalendar;

        if (!hasWriteAccess) {
          const share = await this.calendarShareRepository.findOne({
            where: { calendarId, userId },
            select: ['permission'],
          });
          if (
            share &&
            (share.permission === SharePermission.WRITE ||
              share.permission === SharePermission.ADMIN)
          ) {
            hasWriteAccess = true;
          }
        }

        if (!hasWriteAccess) {
          throw new ConflictException(
            this.i18nService.t('validation.invalidCalendar', {
              lang: this.resolveLanguage(req),
              defaultValue:
                'Invalid Tasks calendar. Select one you own or can edit.',
            }),
          );
        }

        if (ownsCalendar) {
          await this.calendarRepository
            .createQueryBuilder()
            .update(Calendar)
            .set({ isTasksCalendar: false })
            .where('ownerId = :userId', { userId })
            .execute();

          await this.calendarRepository.update(calendarId, {
            isTasksCalendar: true,
          });
        }

        updatePayload.defaultTasksCalendarId = calendar.id;
      }
    }

    await this.userRepository.update(userId, updatePayload);

    if (defaultCalendarChanged && requestedDefaultCalendarId !== null) {
      const tasksNeedingSync = await this.taskRepository.find({
        where: { ownerId: userId, dueDate: Not(IsNull()) },
        select: ['id'],
      });

      for (const task of tasksNeedingSync) {
        await this.taskCalendarBridgeService.syncTask(task.id);
      }
    }

    const updatedUser = await this.userRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'username',
        'email',
        'firstName',
        'lastName',
        'profilePictureUrl',
        'role',
        'themeColor',
        'weekStartDay',
        'defaultCalendarView',
        'timezone',
        'timeFormat',
        'language',
        'preferredLanguage',
        'usagePlans',
        'hideReservationsTab',
        'hiddenResourceIds',
        'visibleCalendarIds',
        'visibleResourceTypeIds',
        'hiddenFromLiveFocusTags',
        'defaultTasksCalendarId',
        'onboardingCompleted',
        'onboardingCompletedAt',
        'onboardingUseCase',
        'onboardingGoogleCalendarSyncRequested',
        'onboardingMicrosoftCalendarSyncRequested',
        'privacyPolicyAcceptedAt',
        'privacyPolicyVersion',
        'createdAt',
        'updatedAt',
      ],
    });

    return updatedUser;
  }

  @Patch('theme')
  @ApiOperation({ summary: 'Update user theme color' })
  @ApiResponse({ status: 200, description: 'Theme updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateTheme(
    @Request() req: RequestWithUser,
    @Body() updateThemeDto: UpdateThemeDto,
  ) {
    const userId = req.user.id;

    await this.userRepository.update(userId, {
      themeColor: updateThemeDto.themeColor,
    });

    const updatedUser = await this.userRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'username',
        'email',
        'firstName',
        'lastName',
        'profilePictureUrl',
        'role',
        'themeColor',
        'weekStartDay',
        'defaultCalendarView',
        'timezone',
        'timeFormat',
        'language',
        'preferredLanguage',
        'usagePlans',
        'hideReservationsTab',
        'hiddenResourceIds',
        'visibleCalendarIds',
        'visibleResourceTypeIds',
        'hiddenFromLiveFocusTags',
        'defaultTasksCalendarId',
        'onboardingCompleted',
        'onboardingCompletedAt',
        'onboardingUseCase',
        'onboardingGoogleCalendarSyncRequested',
        'onboardingMicrosoftCalendarSyncRequested',
        'privacyPolicyAcceptedAt',
        'privacyPolicyVersion',
        'createdAt',
        'updatedAt',
      ],
    });

    return updatedUser;
  }

  @Patch('password')
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or invalid current password',
  })
  async changePassword(
    @Request() req: RequestWithUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const userId = req.user.id;

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new ConflictException(
        this.i18nService.t('errors.notFound', {
          lang: this.resolveLanguage(req),
          defaultValue: 'User not found',
        }),
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new ConflictException(
        this.i18nService.t('auth.invalidCredentials', {
          lang: this.resolveLanguage(req),
          defaultValue: 'Current password is incorrect',
        }),
      );
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      saltRounds,
    );

    await this.userRepository.update(userId, { password: hashedNewPassword });

    return {
      message: this.i18nService.t('success.saved', {
        lang: this.resolveLanguage(req),
        defaultValue: 'Password changed successfully',
      }),
    };
  }

  private resolveLanguage(req: RequestWithUser): string {
    const value = req.headers['x-user-language'];
    return typeof value === 'string' ? value : 'en';
  }

  private normalizeHiddenFromLiveFocusTags(
    tags: string[] | null,
  ): string[] | null {
    if (!Array.isArray(tags)) {
      return null;
    }

    const normalized: string[] = [];
    const seen = new Set<string>();
    for (const rawTag of tags) {
      const tag = typeof rawTag === 'string' ? rawTag.trim() : '';
      if (!tag) {
        continue;
      }
      const normalizedKey = tag.toLowerCase();
      if (seen.has(normalizedKey)) {
        continue;
      }
      seen.add(normalizedKey);
      normalized.push(tag);
      if (normalized.length >= 100) {
        break;
      }
    }

    return normalized.length > 0 ? normalized : null;
  }

  private getUploadsRootDir(): string {
    return join(process.cwd(), 'uploads');
  }

  private resolveExtension(originalname: string, mimeType: string): string {
    const extensionByMime: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
    };
    const fromMime = extensionByMime[mimeType];
    if (fromMime) {
      return fromMime;
    }

    const lastDot = originalname.lastIndexOf('.');
    if (lastDot < 0) {
      return '.img';
    }
    const extension = originalname.slice(lastDot).toLowerCase();
    return extension.length <= 8 ? extension : '.img';
  }
}
