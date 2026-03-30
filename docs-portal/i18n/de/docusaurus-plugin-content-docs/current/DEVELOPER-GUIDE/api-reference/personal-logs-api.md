---
title: "Persönliche Protokolle API"
description: "Codegestützte Referenz für den persönlichen Audit-Feed und die zusammenfassenden Endpunkte des angemeldeten Benutzers."
category: "Entwickler"
audience: "Entwickler"
difficulty: "Fortgeschritten"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./user-api.md
  - ./compliance-api.md
tags: [primecal, api, audit, personal-logs]
---

# Persönliche Protokolle API {#personal-logs-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Persönliche Protokolle und Prüfverlauf</p>
  <h1 class="pc-guide-hero__title">Fragen Sie den für den Benutzer sichtbaren Audit-Trail ab, ohne Admin-Endpunkte zu berühren</h1>
  <p class="pc-guide-hero__lead">
    PrimeCal stellt eine persönliche Prüfoberfläche für den angemeldeten Benutzer bereit. Diese Endpunkte bieten sowohl a
    filterbarer Ereignis-Feed und eine aggregierte Zusammenfassung.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT oder Benutzer API Schlüssel</span>
    <span class="pc-guide-chip">Filterbarer Audit-Feed</span>
    <span class="pc-guide-chip">Zusammenfassungsansicht</span>
  </div>
</div>

## Quelle {#source}

- Controller: `backend-nestjs/src/users/users.controller.ts`
- DTO: `backend-nestjs/src/users/dto/personal-audit.query.dto.ts`

## Authentifizierung und Berechtigungen {#authentication-and-permissions}

- Beide Routen erfordern eine Authentifizierung.
- Die Ergebnisse beziehen sich auf den aktuellen Benutzer.
- Diese Seite schließt absichtlich Administrator- oder benutzerübergreifende Audit-APIs aus.

## Endpunktreferenz {#endpoint-reference}

| Methode | Pfad | Zweck | Anfrage oder Anfrage | Auth | Quelle |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/users/me/audit` | Listen Sie den persönlichen Audit-Feed auf. | Abfrage: `categories,outcomes,severities,actions,search,from,to,limit,offset,includeAutomation` | JWT oder Benutzerschlüssel API | `users/users.controller.ts` |
| `GET` | `/api/users/me/audit/summary` | Geben Sie die aggregierte Audit-Zusammenfassung zurück. | Abfrage: identisch mit Feed-Endpunkt | JWT oder Benutzerschlüssel API | `users/users.controller.ts` |

## Abfrageform {#query-shape}

`PersonalAuditQueryDto`

- `categories`: optionales String-Array, durch Kommas getrennte Werte werden unterstützt
- `outcomes`: optionales String-Array, durch Kommas getrennte Werte werden unterstützt
- `severities`: optionales String-Array, durch Kommas getrennte Werte werden unterstützt
- `actions`: optionales String-Array, durch Kommas getrennte Werte werden unterstützt
- `search`: optionale Zeichenfolge
- `from`: optionale Zeichenfolge
- `to`: optionale Zeichenfolge
- `limit`: optionaler int `1..500`
- `offset`: optionaler int `>= 0`
- `includeAutomation`: optionaler boolescher Wert, Standard `true`

## Beispielanrufe {#example-calls}

### Lesen Sie aktuelle Audit-Ereignisse {#read-recent-audit-events}

```bash
curl "$PRIMECAL_API/api/users/me/audit?includeAutomation=true&actions=automation.rule.execute&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

### Lesen Sie die Zusammenfassung für einen Datumsbereich {#read-the-summary-for-a-date-range}

```bash
curl "$PRIMECAL_API/api/users/me/audit/summary?from=2026-03-22T00:00:00.000Z&to=2026-03-29T23:59:59.999Z" \
  -H "Authorization: Bearer $TOKEN"
```

## Hinweise zu Reaktion und Verhalten {#response-and-behavior-notes}

- Der Zusammenfassungsendpunkt verwendet den Feed-Dienst intern wieder und gibt nur `summary` zurück.
- `includeAutomation=true` ist der Schalter, der aus der Automatisierung stammende Datensätze in den Ergebnissatz zieht.
- Array-ähnliche Filter akzeptieren durch Kommas getrennte Abfragezeichenfolgen oder wiederholte Werte.

## Best Practices {#best-practices}

- Verwenden Sie die Feed-Route für detaillierte Zeitleisten-Benutzeroberflächen und die Zusammenfassungsroute für Diagramme oder KPI-Karten.
- Halten Sie `limit` für interaktive Ansichten angemessen klein und blättern Sie mit `offset` durch den Feed.
- Koppeln Sie diese Daten mit [`Compliance API`](./compliance-api.md) in den Datenschutzcenter-Erfahrungen, damit Benutzer sowohl den Verlauf als auch die Steuerelemente sehen können.
