# Backend Structure

Last updated: 2026-02-03

[‹ Architecture](./README.md)

## Main Modules
- Auth
- Calendars / Events / Sync
- Organisations / Resources / Reservations
- Tasks
- Automation
- Notifications
- Admin

## Common Layer
- common/guards, common/pipes, common/filters, common/interceptors
- common/services shared cross-module logic
- 	ypes/* centralized backend type contracts