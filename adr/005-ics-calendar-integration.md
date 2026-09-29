<a id="adr-005"></a>
# ADR-005 — iCalendar als V1-Kalenderintegration

**Status:** Accepted\
**Datum:** 2026-09-29

## Kontext

Kalenderartefakte sollen ohne Kontoverknüpfung verwendbar sein.

Anforderungstreiber: CON-16, AF-16. Auflösbare Definitionen im [ID-Register](../docs/ID-REGISTRY.md).

## Entscheidung

ICS mit stabiler UID, steigender SEQUENCE, REQUEST für Anlage/Änderung und CANCEL für Absage. Empfängerspezifische Daten ohne Verwaltungssecret.

## Betrachtete Alternativen

OAuth-Synchronisation setzt Anbieterfreigaben voraus; bloßer Text bietet keine standardisierte Kalenderübernahme.

## Konsequenzen

Nutzer importiert selbst; Clientverhalten variiert. Keine garantierte automatische Aktualisierung, daher Interoperabilitätsabnahme in mindestens zwei Kalenderclients.

## Nachweis und Änderungsregel

Konkretisierung: [Architektur](../docs/arch/A08-cross-cutting-concepts.md). Geplante Nachweise: [Rückverfolgbarkeit](../docs/TRACEABILITY.md). Noch kein Implementierungsnachweis. Änderungen an dieser Entscheidung erhalten eine neue ADR mit expliziter Ablösung; die bisherige Begründung bleibt erhalten.

[ADR-Index](README.md)

Definitionslinks: [AF-16](../docs/spec/F3-anwendungsfunktionen.md#af-16), [CON-16](../docs/spec/P1-constraints.md#con-16).
