---
title: "Szervezet API"
description: "Kódalapú hivatkozás a nem rendszergazdai szervezetek felfedezéséhez, tagsághoz, színkezeléshez és foglalási naptár rendszergazdai segítőkhöz."
category: "Fejlesztő"
audience: "Fejlesztő"
difficulty: "Haladó"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./resource-api.md
  - ./booking-api.md
tags: [primecal, api, organizations, sharing, roles]
---

# Szervezet API {#organization-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Szervezetek és tagság</p>
  <h1 class="pc-guide-hero__title">A hozzáférhető szervezetek listázása, a tagok kezelése és a szervezet-adminisztrátori állapot olvasása</h1>
  <p class="pc-guide-hero__lead">
    Ez az oldal a nem rendszergazdai szervezet felületét dokumentálja. Kizárja a csak adminisztrátori szervezetet
    útvonalak létrehozása és törlése, valamint a két vezérlőben létező átfedő tagsági végpontok meghívása.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT vagy felhasználói API kulcs</span>
    <span class="pc-guide-chip">RBAC és szervezeti őrök</span>
    <span class="pc-guide-chip">Tagságkezelés</span>
    <span class="pc-guide-chip">Törlési előnézet</span>
  </div>
</div>

## Forrás {#source}

- Fővezérlő: `backend-nestjs/src/organisations/organisations.controller.ts`
- Szervezeti adminisztrátori vezérlő: `backend-nestjs/src/organisations/organisation-admin.controller.ts`
- DTO-k: `backend-nestjs/src/dto/organisation.dto.ts`, `backend-nestjs/src/dto/organisation-user.dto.ts`, `backend-nestjs/src/organisations/dto/update-organisation-color.dto.ts`

## Hitelesítés és engedélyek {#authentication-and-permissions}

- Ezen az oldalon minden útvonal hitelesítést igényel.
- A fő vezérlő a `JwtAuthGuard` plusz `RbacAuthorizationGuard`-t használja.
- További útvonalszintű betartatás `OrganisationOwnershipGuard`, `OrganisationAdminGuard` és szervezeti engedély-dekorátorokat használ.
- Csak adminisztrátori útvonalak, amelyek nem szerepelnek ezen az oldalon:
  - `POST /api/organisations`
  - `DELETE /api/organisations/:id`
  - `POST /api/organisations/:id/admins`
  - `DELETE /api/organisations/:id/admins/:userId`

Fontos forrás megjegyzés:

- A `POST /api/organisations/:id/users` és a `DELETE /api/organisations/:id/users/:userId` kétszer van megadva, egyszer a `organisations.controller.ts`-ban, majd a `organisation-admin.controller.ts`-ban, különböző védőelemekkel és válaszformákkal.

## Végpont referencia {#endpoint-reference}

### Fő szervezeti felület {#main-organization-surface}

| módszer | Útvonal | Cél | Kérjen vagy érdeklődjön | Auth | Forrás |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/organisations` | Az aktuális felhasználó számára elérhető szervezetek listája. | Egyik sem | JWT vagy felhasználói API kulcs | `organisations/organisations.controller.ts` |
| `GET` | `/api/organisations/:id` | Szerezzen be egy elérhető szervezetet. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `organisations/organisations.controller.ts` |
| `PATCH` | `/api/organisations/:id` | Frissítse a szervezeti profil mezőit. | Elérési út: `id`, törzs: profilmezők | JWT vagy felhasználói API kulcs | `organisations/organisations.controller.ts` |
| `POST` | `/api/organisations/:id/users` | Rendeljen hozzá egy felhasználót a szervezethez. | Elérési út: `id`, törzs: `userId` | JWT vagy felhasználói API kulcs | `organisations/organisations.controller.ts` |
| `DELETE` | `/api/organisations/:id/users/:userId` | Felhasználó eltávolítása a szervezetből. | Elérési út: `id,userId` | JWT vagy felhasználói API kulcs | `organisations/organisations.controller.ts` |
| `POST` | `/api/organisations/:id/users/assign` | Rendeljen hozzá egy felhasználót kifejezett szerepkörrel. | Elérési út: `id`, törzs: `userId,role,assignedById` | JWT vagy felhasználói API kulcs | `organisations/organisations.controller.ts` |
| `GET` | `/api/organisations/:id/users/list` | Sorolja fel a szervezet felhasználóit és szerepköreit. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `organisations/organisations.controller.ts` |
| `PATCH` | `/api/organisations/:id/users/:userId/role` | Tagi szerepkör frissítése. | Elérési út: `id,userId`, törzs: `role` | JWT vagy felhasználói API kulcs | `organisations/organisations.controller.ts` |
| `DELETE` | `/api/organisations/:id/users/:userId/remove` | Távolítson el egy tagot az alternatív eltávolítási útvonalon keresztül. | Elérési út: `id,userId` | JWT vagy felhasználói API kulcs | `organisations/organisations.controller.ts` |
| `GET` | `/api/organisations/:id/deletion-preview` | A kaszkádtörlés hatásának előnézete. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `organisations/organisations.controller.ts` |
| `DELETE` | `/api/organisations/:id/cascade` | A szervezet tulajdonában lévő adatok lépcsőzetes törlése. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `organisations/organisations.controller.ts` |
| `PATCH` | `/api/organisations/:id/color` | Szervezeti szín frissítése. | Elérési út: `id`, törzs: `color,cascadeToResourceTypes` | JWT vagy felhasználói API kulcs | `organisations/organisations.controller.ts` |

### Szervezeti Admin Helper felület {#organization-admin-helper-surface}

| módszer | Útvonal | Cél | Kérjen vagy érdeklődjön | Auth | Forrás |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/organisations/:id/admins` | Szervezeti adminisztrátorok listázása. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `organisations/organisation-admin.controller.ts` |
| `POST` | `/api/organisations/:id/users` | Felhasználó hozzáadása a szervezethez. | Elérési út: `id`, törzs: `userId` | JWT vagy felhasználói API kulcs | `organisations/organisation-admin.controller.ts` |
| `DELETE` | `/api/organisations/:id/users/:userId` | Felhasználó eltávolítása a szervezetből. | Elérési út: `id,userId` | JWT vagy felhasználói API kulcs | `organisations/organisation-admin.controller.ts` |
| `GET` | `/api/organisations/:id/users` | Szervezeti felhasználók listázása. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `organisations/organisation-admin.controller.ts` |
| `GET` | `/api/organisations/admin-roles` | Sorolja fel azokat a szervezeteket, ahol a jelenlegi felhasználó rendszergazda. | Egyik sem | JWT vagy felhasználói API kulcs | `organisations/organisation-admin.controller.ts` |
| `GET` | `/api/organisations/:id/admin-status` | Tesztelje, hogy az aktuális felhasználó szervezeti adminisztrátor-e. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `organisations/organisation-admin.controller.ts` |

