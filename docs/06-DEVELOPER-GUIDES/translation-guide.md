# Translation Guide

## Supported Languages

- English (`en`) - source language
- Hungarian (`hu`)
- German (`de`)
- French (`fr`)

## Style Rules

- Use formal address:
  - `hu`: formal professional style
  - `de`: formal `Sie`
  - `fr`: formal `vous`
- Keep placeholders unchanged:
  - `{{name}}`, `{{date}}`, `{{count}}`
- Keep HTML tags unchanged where present.
- Avoid translating user-generated values (event titles, organization names).

## Glossary

| English | Hungarian | German | French |
|---|---|---|---|
| Calendar | Naptár | Kalender | Calendrier |
| Event | Esemény | Termin | Événement |
| Booking | Foglalás | Buchung | Réservation |
| Reminder | Emlékeztető | Erinnerung | Rappel |
| Settings | Beállítások | Einstellungen | Paramètres |
| Notification | Értesítés | Benachrichtigung | Notification |

## File Conventions

- Frontend: `frontend/src/locales/{lang}/{namespace}.json`
- Backend: `backend-nestjs/src/i18n/{lang}/{namespace}.json`

Namespaces currently used:

- `common`
- `auth`
- `calendar`
- `booking`
- `settings`
- `admin`
- `automation`
- `errors`
- `validation`
- `emails`
- `notifications`
- `mobile` (frontend only)

## QA Checklist

- No missing keys in target locale.
- No empty translated values.
- Placeholder sets match source (`en`) exactly.
- UI labels fit in common breakpoints (desktop/mobile).

