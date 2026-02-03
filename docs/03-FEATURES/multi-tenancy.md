# Multi-tenancy

Last updated: 2026-02-03

[Back](./README.md)

Multi-tenancy is implemented through organizations, memberships, and scoped permissions.

## Operational Notes
Every query and mutation path must enforce tenant boundaries so data is never leaked across organizations.

## Guidance
Centralized policy services reduce duplication and prevent inconsistent permission behavior.
