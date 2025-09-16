import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from './admin.guard';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('calendars')
  @ApiOperation({ summary: 'Get all calendars (Admin only)' })
  @ApiResponse({ status: 200, description: 'Calendars retrieved successfully' })
  getAllCalendars() {
    return this.adminService.getAllCalendars();
  }

  @Get('events')
  @ApiOperation({ summary: 'Get all events (Admin only)' })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  getAllEvents() {
    return this.adminService.getAllEvents();
  }

  @Get('calendar-shares')
  @ApiOperation({ summary: 'Get all calendar shares (Admin only)' })
  @ApiResponse({ status: 200, description: 'Calendar shares retrieved successfully' })
  getAllCalendarShares() {
    return this.adminService.getAllCalendarShares();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get database statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getDatabaseStats() {
    return this.adminService.getDatabaseStats();
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  @ApiResponse({ status: 200, description: 'User role updated successfully' })
  updateUserRole(
    @Param('id') id: string,
    @Body() updateRoleDto: { role: string }
  ) {
    return this.adminService.updateUserRole(+id, updateRoleDto.role);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(+id);
  }

  @Delete('calendars/:id')
  @ApiOperation({ summary: 'Delete calendar (Admin only)' })
  @ApiResponse({ status: 200, description: 'Calendar deleted successfully' })
  deleteCalendar(@Param('id') id: string) {
    return this.adminService.deleteCalendar(+id);
  }

  @Delete('events/:id')
  @ApiOperation({ summary: 'Delete event (Admin only)' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  deleteEvent(@Param('id') id: string) {
    return this.adminService.deleteEvent(+id);
  }
}