import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class NotificationI18nService {
  constructor(private readonly i18nService: I18nService) {}

  localizeTitle(
    eventType: string,
    language: string,
    args?: Record<string, unknown>,
  ): string {
    const normalizedKey = eventType.replace(/[^a-zA-Z0-9]+/g, '_');
    const candidateKeys = [
      `notifications.${normalizedKey}`,
      `notifications.${eventType}`,
      'notifications.system.featureAnnouncement',
    ];

    for (const key of candidateKeys) {
      const translatedRaw = this.i18nService.t(key, {
        lang: language,
        args,
        defaultValue: '',
      });
      const translated = String(translatedRaw ?? '');
      if (translated && translated !== key) {
        return translated;
      }
    }

    return eventType;
  }
}
