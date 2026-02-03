# System Overview

Last updated: 2026-02-03

[‹ Architecture](./README.md)

`	ext
React Frontend -> NestJS API -> TypeORM -> PostgreSQL/Azure SQL
                      |-> OAuth Providers (Google/Microsoft)
                      |-> Notification/Agent Integrations
`

## Design Goals
- Strong typing and API contracts
- Modular backend architecture
- Clear separation of concerns
- Cloud-friendly deployment