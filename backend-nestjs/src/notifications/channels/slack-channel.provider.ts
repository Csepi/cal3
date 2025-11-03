import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fetch from 'node-fetch';
import {
  NotificationChannelProvider,
  NotificationChannelContext,
  NotificationChannelSkipError,
} from './notification-channel.interface';

@Injectable()
export class SlackChannelProvider implements NotificationChannelProvider {
  readonly channel = 'slack' as const;

  private readonly logger = new Logger(SlackChannelProvider.name);

  constructor(private readonly configService: ConfigService) {}

  canSend(): boolean {
    const webhookUrl = this.configService.get<string>('SLACK_WEBHOOK_URL');
    return Boolean(webhookUrl);
  }

  async send({ message }: NotificationChannelContext): Promise<void> {
    const webhookUrl = this.configService.get<string>('SLACK_WEBHOOK_URL');

    if (!webhookUrl) {
      throw new NotificationChannelSkipError('Slack webhook not configured');
    }

    const payload = {
      text: message.title ? `*${message.title}*\n${message.body}` : message.body,
      attachments: [
        {
          color: '#3b82f6',
          fields: [
            { title: 'Event Type', value: message.eventType, short: true },
            { title: 'User ID', value: String(message.userId), short: true },
          ],
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`Slack webhook failed: ${response.status} ${text}`);
      throw new Error(`Slack webhook responded with ${response.status}`);
    }
  }
}
