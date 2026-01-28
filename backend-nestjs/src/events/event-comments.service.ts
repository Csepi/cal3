import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Event } from '../entities/event.entity';
import { EventComment, CommentTemplateKey } from '../entities/event-comment.entity';
import {
  Calendar,
  CalendarShare,
  CalendarVisibility,
  SharePermission,
} from '../entities/calendar.entity';
import { EventsService } from './events.service';
import {
  CreateEventCommentDto,
  EventCommentResponseDto,
  UpdateEventCommentDto,
} from '../dto/event-comment.dto';
import { NotificationsService } from '../notifications/notifications.service';

import { logError } from '../common/errors/error-logger';
import { buildErrorContext } from '../common/errors/error-context';
@Injectable()
export class EventCommentsService {
  private readonly templateLibrary: Record<CommentTemplateKey, string> = {
    [CommentTemplateKey.WHAT_IM_DOING]: 'Log - What I am doing: ',
    [CommentTemplateKey.QUICK_NOTE]: 'Quick note: ',
    [CommentTemplateKey.REALITY_LOG]: 'Reality log: ',
    [CommentTemplateKey.OPEN_EVENT]: 'Opened event: ',
  };

  constructor(
    @InjectRepository(EventComment)
    private readonly commentRepository: Repository<EventComment>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Calendar)
    private readonly calendarRepository: Repository<Calendar>,
    @InjectRepository(CalendarShare)
    private readonly calendarShareRepository: Repository<CalendarShare>,
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => EventsService))
    private readonly eventsService: EventsService,
  ) {}

  async listForEvent(
    eventId: number,
    userId: number,
  ): Promise<{
    visibility: CalendarVisibility;
    canReply: boolean;
    comments: EventCommentResponseDto[];
  }> {
    const event = await this.eventsService.findOne(eventId, userId);

    const comments = await this.commentRepository.find({
      where: { eventId, parentCommentId: IsNull() },
      relations: ['reporter', 'replies', 'replies.reporter'],
      order: { createdAt: 'ASC' },
    });

    const canReply = await this.canReplyToEvent(event);
    const visibility =
      event.calendar?.visibility ?? CalendarVisibility.PRIVATE;

    return {
      visibility,
      canReply,
      comments: comments.map((comment) => this.toResponse(comment)),
    };
  }

  async createComment(
    eventId: number,
    dto: CreateEventCommentDto,
    userId: number,
  ): Promise<EventCommentResponseDto> {
    const event = await this.eventsService.findOne(eventId, userId);

    let parentComment: EventComment | null = null;
    if (dto.parentCommentId) {
      parentComment = await this.commentRepository.findOne({
        where: { id: dto.parentCommentId, eventId },
        relations: ['reporter'],
      });

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }

      const repliesAllowed = await this.canReplyToEvent(event);
      if (!repliesAllowed) {
        throw new ForbiddenException(
          'Replies are only available on shared or public events',
        );
      }
    }

    const content = this.composeContent(
      dto.content,
      dto.templateKey,
      parentComment ? 'reply' : 'comment',
      false,
    );

    const comment = this.commentRepository.create({
      eventId,
      reporterId: userId,
      parentCommentId: parentComment?.id,
      templateKey: dto.templateKey,
      content,
      isFlagged: dto.isFlagged ?? false,
      visibility: event.calendar?.visibility ?? CalendarVisibility.PRIVATE,
      context: parentComment ? 'reply' : 'comment',
      isSystem: false,
    });

    const saved = await this.commentRepository.save(comment);
    const withRelations = await this.hydrateComment(saved.id);

    await this.notifyParticipants(event, withRelations, userId);

    return this.toResponse(withRelations);
  }

  async updateComment(
    eventId: number,
    commentId: number,
    dto: UpdateEventCommentDto,
    userId: number,
  ): Promise<EventCommentResponseDto> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, eventId },
      relations: ['event', 'event.calendar'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.isSystem) {
      throw new ForbiddenException('System-generated comments cannot be edited');
    }

    const event =
      comment.event ??
      (await this.eventsService.findOne(comment.eventId, userId));

    await this.ensureEditPermission(comment, event, userId);

    comment.content = this.composeContent(
      dto.content,
      comment.templateKey,
      comment.context,
      false,
    );

    const saved = await this.commentRepository.save(comment);
    const withRelations = await this.hydrateComment(saved.id);
    return this.toResponse(withRelations);
  }

  async flagComment(
    eventId: number,
    commentId: number,
    isFlagged: boolean,
    userId: number,
  ): Promise<EventCommentResponseDto> {
    // Ensure user can read the event
    await this.eventsService.findOne(eventId, userId);

    const comment = await this.commentRepository.findOne({
      where: { id: commentId, eventId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    comment.isFlagged = isFlagged;
    comment.flaggedById = isFlagged ? userId : undefined;
    comment.flaggedAt = isFlagged ? new Date() : undefined;

    const saved = await this.commentRepository.save(comment);
    const withRelations = await this.hydrateComment(saved.id);
    return this.toResponse(withRelations);
  }

  async trackEventOpen(
    eventId: number,
    userId: number,
    note?: string,
  ): Promise<EventCommentResponseDto | null> {
    const event = await this.eventsService.findOne(eventId, userId);

    const recent = await this.commentRepository.findOne({
      where: {
        eventId,
        reporterId: userId,
        templateKey: CommentTemplateKey.OPEN_EVENT,
      },
      order: { createdAt: 'DESC' },
    });

    if (
      recent &&
      Date.now() - new Date(recent.createdAt).getTime() < 5 * 60 * 1000
    ) {
      // Already tracked recently; avoid spamming the timeline.
      return null;
    }

    const content = this.composeContent(
      note || 'Viewed the event details',
      CommentTemplateKey.OPEN_EVENT,
      'open-tracking',
      true,
    );

    const trackingComment = this.commentRepository.create({
      eventId,
      reporterId: userId,
      templateKey: CommentTemplateKey.OPEN_EVENT,
      content,
      isFlagged: false,
      visibility: event.calendar?.visibility ?? CalendarVisibility.PRIVATE,
      context: 'open-tracking',
      isSystem: true,
    });

    const saved = await this.commentRepository.save(trackingComment);
    const withRelations = await this.hydrateComment(saved.id);
    return this.toResponse(withRelations);
  }

  private composeContent(
    rawContent: string | undefined,
    templateKey: CommentTemplateKey | undefined,
    context: string,
    allowEmpty = false,
  ): string {
    const base = templateKey ? this.templateLibrary[templateKey] || '' : '';
    const trimmed = (rawContent || '').trim();

    if (!base && !trimmed && !allowEmpty) {
      throw new BadRequestException('Comment content cannot be empty');
    }

    if (!base) {
      return trimmed;
    }

    // Avoid double-prefixing if the client already included the template text
    if (trimmed.startsWith(base)) {
      return trimmed;
    }

    if (!trimmed) {
      return base.trim();
    }

    return `${base}${trimmed}`.trim();
  }

  private async canReplyToEvent(event: Event): Promise<boolean> {
    const calendar =
      event.calendar ??
      (await this.calendarRepository.findOne({
        where: { id: event.calendarId },
      }));

    if (!calendar) {
      return false;
    }

    if (calendar.visibility === CalendarVisibility.PUBLIC) {
      return true;
    }

    if (calendar.visibility === CalendarVisibility.SHARED) {
      return true;
    }

    const shareCount = await this.calendarShareRepository.count({
      where: { calendarId: calendar.id },
    });
    return shareCount > 0;
  }

  private async ensureEditPermission(
    comment: EventComment,
    event: Event,
    userId: number,
  ): Promise<void> {
    if (comment.reporterId === userId) {
      return;
    }

    const calendar =
      event.calendar ??
      (await this.calendarRepository.findOne({
        where: { id: event.calendarId },
      }));

    if (calendar?.ownerId === userId) {
      return;
    }

    const share = await this.calendarShareRepository.findOne({
      where: { calendarId: event.calendarId, userId },
    });

    const hasWriteAccess =
      !!share &&
      (share.permission === SharePermission.WRITE ||
        share.permission === SharePermission.ADMIN);

    if (!hasWriteAccess) {
      throw new ForbiddenException('You do not have permission to edit comment');
    }
  }

  private async hydrateComment(id: number): Promise<EventComment> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['reporter', 'replies', 'replies.reporter'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  private toResponse(entity: EventComment): EventCommentResponseDto {
    const response = new EventCommentResponseDto();
    response.id = entity.id;
    response.eventId = entity.eventId;
    response.parentCommentId = entity.parentCommentId ?? undefined;
    response.templateKey = entity.templateKey;
    response.content = entity.content;
    response.isFlagged = entity.isFlagged;
    response.flaggedAt = entity.flaggedAt ?? undefined;
    response.flaggedBy = entity.flaggedById
      ? { id: entity.flaggedById }
      : null;
    response.visibility = entity.visibility;
    response.reporter = entity.reporter
      ? {
          id: entity.reporter.id,
          username: entity.reporter.username,
          firstName: entity.reporter.firstName || undefined,
          lastName: entity.reporter.lastName || undefined,
        }
      : { id: entity.reporterId, username: 'Unknown' };
    response.context = entity.context;
    response.isSystem = entity.isSystem;
    response.createdAt = entity.createdAt;
    response.updatedAt = entity.updatedAt;
    response.replies = entity.replies
      ? entity.replies.map((reply) => this.toResponse(reply))
      : [];
    return response;
  }

  private async notifyParticipants(
    event: Event,
    comment: EventComment,
    actorId: number,
  ): Promise<void> {
    if (!this.notificationsService || comment.isSystem) {
      return;
    }

    try {
      const recipients = new Set<number>();
      const calendar =
        event.calendar ??
        (await this.calendarRepository.findOne({
          where: { id: event.calendarId },
        }));

      if (calendar?.ownerId) {
        recipients.add(calendar.ownerId);
      }

      if (event.createdById) {
        recipients.add(event.createdById);
      }

      const shares = await this.calendarShareRepository.find({
        where: { calendarId: event.calendarId },
      });
      shares.forEach((share) => recipients.add(share.userId));

      recipients.delete(actorId);
      const payloadRecipients = Array.from(recipients);
      if (payloadRecipients.length === 0) {
        return;
      }

      await this.notificationsService.publish({
        eventType: 'event.comment.created',
        actorId,
        recipients: payloadRecipients,
        title: `New comment on "${event.title}"`,
        body: comment.content,
        data: {
          eventId: event.id,
          commentId: comment.id,
          calendarId: event.calendarId,
        },
        context: {
          threadKey: `calendar:${event.calendarId}:event:${event.id}`,
          contextType: 'event',
          contextId: String(event.id),
        },
      });
    } catch (error) {
      logError(error, buildErrorContext({ action: 'event-comments.service' }));
      // Avoid blocking comment creation if notifications fail
      console.error('Failed to publish comment notification', error);
    }
  }
}
