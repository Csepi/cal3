import { I18nService } from 'nestjs-i18n';
import { NotificationI18nService } from './notification-i18n.service';

describe('NotificationI18nService', () => {
  let service: NotificationI18nService;
  let i18nService: { t: jest.Mock };

  beforeEach(() => {
    i18nService = {
      t: jest.fn(),
    };
    service = new NotificationI18nService(i18nService as unknown as I18nService);
  });

  it('returns the first translated candidate key using normalized event key first', () => {
    i18nService.t.mockImplementation((key: string) => {
      if (key === 'notifications.calendar_shared') {
        return 'Calendar shared';
      }
      return key;
    });

    const title = service.localizeTitle('calendar.shared', 'en', {
      actorName: 'Alice',
    });

    expect(title).toBe('Calendar shared');
    expect(i18nService.t).toHaveBeenCalledWith('notifications.calendar_shared', {
      lang: 'en',
      args: { actorName: 'Alice' },
      defaultValue: '',
    });
  });

  it('falls back to legacy key when normalized key has no translation', () => {
    i18nService.t.mockImplementation((key: string) => {
      if (key === 'notifications.calendar.shared') {
        return 'Calendar shared (legacy)';
      }
      return key;
    });

    const title = service.localizeTitle('calendar.shared', 'en');

    expect(title).toBe('Calendar shared (legacy)');
    expect(i18nService.t).toHaveBeenNthCalledWith(
      1,
      'notifications.calendar_shared',
      expect.objectContaining({ lang: 'en' }),
    );
    expect(i18nService.t).toHaveBeenNthCalledWith(
      2,
      'notifications.calendar.shared',
      expect.objectContaining({ lang: 'en' }),
    );
  });

  it('falls back to event type when no candidate key translates', () => {
    i18nService.t.mockImplementation((key: string) => key);

    const title = service.localizeTitle('custom.event.type', 'fr');

    expect(title).toBe('custom.event.type');
    expect(i18nService.t).toHaveBeenNthCalledWith(
      3,
      'notifications.system.featureAnnouncement',
      expect.objectContaining({ lang: 'fr' }),
    );
  });
});

