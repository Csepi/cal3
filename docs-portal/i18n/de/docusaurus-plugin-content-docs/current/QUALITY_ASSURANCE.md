# Qualitätssicherung der Dokumentation {#documentation-quality-assurance}

## Automatisierte Kontrollen {#automated-checks}

- Link-Checker: `node scripts/docs/check-links.cjs`
- Metadatenprüfer: `node scripts/docs/check-metadata.cjs`
- Portal-Build-Validierung: `cd docs-portal && npm run build`

## Empfohlene CI-Pipeline {#recommended-ci-pipeline}

1. Führen Sie eine Markdown-Linkprüfung durch.
2. Führen Sie eine Metadatenvalidierung für kanonische Dokumentbereiche durch.
3. Erstellen Sie ein Dokumentenportal, um Rendering- und Weiterleitungsfehler zu erkennen.
4. Lassen Sie die Pipeline bei defekten Links oder fehlenden Metadaten fehlschlagen.

## Zeitplan für die Screenshot-Aktualisierung {#screenshot-refresh-schedule}

- Monatlich: Überprüfen Sie kritische Screenshots des Benutzerflusses.
- Vierteljährlich: Vollständiger Screenshot-Durchlauf für alle Bereiche der obersten Ebene.
- Releasebasiert: Aktualisieren Sie alle Screenshots, die von Funktionsänderungen betroffen sind.

## Vierteljährlicher Auditprozess {#quarterly-audit-process}

1. Führen Sie die Bestandsaufnahme und Duplikaterkennung erneut durch.
2. Überprüfen Sie archivierte Inhalte und verwerfen Sie veraltete Weiterleitungen.
3. Vergleichen Sie Suchfehler mit Support-Tickets.
4. Priorisieren Sie fehlende Dokumente basierend auf der Auswirkung auf die Nutzung.
