# Authentication API

Last updated: 2026-02-03

[Back](./README.md)

Authentication endpoints handle login, refresh, logout, and session lifecycle concerns.

## Operational Notes
Requests should be validated with typed DTOs and policy checks before service execution.

## Guidance
Clients should branch behavior by error code and status rather than parsing text messages.
