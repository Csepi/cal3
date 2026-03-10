import { I18nContext } from 'nestjs-i18n';

export const bStatic = (key: string): string => {
  const context = I18nContext.current();
  if (context) {
    return context.t(key);
  }
  return key;
};
