---
title: Resource API
description: Code-backed reference for resource types, resources, color updates, public booking tokens, and deletion previews.
category: Developer
audience: Developer
difficulty: Advanced
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./organization-api.md
  - ./booking-api.md
tags: [primecal, api, resources, resource-types, booking]
---

# Resource API

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Resource Catalog</p>
  <h1 class="pc-guide-hero__title">Manage resource types, resources, color settings, and public booking tokens</h1>
  <p class="pc-guide-hero__lead">
    This page covers the authenticated resource surface: the reusable resource-type catalog and the
    concrete resources that can be reserved or published for booking.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT or user API key</span>
    <span class="pc-guide-chip">Resource types</span>
    <span class="pc-guide-chip">Public booking tokens</span>
    <span class="pc-guide-chip">Deletion previews</span>
  </div>
</div>

## Source

- Resources controller: `backend-nestjs/src/resources/resources.controller.ts`
- Resource types controller: `backend-nestjs/src/resource-types/resource-types.controller.ts`
- DTOs: `backend-nestjs/src/dto/resource.dto.ts`, `backend-nestjs/src/dto/resource-type.dto.ts`, `backend-nestjs/src/resources/dto/resource.query.dto.ts`, `backend-nestjs/src/resource-types/dto/resource-type.query.dto.ts`, `backend-nestjs/src/resource-types/dto/update-resource-type-color.dto.ts`

## Authentication and Permissions

- All routes on this page require authentication.
- Results are filtered to the resources and organizations the current user can access.
- Token and cascade operations rely on the resource access checks in the service and guard layers.

## Endpoint Reference

### Resource Types

| Method | Path | Purpose | Request or query | Auth | Source |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/resource-types` | Create a resource type. | Body: type fields | JWT or user API key | `resource-types/resource-types.controller.ts` |
| `GET` | `/api/resource-types` | List resource types. | Query: `organisationId` | JWT or user API key | `resource-types/resource-types.controller.ts` |
| `GET` | `/api/resource-types/:id` | Get one resource type. | Path: `id` | JWT or user API key | `resource-types/resource-types.controller.ts` |
| `PATCH` | `/api/resource-types/:id` | Update a resource type. | Path: `id`, body: partial type fields | JWT or user API key | `resource-types/resource-types.controller.ts` |
| `DELETE` | `/api/resource-types/:id` | Delete a resource type. | Path: `id` | JWT or user API key | `resource-types/resource-types.controller.ts` |
| `GET` | `/api/resource-types/:id/deletion-preview` | Preview deletion impact for a resource type. | Path: `id` | JWT or user API key | `resource-types/resource-types.controller.ts` |
| `DELETE` | `/api/resource-types/:id/cascade` | Cascade-delete a resource type and dependents. | Path: `id` | JWT or user API key | `resource-types/resource-types.controller.ts` |
| `PATCH` | `/api/resource-types/:id/color` | Update only the resource-type color. | Path: `id`, body: `color` | JWT or user API key | `resource-types/resource-types.controller.ts` |

### Resources

| Method | Path | Purpose | Request or query | Auth | Source |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/resources` | Create a resource. | Body: `name,description,capacity,resourceTypeId,managedById` | JWT or user API key | `resources/resources.controller.ts` |
| `GET` | `/api/resources` | List resources. | Query: `resourceTypeId` | JWT or user API key | `resources/resources.controller.ts` |
| `GET` | `/api/resources/:id` | Get one resource. | Path: `id` | JWT or user API key | `resources/resources.controller.ts` |
| `PATCH` | `/api/resources/:id` | Update a resource. | Path: `id`, body: partial resource fields | JWT or user API key | `resources/resources.controller.ts` |
| `DELETE` | `/api/resources/:id` | Delete a resource. | Path: `id` | JWT or user API key | `resources/resources.controller.ts` |
| `GET` | `/api/resources/:id/deletion-preview` | Preview deletion impact for a resource. | Path: `id` | JWT or user API key | `resources/resources.controller.ts` |
| `DELETE` | `/api/resources/:id/cascade` | Cascade-delete a resource and dependents. | Path: `id` | JWT or user API key | `resources/resources.controller.ts` |
| `GET` | `/api/resources/:id/public-token` | Read the public booking token. | Path: `id` | JWT or user API key | `resources/resources.controller.ts` |
| `POST` | `/api/resources/:id/regenerate-token` | Regenerate the public booking token. | Path: `id` | JWT or user API key | `resources/resources.controller.ts` |

## Request Shapes

### Resource types

`CreateResourceTypeDto` and `UpdateResourceTypeDto`

- `name`: required on create
- `description`: optional string
- `minBookingDuration`: optional int, minimum `1`
- `bufferTime`: optional int, minimum `0`
- `customerInfoFields`: optional string array
- `waitlistEnabled`: optional boolean
- `recurringEnabled`: optional boolean
- `color`: optional string
- `icon`: optional string
- `organisationId`: required on create
- `isActive`: update-only optional boolean

Queries and focused updates:

- `ResourceTypeListQueryDto.organisationId`: optional int `>= 1`
- `UpdateResourceTypeColorDto.color`: required color string

### Resources

`CreateResourceDto` and `UpdateResourceDto`

- `name`: required on create
- `description`: optional string
- `capacity`: optional int, minimum `1`
- `resourceTypeId`: required on create
- `managedById`: optional int
- `isActive`: update-only optional boolean

Queries:

- `ResourceListQueryDto.resourceTypeId`: optional int `>= 1`

## Example Calls

### Create a resource type

```bash
curl -X POST "$PRIMECAL_API/api/resource-types" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Meeting Room",
    "organisationId": 12,
    "minBookingDuration": 30,
    "bufferTime": 15,
    "color": "#0ea5e9"
  }'
```

### Create a resource

```bash
curl -X POST "$PRIMECAL_API/api/resources" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Family Car",
    "resourceTypeId": 3,
    "capacity": 5
  }'
```

### Regenerate a public booking token

```bash
curl -X POST "$PRIMECAL_API/api/resources/21/regenerate-token" \
  -H "Authorization: Bearer $TOKEN"
```

## Response and Behavior Notes

- Public-token routes can return both the raw token and a frontend-friendly booking URL.
- Color cascade behavior exists at the organization layer and color-only updates exist at the resource-type layer.
- Both resource and resource-type deletion-preview routes should be used before cascade deletion in admin-style UIs.

## Best Practices

- Create the resource type before creating resources that depend on it.
- Treat token regeneration as destructive for any previously shared public links.
- Keep resource-type configuration stable and use resource records for the frequently changing real-world inventory.
- Use deletion previews before any cascade operation that might affect live reservations.
