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
import type { RequestWithUser } from '../common/types/request-with-user';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CalendarsService } from './calendars.service';
import { CalendarGroupsService } from './calendar-groups.service';
import {
  CreateCalendarDto,
  UpdateCalendarDto,
  ShareCalendarDto,
  CalendarResponseDto,
} from '../dto/calendar.dto';
import {
  CreateCalendarGroupDto,
  CalendarGroupResponseDto,
} from '../dto/calendar-group.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Calendars')
@Controller('calendars')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CalendarsController {
  constructor(
    private readonly calendarsService: CalendarsService,
    private readonly calendarGroupsService: CalendarGroupsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new calendar' })
  @ApiResponse({
    status: 201,
    description: 'Calendar created successfully',
    type: CalendarResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body() createCalendarDto: CreateCalendarDto,
    @Request() req: RequestWithUser,
  ) {
    return this.calendarsService.create(createCalendarDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all calendars (owned and shared)' })
  @ApiResponse({
    status: 200,
    description: 'Calendars retrieved successfully',
    type: [CalendarResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Request() req: RequestWithUser) {
    return this.calendarsService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get calendar by ID' })
  @ApiParam({ name: 'id', description: 'Calendar ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Calendar retrieved successfully',
    type: CalendarResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Calendar not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.calendarsService.findOne(+id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update calendar' })
  @ApiParam({ name: 'id', description: 'Calendar ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Calendar updated successfully',
    type: CalendarResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Calendar not found' })
  update(
    @Param('id') id: string,
    @Body() updateCalendarDto: UpdateCalendarDto,
    @Request() req: RequestWithUser,
  ) {
    return this.calendarsService.update(+id, updateCalendarDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete calendar (soft delete)' })
  @ApiParam({ name: 'id', description: 'Calendar ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Calendar deleted successfully' })
  @ApiResponse({ status: 403, description: 'Only owner can delete calendar' })
  @ApiResponse({ status: 404, description: 'Calendar not found' })
  remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.calendarsService.remove(+id, req.user.id);
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Share calendar with users' })
  @ApiParam({ name: 'id', description: 'Calendar ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Calendar shared successfully' })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions to share calendar',
  })
  @ApiResponse({ status: 404, description: 'Calendar not found' })
  shareCalendar(
    @Param('id') id: string,
    @Body() shareCalendarDto: ShareCalendarDto,
    @Request() req: RequestWithUser,
  ) {
    return this.calendarsService.shareCalendar(
      +id,
      shareCalendarDto,
      req.user.id,
    );
  }

  @Delete(':id/share')
  @ApiOperation({ summary: 'Unshare calendar from users' })
  @ApiParam({ name: 'id', description: 'Calendar ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Calendar unshared successfully' })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions to unshare calendar',
  })
  unshareCalendar(
    @Param('id') id: string,
    @Body() body: { userIds: number[] },
    @Request() req: RequestWithUser,
  ) {
    return this.calendarsService.unshareCalendar(
      +id,
      body.userIds,
      req.user.id,
    );
  }

  @Get(':id/shared-users')
  @ApiOperation({ summary: 'Get users that calendar is shared with' })
  @ApiParam({ name: 'id', description: 'Calendar ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Shared users retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Calendar not found' })
  getSharedUsers(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.calendarsService.getSharedUsers(+id, req.user.id);
  }

  // Calendar Groups (alias under calendars prefix for clients expecting /calendars/...)
  @Get('groups')
  @ApiOperation({
    summary: 'List calendar groups for the user with calendars they can access',
  })
  findAllGroups(@Request() req: RequestWithUser) {
    return this.calendarGroupsService.findAll(req.user.id);
  }

  @Post('groups')
  @ApiOperation({ summary: 'Create a new calendar group' })
  @ApiResponse({
    status: 201,
    description: 'Calendar group created',
    type: CalendarGroupResponseDto,
  })
  createGroup(
    @Body() createCalendarGroupDto: CreateCalendarGroupDto,
    @Request() req: RequestWithUser,
  ) {
    return this.calendarGroupsService.create(
      createCalendarGroupDto,
      req.user.id,
    );
  }
}
