# Installation

Last updated: 2026-02-03

[Back](./README.md)

Installation supports local Node.js workflows, isolated Docker workflows, and full Docker Compose stacks. The best option depends on whether you are coding, debugging, or validating release behavior.

## Operational Notes
For active development, Node.js + local database is usually fastest. Compose is best for environment parity and integration testing because service wiring is explicit and repeatable.

## Guidance
Always verify login, calendar creation, and event CRUD after install. If these fail, investigate environment variable wiring and backend connectivity first.
