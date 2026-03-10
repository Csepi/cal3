import { FALLBACK_LANGUAGE, normalizeLanguage } from './types';

const defaultDateFormatByLanguage: Record<string, Intl.DateTimeFormatOptions> = {
  en: { year: 'numeric', month: '2-digit', day: '2-digit' },
  hu: { year: 'numeric', month: '2-digit', day: '2-digit' },
  de: { day: '2-digit', month: '2-digit', year: 'numeric' },
  fr: { day: '2-digit', month: '2-digit', year: 'numeric' },
};

const defaultHour12ByLanguage: Record<string, boolean> = {
  en: true,
  hu: false,
  de: false,
  fr: false,
};

const resolveLocale = (language?: string): string =>
  normalizeLanguage(language ?? FALLBACK_LANGUAGE);

export const formatDate = (
  value: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
  language?: string,
): string => {
  const locale = resolveLocale(language);
  const date = value instanceof Date ? value : new Date(value);
  const formatOptions = options ?? defaultDateFormatByLanguage[locale];
  return new Intl.DateTimeFormat(locale, formatOptions).format(date);
};

export const formatTime = (
  value: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
  language?: string,
  userHour12Preference?: boolean,
): string => {
  const locale = resolveLocale(language);
  const date = value instanceof Date ? value : new Date(value);
  const hour12 =
    typeof userHour12Preference === 'boolean'
      ? userHour12Preference
      : defaultHour12ByLanguage[locale];

  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    ...(options ?? {}),
    hour12,
  }).format(date);
};

export const formatNumber = (
  value: number,
  options?: Intl.NumberFormatOptions,
  language?: string,
): string => {
  const locale = resolveLocale(language);
  return new Intl.NumberFormat(locale, options).format(value);
};

export const formatCurrency = (
  value: number,
  currency: string,
  language?: string,
  options?: Intl.NumberFormatOptions,
): string => {
  const locale = resolveLocale(language);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    ...(options ?? {}),
  }).format(value);
};

type RelativeUnit = Intl.RelativeTimeFormatUnit;

const relativeUnits: Array<{ limit: number; unit: RelativeUnit; divisor: number }> = [
  { limit: 60, unit: 'second', divisor: 1 },
  { limit: 60 * 60, unit: 'minute', divisor: 60 },
  { limit: 60 * 60 * 24, unit: 'hour', divisor: 60 * 60 },
  { limit: 60 * 60 * 24 * 7, unit: 'day', divisor: 60 * 60 * 24 },
  { limit: 60 * 60 * 24 * 30, unit: 'week', divisor: 60 * 60 * 24 * 7 },
  { limit: 60 * 60 * 24 * 365, unit: 'month', divisor: 60 * 60 * 24 * 30 },
  { limit: Number.POSITIVE_INFINITY, unit: 'year', divisor: 60 * 60 * 24 * 365 },
];

export const formatRelativeTime = (
  input: Date | string | number,
  language?: string,
  referenceDate = new Date(),
): string => {
  const locale = resolveLocale(language);
  const target = input instanceof Date ? input : new Date(input);
  const diffInSeconds = Math.round((target.getTime() - referenceDate.getTime()) / 1000);
  const absoluteSeconds = Math.abs(diffInSeconds);
  const unitConfig =
    relativeUnits.find((candidate) => absoluteSeconds < candidate.limit) ??
    relativeUnits[relativeUnits.length - 1];

  const value = Math.round(diffInSeconds / unitConfig.divisor);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  return formatter.format(value, unitConfig.unit);
};

