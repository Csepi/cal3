# Environment Variables

Last updated: 2026-02-03

[Back](./README.md)

Environment variables drive runtime behavior for backend startup, authentication, database connections, and integration endpoints.

## Operational Notes
Configuration should be explicit per environment. Avoid hidden defaults for ports, JWT settings, database SSL, and pool limits because these directly affect runtime stability.

## Guidance
When debugging startup issues, compare actual loaded values against expected values before changing application code.
