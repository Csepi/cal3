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

  // CREATE OPERATIONS
  @Post('users')
  @ApiOperation({ summary: 'Create new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  createUser(@Body() createUserDto: any) {
    return this.adminService.createUser(createUserDto);
  }

  @Post('calendars')
  @ApiOperation({ summary: 'Create new calendar (Admin only)' })
  @ApiResponse({ status: 201, description: 'Calendar created successfully' })
  createCalendar(@Body() createCalendarDto: any) {
    return this.adminService.createCalendar(createCalendarDto);
  }

  @Post('events')
  @ApiOperation({ summary: 'Create new event (Admin only)' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  createEvent(@Body() createEventDto: any) {
    return this.adminService.createEvent(createEventDto);
  }

  // UPDATE OPERATIONS
  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  updateUser(@Param('id') id: string, @Body() updateUserDto: any) {
    return this.adminService.updateUser(+id, updateUserDto);
  }

  @Patch('users/:id/password')
  @ApiOperation({ summary: 'Update user password (Admin only)' })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  updateUserPassword(@Param('id') id: string, @Body() updatePasswordDto: { password: string }) {
    return this.adminService.updateUserPassword(+id, updatePasswordDto.password);
  }

  @Patch('calendars/:id')
  @ApiOperation({ summary: 'Update calendar (Admin only)' })
  @ApiResponse({ status: 200, description: 'Calendar updated successfully' })
  updateCalendar(@Param('id') id: string, @Body() updateCalendarDto: any) {
    return this.adminService.updateCalendar(+id, updateCalendarDto);
  }

  @Patch('events/:id')
  @ApiOperation({ summary: 'Update event (Admin only)' })
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  updateEvent(@Param('id') id: string, @Body() updateEventDto: any) {
    return this.adminService.updateEvent(+id, updateEventDto);
  }

  // GET SINGLE ITEM OPERATIONS
  @Get('users/:id')
  @ApiOperation({ summary: 'Get single user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  getUser(@Param('id') id: string) {
    return this.adminService.getUser(+id);
  }

  @Get('calendars/:id')
  @ApiOperation({ summary: 'Get single calendar (Admin only)' })
  @ApiResponse({ status: 200, description: 'Calendar retrieved successfully' })
  getCalendar(@Param('id') id: string) {
    return this.adminService.getCalendar(+id);
  }

  @Get('events/:id')
  @ApiOperation({ summary: 'Get single event (Admin only)' })
  @ApiResponse({ status: 200, description: 'Event retrieved successfully' })
  getEvent(@Param('id') id: string) {
    return this.adminService.getEvent(+id);
  }
}