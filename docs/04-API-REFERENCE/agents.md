# Agents API

Last updated: 2026-02-03

[Back](./README.md)

Agent endpoints expose metadata, action listings, and scoped execution surfaces.

## Operational Notes
Requests should be validated with typed DTOs and policy checks before service execution.

## Guidance
Clients should branch behavior by error code and status rather than parsing text messages.
