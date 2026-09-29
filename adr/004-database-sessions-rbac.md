<a id="adr-004"></a>
# ADR-004 — Datenbanksitzungen und RBAC

**Status:** Accepted\
**Datum:** 2026-09-29

## Kontext

Interne Zugriffe müssen widerrufbar sein und eigene/fremde Kalender unterscheiden.

Anforderungstreiber: CON-18, NFR-SEC-01, NFR-SEC-04. Auflösbare Definitionen im [ID-Register](../docs/ID-REGISTRY.md).

## Entscheidung

DB-Sessions, ADMIN/ADVISOR, zusätzliche Permissions und Ressourcenbesitzprüfung im Application Layer. Passwortreset widerruft Sessions. Konkrete Bibliothek, unterstützte Kombination und Policy-Verantwortung sind in [ADR-011](011-authentication-library.md) entschieden.

## Betrachtete Alternativen

Rein clientseitige Guards sind kein Zugriffsschutz. Langlebige zustandslose Tokens erschweren sofortigen Widerruf.

## Konsequenzen

DB-Lesen pro privatem Request; Lastprofil testen. Keine Kundenkonten; Kundentoken sind strikt auf einen Termin begrenzte Fähigkeiten.

## Nachweis und Änderungsregel

Konkretisierung: [Architektur](../docs/arch/A08-cross-cutting-concepts.md). Geplante Nachweise: [Rückverfolgbarkeit](../docs/TRACEABILITY.md). Noch kein Implementierungsnachweis. Änderungen an dieser Entscheidung erhalten eine neue ADR mit expliziter Ablösung; die bisherige Begründung bleibt erhalten.

[ADR-Index](README.md)

Definitionslinks: [CON-18](../docs/spec/P1-constraints.md#con-18), [NFR-SEC-01](../docs/spec/N1-nichtfunktional.md#nfr-sec-01), [NFR-SEC-04](../docs/spec/N1-nichtfunktional.md#nfr-sec-04).
