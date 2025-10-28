import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import commonEN from './locales/en/common.json';
import calendarEN from './locales/en/calendar.json';
import automationEN from './locales/en/automation.json';
import adminEN from './locales/en/admin.json';
import mobileEN from './locales/en/mobile.json';

import commonDE from './locales/de/common.json';
import calendarDE from './locales/de/calendar.json';
import automationDE from './locales/de/automation.json';
import adminDE from './locales/de/admin.json';
import mobileDE from './locales/de/mobile.json';

import commonFR from './locales/fr/common.json';
import calendarFR from './locales/fr/calendar.json';
import automationFR from './locales/fr/automation.json';
import adminFR from './locales/fr/admin.json';
import mobileFR from './locales/fr/mobile.json';

import commonES from './locales/es/common.json';
import calendarES from './locales/es/calendar.json';
import automationES from './locales/es/automation.json';
import adminES from './locales/es/admin.json';
import mobileES from './locales/es/mobile.json';

import commonHU from './locales/hu/common.json';
import calendarHU from './locales/hu/calendar.json';
import automationHU from './locales/hu/automation.json';
import adminHU from './locales/hu/admin.json';
import mobileHU from './locales/hu/mobile.json';

// Translation resources
const resources = {
  en: {
    common: commonEN,
    calendar: calendarEN,
    automation: automationEN,
    admin: adminEN,
    mobile: mobileEN,
  },
  de: {
    common: commonDE,
    calendar: calendarDE,
    automation: automationDE,
    admin: adminDE,
    mobile: mobileDE,
  },
  fr: {
    common: commonFR,
    calendar: calendarFR,
    automation: automationFR,
    admin: adminFR,
    mobile: mobileFR,
  },
  es: {
    common: commonES,
    calendar: calendarES,
    automation: automationES,
    admin: adminES,
    mobile: mobileES,
  },
  hu: {
    common: commonHU,
    calendar: calendarHU,
    automation: automationHU,
    admin: adminHU,
    mobile: mobileHU,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'calendar', 'automation', 'admin', 'mobile'],
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;
