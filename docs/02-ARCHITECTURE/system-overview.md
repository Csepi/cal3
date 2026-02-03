# System Overview

Last updated: 2026-02-03

[Back](./README.md)

Cal3 combines a React frontend with a NestJS backend and relational database storage. Core capabilities include calendar management, reservations, automation, and integrations.

## Operational Notes
Requests move from frontend services into backend controllers, then through policy and validation layers before domain services execute logic.

## Guidance
Keeping these boundaries clear is essential for maintainability and safe refactoring.
