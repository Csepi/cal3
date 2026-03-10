export const localeModules = import.meta.glob('./*/*.json');

export const supportedLocaleNamespaces = [
  'common',
  'auth',
  'calendar',
  'booking',
  'settings',
  'admin',
  'automation',
  'errors',
  'validation',
  'emails',
  'notifications',
  'mobile',
] as const;

