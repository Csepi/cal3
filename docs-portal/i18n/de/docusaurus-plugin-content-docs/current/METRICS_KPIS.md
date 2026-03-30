# Dokumentationsmetriken und KPIs {#documentation-metrics-and-kpis}

## Kernkennzahlen {#core-metrics}

- Am häufigsten aufgerufene Seiten (Top 20 wöchentlich/monatlich).
- Am wenigsten aufgerufene Seiten (Identifizierung von Auffindbarkeitsproblemen).
- Sucherfolgsrate (`search -> click` Conversion).
- Anzahl der Abfragen ohne Ergebnis.
- Durchschnittliche Verweildauer auf der Seite nach Kategorie.
- Verhältnis von hilfreich zu nicht hilfreich.

## Operative KPIs {#operational-kpis}

- Dokumentationszustandsbewertung (gewichteter Index):
  - 30 % Linkintegrität
  - 25 % Vollständigkeit der Metadaten
  - 20 % Frische (letztes aktualisiertes Alter)
  - 15 % Feedback-Stimmung
  - 10 % Sucherfolg
- Zeit, Informationen zu finden (Ziel: `< 2 Minuten` für Top-Aufgaben).
- Anzahl defekter Links (Ziel: 0).
- Seiten ohne Aktualisierung in den letzten 180 Tagen (Ziel: `< 10 %` der kanonischen Seiten).

## Dashboard-Eingaben {#dashboard-inputs}

- Google Analytics-Seitenaufrufe und -Engagement.
- Such-Plugin-Analyse (lokal oder Algolia, je nach Bereitstellung).
- Feedback-Button-Ereignisse (`docs_feedback`).
- CI-QA-Prüfungsausgaben.

## Trittfrequenz melden {#reporting-cadence}

- Wöchentlich: Top-Seiten, fehlgeschlagene Suchanfragen, Feedback-Deltas.
- Monatlich: KPI-Trendbericht und Priorisierung von Inhaltslücken.
- Vierteljährlich: Prüfung der strategischen Dokumente und Strukturüberprüfung.
