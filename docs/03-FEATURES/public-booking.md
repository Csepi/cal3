# Public Booking

Last updated: 2026-02-03

[Back](./README.md)

Public booking allows external users to create reservations through shared links without full platform login.

## Operational Notes
Input validation, rate limiting, and request tracing are essential because these endpoints are externally exposed.

## Guidance
Keep public flows simple for users while preserving internal policy controls and auditability.
