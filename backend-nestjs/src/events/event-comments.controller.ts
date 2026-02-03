import {
  Body,
  Controller,
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
import { EventCommentsService } from './event-comments.service';
import {
  CreateEventCommentDto,
  EventCommentResponseDto,
  FlagCommentDto,
  TrackEventOpenDto,
  UpdateEventCommentDto,
} from '../dto/event-comment.dto';

@ApiTags('Event Comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('events/:eventId/comments')
export class EventCommentsController {
  constructor(private readonly eventCommentsService: EventCommentsService) {}

  @Get()
  @ApiOperation({ summary: 'List comments for an event' })
  @ApiParam({ name: 'eventId', type: Number })
  @ApiResponse({
    status: 200,
    description:
      'Comments retrieved with visibility and reply capability metadata',
  })
  list(@Param('eventId') eventId: string, @Request() req: RequestWithUser) {
    return this.eventCommentsService.listForEvent(+eventId, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new comment' })
  @ApiParam({ name: 'eventId', type: Number })
  @ApiResponse({
    status: 201,
    description: 'Comment created',
    type: EventCommentResponseDto,
  })
  create(
    @Param('eventId') eventId: string,
    @Body() dto: CreateEventCommentDto,
    @Request() req: RequestWithUser,
  ) {
    return this.eventCommentsService.createComment(+eventId, dto, req.user.id);
  }

  @Post('track-open')
  @ApiOperation({ summary: 'Track when a user opens an event' })
  @ApiParam({ name: 'eventId', type: Number })
  @ApiResponse({
    status: 201,
    description: 'Open tracked (may be ignored if recently tracked)',
    type: EventCommentResponseDto,
  })
  trackOpen(
    @Param('eventId') eventId: string,
    @Body() dto: TrackEventOpenDto,
    @Request() req: RequestWithUser,
  ) {
    return this.eventCommentsService.trackEventOpen(
      +eventId,
      req.user.id,
      dto.note,
    );
  }

  @Patch(':commentId')
  @ApiOperation({ summary: 'Update an existing comment' })
  @ApiParam({ name: 'eventId', type: Number })
  @ApiParam({ name: 'commentId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Comment updated',
    type: EventCommentResponseDto,
  })
  update(
    @Param('eventId') eventId: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateEventCommentDto,
    @Request() req: RequestWithUser,
  ) {
    return this.eventCommentsService.updateComment(
      +eventId,
      +commentId,
      dto,
      req.user.id,
    );
  }

  @Patch(':commentId/flag')
  @ApiOperation({ summary: 'Flag or unflag a comment' })
  @ApiParam({ name: 'eventId', type: Number })
  @ApiParam({ name: 'commentId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Flag updated',
    type: EventCommentResponseDto,
  })
  flag(
    @Param('eventId') eventId: string,
    @Param('commentId') commentId: string,
    @Body() dto: FlagCommentDto,
    @Request() req: RequestWithUser,
  ) {
    return this.eventCommentsService.flagComment(
      +eventId,
      +commentId,
      dto.isFlagged,
      req.user.id,
    );
  }

  @Post(':commentId/replies')
  @ApiOperation({ summary: 'Reply to a comment (shared/public events only)' })
  @ApiParam({ name: 'eventId', type: Number })
  @ApiParam({ name: 'commentId', type: Number })
  @ApiResponse({
    status: 201,
    description: 'Reply created',
    type: EventCommentResponseDto,
  })
  reply(
    @Param('eventId') eventId: string,
    @Param('commentId') commentId: string,
    @Body() dto: CreateEventCommentDto,
    @Request() req: RequestWithUser,
  ) {
    return this.eventCommentsService.createComment(
      +eventId,
      { ...dto, parentCommentId: +commentId },
      req.user.id,
    );
  }
}
