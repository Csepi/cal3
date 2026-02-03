import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fetch from 'node-fetch';
import {
  NotificationChannelProvider,
  NotificationChannelContext,
  NotificationChannelSkipError,
} from './notification-channel.interface';

@Injectable()
export class TeamsChannelProvider implements NotificationChannelProvider {
  readonly channel = 'teams' as const;

  private readonly logger = new Logger(TeamsChannelProvider.name);

  constructor(private readonly configService: ConfigService) {}

  canSend(): boolean {
    const webhook = this.configService.get<string>('TEAMS_WEBHOOK_URL');
    return Boolean(webhook);
  }

  async send({ message }: NotificationChannelContext): Promise<void> {
    const webhook = this.configService.get<string>('TEAMS_WEBHOOK_URL');

    if (!webhook) {
      throw new NotificationChannelSkipError('Teams webhook not configured');
    }

    const payload = {
      type: 'MessageCard',
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor: '0076D7',
      summary: message.title ?? 'Notification',
      title: message.title ?? 'Notification',
      sections: [
        {
          activityTitle: message.title ?? 'Notification',
          text: message.body,
          facts: [
            { name: 'Event Type', value: message.eventType },
            { name: 'User ID', value: String(message.userId) },
          ],
        },
      ],
    } as unknown;

    const response = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`Teams webhook failed: ${response.status} ${text}`);
      throw new Error(`Teams webhook responded with ${response.status}`);
    }
  }
}
