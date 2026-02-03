# Database Schema

Last updated: 2026-02-03

[Back](./README.md)

The schema is centered around users, organizations, calendars, events, resources, reservations, and automation entities.

## Operational Notes
Relationships and indexes are designed for tenant-safe queries, date-range lookups, and permission-scoped access patterns.

## Guidance
Schema evolution must be migration-driven to maintain consistency across environments.
