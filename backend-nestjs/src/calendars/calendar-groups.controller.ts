import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import type { RequestWithUser } from '../common/types/request-with-user';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CalendarGroupsService } from './calendar-groups.service';
import {
  AssignCalendarsToGroupDto,
  CalendarGroupResponseDto,
  CreateCalendarGroupDto,
  ShareCalendarGroupDto,
  UpdateCalendarGroupDto,
} from '../dto/calendar-group.dto';

@ApiTags('Calendar Groups')
@Controller('calendar-groups')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CalendarGroupsController {
  constructor(private readonly calendarGroupsService: CalendarGroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new calendar group' })
  @ApiResponse({
    status: 201,
    description: 'Calendar group created',
    type: CalendarGroupResponseDto,
  })
  create(
    @Body() createCalendarGroupDto: CreateCalendarGroupDto,
    @Request() req: RequestWithUser,
  ) {
    return this.calendarGroupsService.create(
      createCalendarGroupDto,
      req.user.id,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'List calendar groups for the user with calendars they can access',
  })
  findAll(@Request() req: RequestWithUser) {
    return this.calendarGroupsService.findAll(req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Rename or toggle visibility of a group' })
  @ApiParam({ name: 'id', description: 'Group ID', type: 'number' })
  update(
    @Param('id') id: string,
    @Body() updateCalendarGroupDto: UpdateCalendarGroupDto,
    @Request() req: RequestWithUser,
  ) {
    return this.calendarGroupsService.update(
      +id,
      updateCalendarGroupDto,
      req.user.id,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a calendar group without deleting the calendars inside it',
  })
  @ApiParam({ name: 'id', description: 'Group ID', type: 'number' })
  remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.calendarGroupsService.remove(+id, req.user.id);
  }

  @Post(':id/calendars')
  @ApiOperation({ summary: 'Assign calendars to a group (drag/drop support)' })
  @ApiParam({ name: 'id', description: 'Group ID', type: 'number' })
  assignCalendars(
    @Param('id') id: string,
    @Body() assignCalendarsDto: AssignCalendarsToGroupDto,
    @Request() req: RequestWithUser,
  ) {
    return this.calendarGroupsService.assignCalendars(
      +id,
      assignCalendarsDto,
      req.user.id,
    );
  }

  @Post(':id/calendars/unassign')
  @ApiOperation({ summary: 'Remove calendars from a group' })
  @ApiParam({ name: 'id', description: 'Group ID', type: 'number' })
  unassignCalendars(
    @Param('id') id: string,
    @Body() assignCalendarsDto: AssignCalendarsToGroupDto,
    @Request() req: RequestWithUser,
  ) {
    return this.calendarGroupsService.unassignCalendars(
      +id,
      assignCalendarsDto,
      req.user.id,
    );
  }

  @Post(':id/share')
  @ApiOperation({
    summary: 'Share all calendars in a group with the same permissions',
  })
  @ApiParam({ name: 'id', description: 'Group ID', type: 'number' })
  shareGroup(
    @Param('id') id: string,
    @Body() shareCalendarGroupDto: ShareCalendarGroupDto,
    @Request() req: RequestWithUser,
  ) {
    return this.calendarGroupsService.shareGroup(
      +id,
      shareCalendarGroupDto,
      req.user.id,
    );
  }

  @Delete(':id/share')
  @ApiOperation({
    summary: 'Unshare all calendars in a group from specific users',
  })
  @ApiParam({ name: 'id', description: 'Group ID', type: 'number' })
  unshareGroup(
    @Param('id') id: string,
    @Body() body: { userIds: number[] },
    @Request() req: RequestWithUser,
  ) {
    return this.calendarGroupsService.unshareGroup(
      +id,
      body.userIds,
      req.user.id,
    );
  }
}
