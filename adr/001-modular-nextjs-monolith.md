<a id="adr-001"></a>
# ADR-001 — Modularer Next.js-Full-Stack-Monolith

**Status:** Accepted\
**Datum:** 2026-09-29

## Kontext

Öffentliche Buchung und interne Verwaltung teilen Regeln, Daten und Rechte.

Anforderungstreiber: NFR-MNT-01, NFR-MNT-02. Auflösbare Definitionen im [ID-Register](../docs/ID-REGISTRY.md).

## Entscheidung

Next.js mit TypeScript als ein modulares Full-Stack-System; Domain bleibt von UI und Adaptern getrennt. Web und Hintergrundprozesse teilen das Anwendungspaket.

## Betrachtete Alternativen

Separate SPA/API erhöht Betriebs- und Vertragsaufwand. Microservices benötigen verteilte Konsistenz ohne belegten Nutzen.

## Konsequenzen

Gemeinsames Release und einfache Transaktionsgrenzen. Module können dennoch verkoppeln; Application-Ports und getrennte Domain-Tests sichern Grenzen.

## Nachweis und Änderungsregel

Konkretisierung: [Architektur](../docs/arch/A05-building-block-view.md). Geplante Nachweise: [Rückverfolgbarkeit](../docs/TRACEABILITY.md). Noch kein Implementierungsnachweis. Änderungen an dieser Entscheidung erhalten eine neue ADR mit expliziter Ablösung; die bisherige Begründung bleibt erhalten.

[ADR-Index](README.md)

Definitionslinks: [NFR-MNT-01](../docs/spec/N1-nichtfunktional.md#nfr-mnt-01), [NFR-MNT-02](../docs/spec/N1-nichtfunktional.md#nfr-mnt-02).
