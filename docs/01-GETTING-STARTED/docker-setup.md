# Docker Setup

Last updated: 2026-02-03

[‹ Getting Started](./README.md)

## Single Container
- Build backend and frontend images separately.

## Docker Compose
- Run full stack with one command.

`ash
docker compose up --build
`

## Ports
- Frontend: 8080
- Backend: 8081
- Database: engine-specific

## Troubleshooting
- Build cache issues -> rebuild without cache
- Port conflicts -> check local listeners