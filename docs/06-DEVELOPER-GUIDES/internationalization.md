# Internationalization (i18n)

PrimeCalendar now supports four production languages:

- `en` (default)
- `hu`
- `de`
- `fr`

## Architecture

### Frontend (React)

- Runtime: `i18next`, `react-i18next`, `i18next-browser-languagedetector`, `i18next-http-backend`
- Config: `frontend/src/i18n/config.ts`
- Typed helpers:
  - `frontend/src/i18n/useAppTranslation.ts`
  - `frontend/src/i18n/formatters.ts`
  - `frontend/src/i18n/types.ts`
- Locale files: `frontend/src/locales/{lang}/{namespace}.json`
- Provider: `frontend/src/i18n/I18nProvider.tsx`
- Switcher: `frontend/src/components/LanguageSwitcher.tsx`

Detection order:

1. user profile preference cache (`primecal.profile.language`)
2. query parameter (`?lang=xx`)
3. local storage (`primecal.language`)
4. browser language

### Backend (NestJS)

- Runtime: `nestjs-i18n`
- Global module: `backend-nestjs/src/i18n/i18n.module.ts`
- Request resolver middleware: `backend-nestjs/src/i18n/language-preference.middleware.ts`
- Locale files: `backend-nestjs/src/i18n/{lang}/*.json`

Language sources (priority):

1. request body (`preferredLanguage`, `language`, `lang`)
2. query (`lang`)
3. JWT claims (`preferredLanguage`, `language`, `lang`)
4. `Accept-Language`

### Database

- `users.preferred_language`
- `organisations.default_language`

Migration files:

- `backend-nestjs/src/database/migrations/1734900000000-AddLanguagePreferences.ts`
- `database/migrations/002_add_language_preferences.sql`

## Developer Workflow

### Add new translatable string

1. Add the key to `frontend/src/locales/en/<namespace>.json`.
2. Add equivalent key/value to `hu`, `de`, `fr`.
3. Use `t('namespace:path.to.key')` from `useAppTranslation`.
4. Run:
   - `npm run i18n:validate`
   - `npm run i18n:export`

### Add backend message key

1. Add key to `backend-nestjs/src/i18n/en/<file>.json`.
2. Add matching keys in `hu`, `de`, `fr`.
3. Use `I18nService.t('file.key', { lang, args })`.
4. Re-run `npm run i18n:validate`.

## Validation Tooling

- Expand source locales to minimum namespace coverage:
  - `npm run i18n:expand`
- Extract hardcoded strings: `npm run i18n:extract`
- Export source strings for translators: `npm run i18n:export`
- Validate key parity/placeholders: `npm run i18n:validate`
- Run i18n tests (coverage + placeholder quality):
  - `npm run i18n:test`
