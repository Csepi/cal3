import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  NotificationChannelProvider,
  NotificationChannelContext,
} from './notification-channel.interface';
import { NotificationChannelType } from '../notifications.constants';

export const NOTIFICATION_CHANNEL_PROVIDERS = Symbol(
  'NOTIFICATION_CHANNEL_PROVIDERS',
);

@Injectable()
export class NotificationChannelRegistry {
  private readonly logger = new Logger(NotificationChannelRegistry.name);
  private readonly providerMap = new Map<
    NotificationChannelType,
    NotificationChannelProvider
  >();

  constructor(
    @Inject(NOTIFICATION_CHANNEL_PROVIDERS)
    private readonly providers: NotificationChannelProvider[],
  ) {
    providers.forEach((provider) => {
      this.providerMap.set(provider.channel, provider);
    });
  }

  get(
    channel: NotificationChannelType,
  ): NotificationChannelProvider | undefined {
    return this.providerMap.get(channel);
  }

  async canSend(channel: NotificationChannelType): Promise<boolean> {
    const provider = this.get(channel);
    if (!provider) {
      this.logger.warn(`No provider registered for channel ${channel}`);
      return false;
    }
    return provider.canSend();
  }

  async send(
    channel: NotificationChannelType,
    context: NotificationChannelContext,
  ): Promise<void> {
    const provider = this.get(channel);
    if (!provider) {
      throw new Error(`Channel provider not found for ${channel}`);
    }
    await provider.send(context);
  }
}
