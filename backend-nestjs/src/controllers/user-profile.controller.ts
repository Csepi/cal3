import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  ConflictException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import * as bcrypt from 'bcryptjs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
  ) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req) {
    const user = await this.userRepository.findOne({
      where: { id: req.user.id },
      select: [
        'id',
        'username',
        'email',
        'firstName',
        'lastName',
        'role',
        'themeColor',
        'weekStartDay',
        'defaultCalendarView',
        'timezone',
        'timeFormat',
        'language',
        'usagePlans',
        'hideReservationsTab',
        'hiddenResourceIds',
        'visibleCalendarIds',
        'visibleResourceTypeIds',
        'defaultTasksCalendarId',
        'createdAt',
        'updatedAt',
      ],
    });

    return user;
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Username or email already exists' })
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const userId = req.user.id;

    // Check for existing username/email conflicts
    if (updateProfileDto.username || updateProfileDto.email) {
      const conflicts = await this.userRepository.findOne({
        where: [
          ...(updateProfileDto.username
            ? [{ username: updateProfileDto.username }]
            : []),
          ...(updateProfileDto.email
            ? [{ email: updateProfileDto.email }]
            : []),
        ],
      });

      if (conflicts && conflicts.id !== userId) {
        throw new ConflictException('Username or email already exists');
      }
    }

    const { defaultTasksCalendarId, ...rest } = updateProfileDto;
    const updatePayload: QueryDeepPartialEntity<User> = { ...rest };

    if (defaultTasksCalendarId !== undefined) {
      const calendarId = defaultTasksCalendarId;

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
            'Invalid Tasks calendar. Select one you own or can edit.',
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
            'Invalid Tasks calendar. Select one you own or can edit.',
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

    const defaultCalendarChanged =
      defaultTasksCalendarId !== undefined &&
      defaultTasksCalendarId !== null;

    await this.userRepository.update(userId, updatePayload);

    if (defaultCalendarChanged) {
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
        'role',
        'themeColor',
        'weekStartDay',
        'defaultCalendarView',
        'timezone',
        'timeFormat',
        'language',
        'usagePlans',
        'hideReservationsTab',
        'hiddenResourceIds',
        'visibleCalendarIds',
        'visibleResourceTypeIds',
        'defaultTasksCalendarId',
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
  async updateTheme(@Request() req, @Body() updateThemeDto: UpdateThemeDto) {
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
        'role',
        'themeColor',
        'weekStartDay',
        'defaultCalendarView',
        'timezone',
        'timeFormat',
        'language',
        'usagePlans',
        'hideReservationsTab',
        'hiddenResourceIds',
        'visibleCalendarIds',
        'visibleResourceTypeIds',
        'defaultTasksCalendarId',
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
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const userId = req.user.id;

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new ConflictException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new ConflictException('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      saltRounds,
    );

    await this.userRepository.update(userId, { password: hashedNewPassword });

    return { message: 'Password changed successfully' };
  }
}
