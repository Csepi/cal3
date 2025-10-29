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
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { UpdateUsagePlansDto } from '../dto/user-profile.dto';
import { SystemInfoDto } from './dto/system-info.dto';
import { LogQueryDto, UpdateLogSettingsDto } from './dto/logs.dto';

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

  @Get('reservations')
  @ApiOperation({ summary: 'Get all reservations (Admin only)' })
  @ApiResponse({ status: 200, description: 'Reservations retrieved successfully' })
  getAllReservations() {
    return this.adminService.getAllReservations();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get database statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getDatabaseStats() {
    return this.adminService.getDatabaseStats();
  }

  @Get('system-info')
  @ApiOperation({ summary: 'Get comprehensive system information (Admin only)' })
  @ApiResponse({ status: 200, description: 'System information retrieved successfully', type: SystemInfoDto })
  getSystemInfo() {
    return this.adminService.getSystemInfo();
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get application logs (Admin only)' })
  @ApiResponse({ status: 200, description: 'Logs retrieved successfully' })
  getLogs(@Query() query: LogQueryDto) {
    return this.adminService.getLogs(query);
  }

  @Delete('logs')
  @ApiOperation({ summary: 'Delete application logs (Admin only)' })
  @ApiResponse({ status: 200, description: 'Logs deleted successfully' })
  clearLogs(@Query('before') before?: string) {
    return this.adminService.clearLogs(before);
  }

  @Post('logs/purge')
  @ApiOperation({ summary: 'Run retention cleanup immediately (Admin only)' })
  @ApiResponse({ status: 200, description: 'Log retention executed successfully' })
  runLogRetention() {
    return this.adminService.runLogRetention();
  }

  @Get('logs/settings')
  @ApiOperation({ summary: 'Get log retention settings (Admin only)' })
  @ApiResponse({ status: 200, description: 'Log settings retrieved successfully' })
  getLogSettings() {
    return this.adminService.getLogSettings();
  }

  @Patch('logs/settings')
  @ApiOperation({ summary: 'Update log retention settings (Admin only)' })
  @ApiResponse({ status: 200, description: 'Log settings updated successfully' })
  updateLogSettings(@Body() updateLogSettingsDto: UpdateLogSettingsDto) {
    return this.adminService.updateLogSettings(updateLogSettingsDto);
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

  @Patch('users/:id/usage-plans')
  @ApiOperation({ summary: 'Update user usage plans (Admin only)' })
  @ApiResponse({ status: 200, description: 'User usage plans updated successfully' })
  updateUserUsagePlans(
    @Param('id') id: string,
    @Body() updateUsagePlansDto: UpdateUsagePlansDto
  ) {
    return this.adminService.updateUserUsagePlans(+id, updateUsagePlansDto.usagePlans);
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

  // ORGANIZATION MANAGEMENT OPERATIONS
  @Get('organizations')
  @ApiOperation({ summary: 'Get all organizations (Admin only)' })
  @ApiResponse({ status: 200, description: 'Organizations retrieved successfully' })
  getAllOrganizations() {
        console.log('AdminController.getAllOrganizations called (this returns all organizations without filtering)');
    return this.adminService.getAllOrganizations();
  }

  @Get('users/:id/organizations')
  @ApiOperation({ summary: 'Get organizations for a specific user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User organizations retrieved successfully' })
  getUserOrganizations(@Param('id') id: string) {
    return this.adminService.getUserOrganizations(+id);
  }

  @Post('users/:id/organizations')
  @ApiOperation({ summary: 'Add user to organization (Admin only)' })
  @ApiResponse({ status: 200, description: 'User added to organization successfully' })
  addUserToOrganization(
    @Param('id') id: string,
    @Body() addToOrgDto: { organizationId: number }
  ) {
    return this.adminService.addUserToOrganization(+id, addToOrgDto.organizationId);
  }

  @Delete('users/:id/organizations/:orgId')
  @ApiOperation({ summary: 'Remove user from organization (Admin only)' })
  @ApiResponse({ status: 200, description: 'User removed from organization successfully' })
  removeUserFromOrganization(
    @Param('id') id: string,
    @Param('orgId') orgId: string
  ) {
    return this.adminService.removeUserFromOrganization(+id, +orgId);
  }

  @Get('organizations/:id/users')
  @ApiOperation({ summary: 'Get organization users with roles (Admin only)' })
  @ApiResponse({ status: 200, description: 'Organization users retrieved successfully' })
  getOrganizationUsers(@Param('id') id: string) {
    return this.adminService.getOrganizationUsers(+id);
  }

  @Post('organizations/:id/users')
  @ApiOperation({ summary: 'Add user to organization with role (Admin only)' })
  @ApiResponse({ status: 200, description: 'User added to organization successfully' })
  addUserToOrganizationWithRole(
    @Param('id') id: string,
    @Body() addUserDto: { userId: number; role: string }
  ) {
    return this.adminService.addUserToOrganizationWithRole(addUserDto.userId, +id, addUserDto.role);
  }

  // PUBLIC BOOKING INITIALIZATION
  @Post('public-booking/initialize')
  @ApiOperation({ summary: 'Initialize public booking (generate tokens and operating hours) (Admin only)' })
  @ApiResponse({ status: 200, description: 'Public booking initialized successfully' })
  initializePublicBooking() {
    return this.adminService.initializePublicBooking();
  }
}

