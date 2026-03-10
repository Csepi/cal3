# Adding a New Language

## 1. Frontend Locale Files

Create:

- `frontend/src/locales/<lang>/common.json`
- `frontend/src/locales/<lang>/auth.json`
- `frontend/src/locales/<lang>/calendar.json`
- `frontend/src/locales/<lang>/booking.json`
- `frontend/src/locales/<lang>/settings.json`
- `frontend/src/locales/<lang>/admin.json`
- `frontend/src/locales/<lang>/automation.json`
- `frontend/src/locales/<lang>/errors.json`
- `frontend/src/locales/<lang>/validation.json`
- `frontend/src/locales/<lang>/emails.json`
- `frontend/src/locales/<lang>/notifications.json`
- `frontend/src/locales/<lang>/mobile.json`

Then update `frontend/src/i18n/types.ts`:

- add the language code to `SUPPORTED_LANGUAGES`

## 2. Backend Locale Files

Create:

- `backend-nestjs/src/i18n/<lang>/auth.json`
- `backend-nestjs/src/i18n/<lang>/validation.json`
- `backend-nestjs/src/i18n/<lang>/calendar.json`
- `backend-nestjs/src/i18n/<lang>/booking.json`
- `backend-nestjs/src/i18n/<lang>/email.json`
- `backend-nestjs/src/i18n/<lang>/notifications.json`
- `backend-nestjs/src/i18n/<lang>/errors.json`
- `backend-nestjs/src/i18n/<lang>/success.json`

## 3. Database Validation

Extend language enum validation (DTOs/middleware) to include the new language.

## 4. Android Native Strings

Create:

- `frontend/android/app/src/main/res/values-<lang>/strings.xml`

## 5. Run Validation

```bash
npm run i18n:validate
npm run i18n:export
```

