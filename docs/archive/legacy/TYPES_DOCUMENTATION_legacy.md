# Type System Guide

This document is the single entry point for application types and replaces scattered guidance.

## Type Hierarchy

```text
backend-nestjs/src/types/shared.ts
├─ api.types.ts
│  └─ wraps common/responses response envelope types
├─ domain.types.ts
│  └─ canonical business/domain models and enums
├─ dto.types.ts
│  └─ Create*/Update* request contracts + validation result shapes
├─ pagination.types.ts
│  └─ pagination query/payload contracts
├─ auth.types.ts
│  └─ JwtPayload + RequestWithUser + AuthCredentials
└─ config.types.ts
   └─ AppConfig + DatabaseConfig + OAuthConfig

frontend/src/types/index.ts
├─ domain.ts
├─ api.ts
├─ hooks.ts
├─ ui.ts
└─ store.ts
```

## Which Types To Use Where

- **Domain/business logic**: `backend-nestjs/src/types/domain.types.ts`
- **Controller/service request contracts**: `backend-nestjs/src/types/dto.types.ts`
- **Auth guard/strategy/request user shape**: `backend-nestjs/src/types/auth.types.ts`
- **Paging endpoints and list queries**: `backend-nestjs/src/types/pagination.types.ts`
- **Cross-module backend imports**: `backend-nestjs/src/types/shared.ts`
- **Frontend model and API usage**: `frontend/src/types/index.ts`

## Common Patterns

- Use `CreateRequest<T>` / `UpdateRequest<T>` from `dto.types.ts` for CRUD payload templates.
- Use `ApiResponse<T>` and `PaginatedResponse<T>` from centralized API types for endpoint contracts.
- Prefer domain enums over free-form strings (`UserRole`, `CalendarVisibility`, `ReservationStatus`, etc.).
- Use readonly fields on immutable server-returned model properties.

## How To Extend

1. Add/modify a domain model in `domain.types.ts`.
2. Add matching Create/Update request contracts in `dto.types.ts`.
3. Export from `shared.ts` (backend) and `index.ts` (frontend).
4. Update consuming services/components to import from centralized modules.
5. Run `npx tsc --noEmit` for both backend and frontend.

## Migration Example

### Before (scattered local interface)

```ts
interface Organization {
  id: number;
  name: string;
  color: string;
}
```

### After (centralized import)

```ts
import type { Organization } from '../types';
```

## Files Added For This Refactor

- `backend-nestjs/src/types/domain.types.ts`
- `backend-nestjs/src/types/api.types.ts`
- `backend-nestjs/src/types/dto.types.ts`
- `backend-nestjs/src/types/pagination.types.ts`
- `backend-nestjs/src/types/auth.types.ts`
- `backend-nestjs/src/types/config.types.ts`
- `backend-nestjs/src/types/shared.ts`
- `frontend/src/types/domain.ts`
- `frontend/src/types/ui.ts`
- `frontend/src/types/hooks.ts`
- `frontend/src/types/store.ts`