## Kérjen alakzatokat {#request-shapes}

### Szervezeti profil {#organization-profile}

`CreateOrganisationDto` és `UpdateOrganisationDto` a `backend-nestjs/src/dto/organisation.dto.ts`-ban

- `name`: létrehozáskor kötelező
- `description`: opcionális karakterlánc
- `address`: opcionális karakterlánc
- `phone`: opcionális karakterlánc
- `email`: opcionális e-mail
- `isActive`: csak frissíthető opcionális logikai érték

### Tagság {#membership}

- `AssignUserDto.userId`: szükséges szám
- `AssignOrganisationUserDto.userId`: szükséges szám
- `AssignOrganisationUserDto.role`: kötelező `OrganisationRoleType`
- `AssignOrganisationUserDto.assignedById`: opcionális szám
- `UpdateOrganisationUserRoleDto.role`: kötelező `OrganisationRoleType`

### Szín {#color}

`UpdateOrganisationColorDto`

- `color`: kötelező hexadecimális szín, `#rgb` vagy `#rrggbb`
- `cascadeToResourceTypes`: opcionális logikai érték

## Példahívások {#example-calls}

### Az elérhető szervezetek listája {#list-accessible-organizations}

```bash
curl "$PRIMECAL_API/api/organisations" \
  -H "Authorization: Bearer $TOKEN"
```

### Rendeljen hozzá egy felhasználót szerepkörrel {#assign-a-user-with-a-role}

```bash
curl -X POST "$PRIMECAL_API/api/organisations/12/users/assign" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 42,
    "role": "ADMIN"
  }'
```

### Frissítse a szervezet színét {#update-the-organization-color}

```bash
curl -X PATCH "$PRIMECAL_API/api/organisations/12/color" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "color": "#14b8a6",
    "cascadeToResourceTypes": true
  }'
```

## Válasz és viselkedés megjegyzések {#response-and-behavior-notes}

- `GET /api/organisations` csak azokat a szervezeteket adja vissza, amelyekhez az aktuális felhasználó hozzáférhet.
- A szervezet-admin vezérlő egyes útvonalai `{ message, data }` borítékot adnak vissza egyszerű entitások helyett.
- A `GET /api/organisations/:id/deletion-preview` destruktív kaszkádműveletek előtt használható.

## Legjobb gyakorlatok {#best-practices}

- Kezelje a duplikált `:id/users` útvonalakat átfedő felületekként, és szabványosítsa ügyfelét egy útvonalcsaládon.
- Használja következetesen a `GET /api/organisations/:id/users/list` vagy a `GET /api/organisations/:id/users`-t ahelyett, hogy ugyanazon a kliensen keverné a kettőt.
- A `DELETE /api/organisations/:id/cascade` hívása előtt mindig tekintse meg a kaszkádtörlés előnézetét.
- Az eltávolítási és olvasási munkafolyamatok helyett előnyben részesítse a szerepspecifikus tagsági frissítéseket a `/users/assign` és a `/users/:userId/role` használatával.
