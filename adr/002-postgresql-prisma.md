<a id="adr-002"></a>
# ADR-002 — PostgreSQL und Prisma

**Status:** Accepted\
**Datum:** 2026-09-29

## Kontext

Mehrere Berater müssen mit Termin, Belegungen und Versandaufträgen konsistent gespeichert werden.

Anforderungstreiber: NFR-CON-01, NFR-CON-03. Auflösbare Definitionen im [ID-Register](../docs/ID-REGISTRY.md).

## Entscheidung

PostgreSQL ist maßgeblicher Datenspeicher. Prisma unterstützt Standardzugriffe und Migrationen; spezielle Constraints und Sperren werden in kontrollierten SQL-Migrationen abgebildet.

## Betrachtete Alternativen

Dokumentdatenbanken erschweren relationale Invarianten. Reiner ORM-Schutz ohne Datenbankconstraints verhindert Konkurrenzfehler nicht.

## Konsequenzen

Separater DB-Betrieb und PostgreSQL-spezifische Migrationen; dafür Transaktionen und harte Überlappungssicherung. Migrationstests müssen die DB-Constraints mitprüfen.

## Nachweis und Änderungsregel

Konkretisierung: [Architektur](../docs/arch/A05-building-block-view.md). Geplante Nachweise: [Rückverfolgbarkeit](../docs/TRACEABILITY.md). Noch kein Implementierungsnachweis. Änderungen an dieser Entscheidung erhalten eine neue ADR mit expliziter Ablösung; die bisherige Begründung bleibt erhalten.

[ADR-Index](README.md)

Definitionslinks: [NFR-CON-01](../docs/spec/N1-nichtfunktional.md#nfr-con-01), [NFR-CON-03](../docs/spec/N1-nichtfunktional.md#nfr-con-03).
