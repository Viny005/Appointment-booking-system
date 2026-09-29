<a id="adr-007"></a>
# ADR-007 — Atomare Buchung und Kollisionsschutz

**Status:** Accepted (dokumentarische Baseline aus dem Archiv; zur Review)\
**Datum:** 2026-09-29

## Kontext

Zwei Kunden können denselben freien Slot gesehen haben; mehrere Teilnehmer verschärfen die Konkurrenz.

Anforderungstreiber: NFR-CON-01, NFR-CON-02, NFR-CON-03. Auflösbare Definitionen im [ID-Register](../docs/ID-REGISTRY.md).

## Entscheidung

Application sperrt alle beteiligten Profilzeilen in stabiler ID-Reihenfolge und liest danach Regeln/Belegungen neu. Auch Verfügbarkeits-, Service- und Relationsänderungen nehmen diese Profilsperren; globale Parameteränderungen nutzen eine gemeinsam koordinierte Policy-Sperre. Je bestätigtem Teilnehmer existiert eine Reservation mit halboffenem UTC-Zeitbereich. PostgreSQL-GiST-Exclusion-Constraint auf Profilgleichheit und Zeitüberlappung verhindert Überschneidung; erforderliche btree_gist-Unterstützung ist Deploymentvoraussetzung. Termin, Reservationen und Outbox committen gemeinsam.

## Betrachtete Alternativen

Nur Vorabprüfung ist rennanfällig. Nur globale Serialisierung begrenzt Durchsatz unnötig. Ausschließlich ORM-Validierung ist keine harte Sicherung.

## Konsequenzen

SQL-Migration nötig. Storno löscht Reservationen in derselben Transaktion; Umbuchung ersetzt sie atomar und prüft erwartete Terminversion. Einheitliche Sperrreihenfolge: Policy, Profile, Termin. Deadlock/Serialisierungsfehler begrenzt wiederholen, Constraintkonflikt als 409 zurückgeben. Idempotenz schützt Wiederholung nach unklarem Commit.

## Nachweis und Änderungsregel

Konkretisierung: [Architektur](../docs/arch/A08-cross-cutting-concepts.md). Geplante Nachweise: [Rückverfolgbarkeit](../docs/TRACEABILITY.md). Noch kein Implementierungsnachweis. Änderungen an dieser Entscheidung erhalten eine neue ADR mit expliziter Ablösung; die bisherige Begründung bleibt erhalten.

[ADR-Index](README.md)

Definitionslinks: [NFR-CON-01](../docs/spec/N1-nichtfunktional.md#nfr-con-01), [NFR-CON-02](../docs/spec/N1-nichtfunktional.md#nfr-con-02), [NFR-CON-03](../docs/spec/N1-nichtfunktional.md#nfr-con-03).
