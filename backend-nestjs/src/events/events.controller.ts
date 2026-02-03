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
import type { RequestWithUser } from '../common/types/request-with-user';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { EventsService } from './events.service';
import {
  CreateEventDto,
  UpdateEventDto,
  EventResponseDto,
} from '../dto/event.dto';
import {
  UpdateRecurringEventDto,
  CreateRecurringEventDto,
} from '../dto/recurrence.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({
    status: 201,
    description: 'Event created successfully',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body() createEventDto: CreateEventDto,
    @Request() req: RequestWithUser,
  ) {
    return this.eventsService.create(createEventDto, req.user.id);
  }

  @Post('recurring')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new recurring event' })
  @ApiResponse({
    status: 201,
    description: 'Recurring event created successfully',
    type: [EventResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  createRecurring(
    @Body() createRecurringEventDto: CreateRecurringEventDto,
    @Request() req: RequestWithUser,
  ) {
    return this.eventsService.createRecurring(
      createRecurringEventDto,
      req.user.id,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all accessible events' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Filter events from this date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Filter events until this date (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: 'Events retrieved successfully',
    type: [EventResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Request() req: RequestWithUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.eventsService.findAll(req.user.id, startDate, endDate);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiParam({ name: 'id', description: 'Event ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Event retrieved successfully',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.eventsService.findOne(+id, req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update event' })
  @ApiParam({ name: 'id', description: 'Event ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Event updated successfully',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Request() req: RequestWithUser,
  ) {
    return this.eventsService.update(+id, updateEventDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete event' })
  @ApiParam({ name: 'id', description: 'Event ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.eventsService.remove(+id, req.user.id);
  }

  @Patch(':id/recurring')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update recurring event' })
  @ApiParam({ name: 'id', description: 'Event ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Recurring event updated successfully',
    type: [EventResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  updateRecurring(
    @Param('id') id: string,
    @Body() updateRecurringEventDto: UpdateRecurringEventDto,
    @Request() req: RequestWithUser,
  ) {
    return this.eventsService.updateRecurring(
      +id,
      updateRecurringEventDto,
      req.user.id,
    );
  }

  @Get('calendar/:calendarId')
  @ApiOperation({ summary: 'Get all events from a specific calendar' })
  @ApiParam({ name: 'calendarId', description: 'Calendar ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Calendar events retrieved successfully',
    type: [EventResponseDto],
  })
  @ApiResponse({ status: 403, description: 'Access denied to calendar' })
  @ApiResponse({ status: 404, description: 'Calendar not found' })
  findByCalendar(
    @Param('calendarId') calendarId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.eventsService.findByCalendar(+calendarId, req.user.id);
  }
}
