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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto, EventResponseDto } from '../dto/event.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new event (public for testing)' })
  @ApiResponse({ status: 201, description: 'Event created successfully', type: EventResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  create(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.createPublic(createEventDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all events (public access for testing)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter events from this date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter events until this date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully', type: [EventResponseDto] })
  findAll(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.eventsService.findAllPublic(startDate, endDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiParam({ name: 'id', description: 'Event ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Event retrieved successfully', type: EventResponseDto })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.eventsService.findOne(+id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update event' })
  @ApiParam({ name: 'id', description: 'Event ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Event updated successfully', type: EventResponseDto })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto, @Request() req) {
    return this.eventsService.update(+id, updateEventDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete event (public for testing)' })
  @ApiParam({ name: 'id', description: 'Event ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  remove(@Param('id') id: string) {
    return this.eventsService.removePublic(+id);
  }

  @Get('calendar/:calendarId')
  @ApiOperation({ summary: 'Get all events from a specific calendar' })
  @ApiParam({ name: 'calendarId', description: 'Calendar ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Calendar events retrieved successfully', type: [EventResponseDto] })
  @ApiResponse({ status: 403, description: 'Access denied to calendar' })
  @ApiResponse({ status: 404, description: 'Calendar not found' })
  findByCalendar(@Param('calendarId') calendarId: string, @Request() req) {
    return this.eventsService.findByCalendar(+calendarId, req.user.id);
  }
}