import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Calendar, CalendarShare } from '../entities/calendar.entity';
import { Event } from '../entities/event.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { logError } from '../common/errors/error-logger';
import { buildErrorContext } from '../common/errors/error-context';

@Injectable()
export class EventNotificationService {
  private readonly logger = new Logger(EventNotificationService.name);

  constructor(
    @InjectRepository(Calendar)
    private readonly calendarRepository: Repository<Calendar>,
    @InjectRepository(CalendarShare)
    private readonly calendarShareRepository: Repository<CalendarShare>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async notifyEventChange(
    event: Event,
    action: 'created' | 'updated' | 'deleted',
    actorId: number,
  ): Promise<void> {
    try {
      const recipientsSet = await this.collectCalendarParticipantIds(
        event.calendarId,
        [event.createdById],
      );

      if (actorId) {
        recipientsSet.delete(actorId);
      }

      const recipients = Array.from(recipientsSet);
      if (recipients.length === 0) {
        return;
      }

      const calendar = await this.calendarRepository.findOne({
        where: { id: event.calendarId },
      });
      const calendarName = calendar?.name ?? 'Calendar';
      const eventTitle = event.title ?? 'Untitled event';
      const actionDescriptor =
        action === 'created'
          ? 'created'
          : action === 'deleted'
            ? 'deleted'
            : 'updated';

      let scheduleSnippet = '';
      if (event.startDate) {
        const when = new Date(event.startDate);
        if (!Number.isNaN(when.getTime())) {
          scheduleSnippet = ` Scheduled for ${when.toISOString()}`;
        }
      }

      await this.notificationsService.publish({
        eventType: `event.${action}`,
        actorId,
        recipients,
        title: `${calendarName}: Event ${actionDescriptor}`,
        body: `Event "${eventTitle}" was ${actionDescriptor}.${scheduleSnippet}`,
        data: {
          eventId: event.id,
          calendarId: event.calendarId,
        },
        context: {
          threadKey: `calendar:${event.calendarId}:event:${event.id}`,
          contextType: 'event',
          contextId: String(event.id),
        },
      });
    } catch (error) {
      logError(error, buildErrorContext({ action: 'events.notification' }));
      this.logger.error(
        `Failed to send notification for event ${event.id} (${action})`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async collectCalendarParticipantIds(
    calendarId: number,
    additional: Array<number | string | null | undefined> = [],
  ): Promise<Set<number>> {
    const ids = new Set<number>();

    for (const candidate of additional) {
      if (candidate === null || candidate === undefined) {
        continue;
      }
      const numericId = Number(candidate);
      if (!Number.isNaN(numericId) && numericId > 0) {
        ids.add(numericId);
      }
    }

    const calendar = await this.calendarRepository.findOne({
      where: { id: calendarId },
    });
    if (calendar?.ownerId) {
      ids.add(calendar.ownerId);
    }

    const shares = await this.calendarShareRepository.find({
      where: { calendarId },
    });
    shares.forEach((share) => ids.add(share.userId));

    return ids;
  }
}
