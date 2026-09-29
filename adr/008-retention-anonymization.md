<a id="adr-008"></a>
# ADR-008 — Historie und begrenzte PII-Aufbewahrung

**Status:** Accepted\
**Datum:** 2026-09-29

## Kontext

Historische Terminmetadaten sind nützlich, Kunden- und Gästedaten dürfen nicht unbegrenzt verbleiben.

Anforderungstreiber: CON-19, AF-22, NFR-PRIV-03. Auflösbare Definitionen im [ID-Register](../docs/ID-REGISTRY.md).

## Entscheidung

Fachliche Historie von Kontaktinformationen trennen; tägliche fristgesteuerte Bereinigung nach D2 einschließlich Outbox, Freitext und Tokens. 12/6 Monate sind Archivvorgaben zur Betreiberfreigabe.

## Betrachtete Alternativen

Unbegrenzte Vollhistorie erhöht Datenschutzrisiken. Vollständige Terminlöschung verliert organisatorische Nachvollziehbarkeit.

## Konsequenzen

Bereinigungsjobs, Backupfenster und Restore-Nachbereinigung nötig. Beraterreferenzen bleiben personenbezogen; es wird keine vollständige Anonymität des Gesamtdatensatzes behauptet.

## Nachweis und Änderungsregel

Konkretisierung: [Architektur](../docs/arch/A07-deployment-view.md). Geplante Nachweise: [Rückverfolgbarkeit](../docs/TRACEABILITY.md). Noch kein Implementierungsnachweis. Änderungen an dieser Entscheidung erhalten eine neue ADR mit expliziter Ablösung; die bisherige Begründung bleibt erhalten.

[ADR-Index](README.md)

Definitionslinks: [AF-22](../docs/spec/F3-anwendungsfunktionen.md#af-22), [CON-19](../docs/spec/P1-constraints.md#con-19), [NFR-PRIV-03](../docs/spec/N1-nichtfunktional.md#nfr-priv-03).

Die Architekturentscheidung zur konfigurierbaren Bereinigung ist Accepted. Die rechtliche Freigabe der konkreten Produktionsfristen 12/6 Monate ist davon getrennt und bleibt ein [Go-live blocker](../docs/OPEN-QUESTIONS.md). Entwicklung und Tests verwenden diese expliziten Standardwerte.
