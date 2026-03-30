---
title: "Compliance API"
description: "Codegestützte Referenz für Datenschutzzugriff, Exporte, Anfragen von Datensubjekten, Einwilligungsaktualisierungen und Richtlinienakzeptanz."
category: "Entwickler"
audience: "Entwickler"
difficulty: "Fortgeschritten"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./user-api.md
  - ./personal-logs-api.md
tags: [primecal, api, compliance, privacy, consents]
---

# Compliance API {#compliance-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Datenschutz und Compliance</p>
  <h1 class="pc-guide-hero__title">Persönliche Daten exportieren, Anfragen an betroffene Personen erstellen und Einwilligungsstatus verwalten</h1>
  <p class="pc-guide-hero__lead">
    Diese Routen führen zurück zum benutzerseitigen Datenschutzcenter. Sie sind auf den authentifizierten Benutzer beschränkt und
    Schließen Sie die Administrator-Compliance-Oberfläche absichtlich aus.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT oder Benutzer API Schlüssel</span>
    <span class="pc-guide-chip">Zugriff und Export im DSGVO-Stil</span>
    <span class="pc-guide-chip">Zustimmungsstatus</span>
    <span class="pc-guide-chip">Richtlinienversionierung</span>
  </div>
</div>

## Quelle {#source}

- Controller: `backend-nestjs/src/compliance/compliance.controller.ts`
- DTOs: `backend-nestjs/src/compliance/dto/compliance.dto.ts`

## Authentifizierung und Berechtigungen {#authentication-and-permissions}

- Alle Routen auf dieser Seite erfordern eine Authentifizierung.
- Jede Route ist auf den authentifizierten Benutzer beschränkt.
- Admin-Compliance-Routen unter `/api/admin/compliance/*` fallen ausdrücklich nicht in den Geltungsbereich dieser Referenz.

## Endpunktreferenz {#endpoint-reference}

| Methode | Pfad | Zweck | Anfrage oder Anfrage | Auth | Quelle |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/compliance/me/privacy/access` | Erstellen Sie den Datenschutzzugriffsbericht. | Keine | JWT oder Benutzerschlüssel API | `compliance/compliance.controller.ts` |
| `GET` | `/api/compliance/me/privacy/export` | Exportieren Sie die persönlichen Daten des Benutzers. | Keine | JWT oder Benutzerschlüssel API | `compliance/compliance.controller.ts` |
| `POST` | `/api/compliance/me/privacy/requests` | Erstellen Sie eine Anfrage für eine betroffene Person. | Körper: `requestType,reason,confirmEmail` | JWT oder Benutzerschlüssel API | `compliance/compliance.controller.ts` |
| `GET` | `/api/compliance/me/privacy/requests` | Listen Sie die Anfragen der betroffenen Person des Benutzers auf. | Abfrage: `statuses,requestTypes,search,offset,limit` | JWT oder Benutzerschlüssel API | `compliance/compliance.controller.ts` |
| `GET` | `/api/compliance/me/privacy/consents` | Listen Sie aktuelle Einwilligungsentscheidungen auf. | Keine | JWT oder Benutzerschlüssel API | `compliance/compliance.controller.ts` |
| `PUT` | `/api/compliance/me/privacy/consents/:consentType` | Fügen Sie eine Einwilligungsentscheidung hinzu. | Pfad: `consentType`, Text: `decision,policyVersion,source,metadata` | JWT oder Benutzerschlüssel API | `compliance/compliance.controller.ts` |
| `POST` | `/api/compliance/me/privacy/policy-acceptance` | Akzeptieren Sie eine Version der Datenschutzrichtlinie. | Körper: `version` | JWT oder Benutzerschlüssel API | `compliance/compliance.controller.ts` |

## Fordern Sie Formen an {#request-shapes}

### Anfragen von betroffenen Personen {#data-subject-requests}

`CreateDataSubjectRequestDto`

- `requestType`: erforderliche Enumeration `access|export|delete`
- `reason`: optionale Zeichenfolge, maximal 1000 Zeichen
- `confirmEmail`: optionale Zeichenfolge, Kleinbuchstaben, maximal 254 Zeichen

`DataSubjectRequestQueryDto`

- `statuses`: optionales String-Array, durch Kommas getrennte Werte werden unterstützt
- `requestTypes`: optionales String-Array, durch Kommas getrennte Werte werden unterstützt
- `search`: optionale Zeichenfolge, maximal 120 Zeichen
- `offset`: optionaler int `>= 0`
- `limit`: optionaler int `1..500`

### Einwilligungen {#consents}

`UpsertConsentDto`

- `decision`: erforderlich `accepted|revoked`
- `policyVersion`: erforderliche Zeichenfolge, maximal 64 Zeichen
- `source`: optionale Zeichenfolge, maximal 64 Zeichen
- `metadata`: optionales Objekt

Aktuelle Einwilligungstypen im Code verfügbar gemacht:

- `privacy_policy`
- `terms_of_service`
- `marketing_email`
- `data_processing`
- `cookie_analytics`

### Richtlinienakzeptanz {#policy-acceptance}

- `AcceptPrivacyPolicyDto.version`: erforderliche Zeichenfolge, maximal 64 Zeichen

## Beispielanrufe {#example-calls}

### Erstellen Sie eine Exportanfrage {#create-an-export-request}

```bash
curl -X POST "$PRIMECAL_API/api/compliance/me/privacy/requests" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requestType": "export",
    "reason": "Personal archive"
  }'
```

### Aktualisieren Sie eine Einwilligungsentscheidung {#update-a-consent-decision}

```bash
curl -X PUT "$PRIMECAL_API/api/compliance/me/privacy/consents/marketing_email" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "revoked",
    "policyVersion": "2026-03",
    "source": "privacy-center"
  }'
```

### Akzeptieren Sie die aktuelle Richtlinienversion {#accept-the-current-policy-version}

```bash
curl -X POST "$PRIMECAL_API/api/compliance/me/privacy/policy-acceptance" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "2026-03"
  }'
```

## Hinweise zu Reaktion und Verhalten {#response-and-behavior-notes}

- Zugriffs- und Exportrouten generieren benutzerbezogene Datenschutzberichte.
- Einwilligungsänderungen zeichnen zusätzliche Metadaten wie Quelle, IP und Benutzeragent in der Serviceschicht auf.
- Die Auflistung der Anfragen betroffener Personen gibt nur die eigenen Anfragen des aktuellen Benutzers zurück.

## Best Practices {#best-practices}

- Verwenden Sie überall explizite `policyVersion`-Werte, anstatt die Zustimmung als einfachen booleschen Wert zu modellieren.
- Koppeln Sie Compliance-Aktionen mit [`Personal Logs API`](./personal-logs-api.md) in Datenschutzcenter-Benutzeroberflächen.
- Erfordern Sie einen expliziten Bestätigungsschritt, bevor Sie `requestType=delete` von einem Client senden.
- Halten Sie `confirmEmail` an der aktuellen E-Mail-Adresse des authentifizierten Benutzers ausgerichtet, wenn die Benutzeroberfläche um eine erneute Bestätigung bittet.
