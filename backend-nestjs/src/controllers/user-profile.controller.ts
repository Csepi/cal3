import { Controller, Get, Patch, Body, UseGuards, Request, ConflictException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../entities/user.entity';
import { UpdateProfileDto, UpdateThemeDto, ChangePasswordDto } from '../dto/user-profile.dto';

@ApiTags('User Profile')
@Controller('user')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserProfileController {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req) {
    const user = await this.userRepository.findOne({
      where: { id: req.user.id },
      select: ['id', 'username', 'email', 'firstName', 'lastName', 'role', 'themeColor', 'weekStartDay', 'defaultCalendarView', 'timezone', 'timeFormat', 'usagePlans', 'createdAt', 'updatedAt'],
    });

    return user;
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Username or email already exists' })
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    const userId = req.user.id;

    // Check for existing username/email conflicts
    if (updateProfileDto.username || updateProfileDto.email) {
      const conflicts = await this.userRepository.findOne({
        where: [
          ...(updateProfileDto.username ? [{ username: updateProfileDto.username }] : []),
          ...(updateProfileDto.email ? [{ email: updateProfileDto.email }] : []),
        ],
      });

      if (conflicts && conflicts.id !== userId) {
        throw new ConflictException('Username or email already exists');
      }
    }

    await this.userRepository.update(userId, updateProfileDto);

    const updatedUser = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'username', 'email', 'firstName', 'lastName', 'role', 'themeColor', 'weekStartDay', 'defaultCalendarView', 'timezone', 'timeFormat', 'usagePlans', 'createdAt', 'updatedAt'],
    });

    return updatedUser;
  }

  @Patch('theme')
  @ApiOperation({ summary: 'Update user theme color' })
  @ApiResponse({ status: 200, description: 'Theme updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateTheme(@Request() req, @Body() updateThemeDto: UpdateThemeDto) {
    const userId = req.user.id;

    await this.userRepository.update(userId, { themeColor: updateThemeDto.themeColor });

    const updatedUser = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'username', 'email', 'firstName', 'lastName', 'role', 'themeColor', 'weekStartDay', 'defaultCalendarView', 'timezone', 'timeFormat', 'usagePlans', 'createdAt', 'updatedAt'],
    });

    return updatedUser;
  }

  @Patch('password')
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized or invalid current password' })
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    const userId = req.user.id;

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new ConflictException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new ConflictException('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, saltRounds);

    await this.userRepository.update(userId, { password: hashedNewPassword });

    return { message: 'Password changed successfully' };
  }
}