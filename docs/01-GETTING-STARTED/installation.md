# Installation

Last updated: 2026-02-03

[‹ Getting Started](./README.md)

## Option 1: Node.js + Local DB
1. Clone repository
2. Install dependencies
3. Create and configure ackend-nestjs/.env
4. Start backend and frontend

`ash
git clone <repo>
cd cal3
npm install
cd backend-nestjs && npm install
cd ../frontend && npm install
`

## Option 2: Docker (single service)
- Build and run each service container separately.

## Option 3: Docker Compose (full stack)
- Use Compose to run frontend + backend + database together.

## Verification
- Backend reachable on http://localhost:8081
- Frontend reachable on http://localhost:8080
- Successful login and event creation

## Common Install Issues
- DB connection refused -> verify DB host/port
- Frontend cannot call backend -> verify runtime config and CORS
- OAuth callback mismatch -> update callback URLs in env