---
title: Organization API
description: Code-backed reference for non-admin organization discovery, membership, color management, and reservation-calendar admin helpers.
category: Developer
audience: Developer
difficulty: Advanced
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./resource-api.md
  - ./booking-api.md
tags: [primecal, api, organizations, sharing, roles]
---

# Organization API

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Organizations and Membership</p>
  <h1 class="pc-guide-hero__title">List accessible organizations, manage members, and read organization-admin state</h1>
  <p class="pc-guide-hero__lead">
    This page documents the non-admin organization surface. It excludes the admin-only organization
    create and delete routes and calls out the overlapping membership endpoints that exist in two controllers.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT or user API key</span>
    <span class="pc-guide-chip">RBAC and org guards</span>
    <span class="pc-guide-chip">Membership management</span>
    <span class="pc-guide-chip">Deletion preview</span>
  </div>
</div>

## Source

- Main controller: `backend-nestjs/src/organisations/organisations.controller.ts`
- Org admin controller: `backend-nestjs/src/organisations/organisation-admin.controller.ts`
- DTOs: `backend-nestjs/src/dto/organisation.dto.ts`, `backend-nestjs/src/dto/organisation-user.dto.ts`, `backend-nestjs/src/organisations/dto/update-organisation-color.dto.ts`

## Authentication and Permissions

- All routes on this page require authentication.
- The main controller uses `JwtAuthGuard` plus `RbacAuthorizationGuard`.
- Additional route-level enforcement uses `OrganisationOwnershipGuard`, `OrganisationAdminGuard`, and organization permission decorators.
- Admin-only routes excluded from this page:
  - `POST /api/organisations`
  - `DELETE /api/organisations/:id`
  - `POST /api/organisations/:id/admins`
  - `DELETE /api/organisations/:id/admins/:userId`

Important source note:

- `POST /api/organisations/:id/users` and `DELETE /api/organisations/:id/users/:userId` are each defined twice, once in `organisations.controller.ts` and again in `organisation-admin.controller.ts`, with different guards and response shapes.

## Endpoint Reference

### Main Organization Surface

| Method | Path | Purpose | Request or query | Auth | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/organisations` | List organizations accessible to the current user. | None | JWT or user API key | `organisations/organisations.controller.ts` |
| `GET` | `/api/organisations/:id` | Get one accessible organization. | Path: `id` | JWT or user API key | `organisations/organisations.controller.ts` |
| `PATCH` | `/api/organisations/:id` | Update organization profile fields. | Path: `id`, body: profile fields | JWT or user API key | `organisations/organisations.controller.ts` |
| `POST` | `/api/organisations/:id/users` | Assign a user to the organization. | Path: `id`, body: `userId` | JWT or user API key | `organisations/organisations.controller.ts` |
| `DELETE` | `/api/organisations/:id/users/:userId` | Remove a user from the organization. | Path: `id,userId` | JWT or user API key | `organisations/organisations.controller.ts` |
| `POST` | `/api/organisations/:id/users/assign` | Assign a user with an explicit role. | Path: `id`, body: `userId,role,assignedById` | JWT or user API key | `organisations/organisations.controller.ts` |
| `GET` | `/api/organisations/:id/users/list` | List organization users and roles. | Path: `id` | JWT or user API key | `organisations/organisations.controller.ts` |
| `PATCH` | `/api/organisations/:id/users/:userId/role` | Update a member role. | Path: `id,userId`, body: `role` | JWT or user API key | `organisations/organisations.controller.ts` |
| `DELETE` | `/api/organisations/:id/users/:userId/remove` | Remove a member through the alternate removal path. | Path: `id,userId` | JWT or user API key | `organisations/organisations.controller.ts` |
| `GET` | `/api/organisations/:id/deletion-preview` | Preview cascade deletion impact. | Path: `id` | JWT or user API key | `organisations/organisations.controller.ts` |
| `DELETE` | `/api/organisations/:id/cascade` | Cascade-delete organization-owned data. | Path: `id` | JWT or user API key | `organisations/organisations.controller.ts` |
| `PATCH` | `/api/organisations/:id/color` | Update organization color. | Path: `id`, body: `color,cascadeToResourceTypes` | JWT or user API key | `organisations/organisations.controller.ts` |

### Organization Admin Helper Surface

| Method | Path | Purpose | Request or query | Auth | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/organisations/:id/admins` | List organization admins. | Path: `id` | JWT or user API key | `organisations/organisation-admin.controller.ts` |
| `POST` | `/api/organisations/:id/users` | Add a user to the organization. | Path: `id`, body: `userId` | JWT or user API key | `organisations/organisation-admin.controller.ts` |
| `DELETE` | `/api/organisations/:id/users/:userId` | Remove a user from the organization. | Path: `id,userId` | JWT or user API key | `organisations/organisation-admin.controller.ts` |
| `GET` | `/api/organisations/:id/users` | List organization users. | Path: `id` | JWT or user API key | `organisations/organisation-admin.controller.ts` |
| `GET` | `/api/organisations/admin-roles` | List organizations where the current user is an admin. | None | JWT or user API key | `organisations/organisation-admin.controller.ts` |
| `GET` | `/api/organisations/:id/admin-status` | Test whether the current user is an organization admin. | Path: `id` | JWT or user API key | `organisations/organisation-admin.controller.ts` |

## Request Shapes

### Organization profile

`CreateOrganisationDto` and `UpdateOrganisationDto` in `backend-nestjs/src/dto/organisation.dto.ts`

- `name`: required on create
- `description`: optional string
- `address`: optional string
- `phone`: optional string
- `email`: optional email
- `isActive`: update-only optional boolean

### Membership

- `AssignUserDto.userId`: required number
- `AssignOrganisationUserDto.userId`: required number
- `AssignOrganisationUserDto.role`: required `OrganisationRoleType`
- `AssignOrganisationUserDto.assignedById`: optional number
- `UpdateOrganisationUserRoleDto.role`: required `OrganisationRoleType`

### Color

`UpdateOrganisationColorDto`

- `color`: required hex color, `#rgb` or `#rrggbb`
- `cascadeToResourceTypes`: optional boolean

## Example Calls

### List accessible organizations

```bash
curl "$PRIMECAL_API/api/organisations" \
  -H "Authorization: Bearer $TOKEN"
```

### Assign a user with a role

```bash
curl -X POST "$PRIMECAL_API/api/organisations/12/users/assign" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 42,
    "role": "ADMIN"
  }'
```

### Update the organization color

```bash
curl -X PATCH "$PRIMECAL_API/api/organisations/12/color" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "color": "#14b8a6",
    "cascadeToResourceTypes": true
  }'
```

## Response and Behavior Notes

- `GET /api/organisations` returns only organizations the current user can access.
- Some routes in the organization-admin controller return `{ message, data }` envelopes instead of plain entities.
- `GET /api/organisations/:id/deletion-preview` should be used before destructive cascade operations.

## Best Practices

- Treat the duplicate `:id/users` routes as overlapping surfaces and standardize your client on one path family.
- Use `GET /api/organisations/:id/users/list` or `GET /api/organisations/:id/users` consistently instead of mixing both in the same client.
- Always preview cascade deletion before calling `DELETE /api/organisations/:id/cascade`.
- Prefer role-specific membership updates with `/users/assign` and `/users/:userId/role` instead of remove-and-readd workflows.
