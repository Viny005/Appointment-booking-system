<a id="adr-006"></a>
# ADR-006 — Transaktionale E-Mail-Outbox

**Status:** Accepted\
**Datum:** 2026-09-29

## Kontext

Mailausfälle dürfen bestätigte Buchungen nicht verlieren; ein Crash nach Commit darf Versandaufträge nicht vergessen.

Anforderungstreiber: AF-17, AF-18, NFR-PERF-02. Auflösbare Definitionen im [ID-Register](../docs/ID-REGISTRY.md).

## Entscheidung

Termin, Belegungen und Outbox werden in derselben DB-Transaktion gespeichert. Worker sendet nach Commit mit Lease, Retry und eindeutigen Auftragskeys.

## Betrachtete Alternativen

Synchroner Versand in Transaktion verlängert Sperren. Enqueue erst nach Commit lässt bei Crash eine Lücke.

## Konsequenzen

Worker und Überwachung erforderlich. At-least-once-Zustellung; Duplikate nach Provider-Timeout bleiben ohne dessen Idempotenz möglich. Geheimnisse in Outbox nur kurzlebig verschlüsselt.

## Nachweis und Änderungsregel

Konkretisierung: [Architektur](../docs/arch/A06-runtime-view.md). Geplante Nachweise: [Rückverfolgbarkeit](../docs/TRACEABILITY.md). Noch kein Implementierungsnachweis. Änderungen an dieser Entscheidung erhalten eine neue ADR mit expliziter Ablösung; die bisherige Begründung bleibt erhalten.

[ADR-Index](README.md)

Definitionslinks: [AF-17](../docs/spec/F3-anwendungsfunktionen.md#af-17), [AF-18](../docs/spec/F3-anwendungsfunktionen.md#af-18), [NFR-PERF-02](../docs/spec/N1-nichtfunktional.md#nfr-perf-02).
