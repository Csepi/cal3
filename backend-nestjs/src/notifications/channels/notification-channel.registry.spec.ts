import { Logger } from '@nestjs/common';
import { NotificationChannelRegistry } from './notification-channel.registry';
import {
  NotificationChannelContext,
  NotificationChannelProvider,
} from './notification-channel.interface';
import { NotificationChannelType } from '../notifications.constants';

const buildProvider = (
  channel: NotificationChannelType,
  canSendResult = true,
): NotificationChannelProvider & {
  canSend: jest.Mock<Promise<boolean>, []>;
  send: jest.Mock<Promise<void>, [NotificationChannelContext]>;
} => ({
  channel,
  canSend: jest.fn(async () => canSendResult),
  send: jest.fn(async () => undefined),
});

describe('NotificationChannelRegistry', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('returns registered providers and delegates canSend/send calls', async () => {
    const emailProvider = buildProvider('email', true);
    const registry = new NotificationChannelRegistry([emailProvider]);

    const context = {
      message: { id: 1 },
      delivery: { id: 2 },
    } as NotificationChannelContext;

    expect(registry.get('email')).toBe(emailProvider);
    await expect(registry.canSend('email')).resolves.toBe(true);
    await expect(registry.send('email', context)).resolves.toBeUndefined();

    expect(emailProvider.canSend).toHaveBeenCalledTimes(1);
    expect(emailProvider.send).toHaveBeenCalledWith(context);
  });

  it('warns and returns false when canSend is called for an unregistered channel', async () => {
    const warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    const registry = new NotificationChannelRegistry([]);

    await expect(registry.canSend('teams')).resolves.toBe(false);
    expect(warnSpy).toHaveBeenCalledWith(
      'No provider registered for channel teams',
    );
  });

  it('throws a descriptive error for unregistered send channels', async () => {
    const registry = new NotificationChannelRegistry([]);
    const context = {
      message: { id: 1 },
      delivery: { id: 2 },
    } as NotificationChannelContext;

    await expect(registry.send('slack', context)).rejects.toThrow(
      'Channel provider not found for slack',
    );
  });
});

