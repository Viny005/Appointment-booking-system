<a id="adr-003"></a>
# ADR-003 — Zentrale Availability Engine

**Status:** Accepted (dokumentarische Baseline aus dem Archiv; zur Review)\
**Datum:** 2026-09-29

## Kontext

Monatskalender, Tagesslots, Buchung und Umbuchung müssen identische Fachregeln auswerten.

Anforderungstreiber: AF-04, AF-05, AF-06, AF-07, AF-08. Auflösbare Definitionen im [ID-Register](../docs/ID-REGISTRY.md).

## Entscheidung

Eine UI-unabhängige Domain-Komponente berechnet aus geladenen Daten und expliziter Referenzzeit Slots nach N2. Transaktionale Revalidierung verwendet dieselbe Komponente.

## Betrachtete Alternativen

Separate Logik pro Oberfläche divergiert. Browserberechnung allein kann manipuliert werden und ist nicht verbindlich.

## Konsequenzen

Deterministische Tests für Schnittmengen und DST; Datenladeaufwand muss gebündelt werden. Ein angezeigter Slot ist keine Reservierung.

## Nachweis und Änderungsregel

Konkretisierung: [Architektur](../docs/arch/A06-runtime-view.md). Geplante Nachweise: [Rückverfolgbarkeit](../docs/TRACEABILITY.md). Noch kein Implementierungsnachweis. Änderungen an dieser Entscheidung erhalten eine neue ADR mit expliziter Ablösung; die bisherige Begründung bleibt erhalten.

[ADR-Index](README.md)

Definitionslinks: [AF-04](../docs/spec/F3-anwendungsfunktionen.md#af-04), [AF-05](../docs/spec/F3-anwendungsfunktionen.md#af-05), [AF-06](../docs/spec/F3-anwendungsfunktionen.md#af-06), [AF-07](../docs/spec/F3-anwendungsfunktionen.md#af-07), [AF-08](../docs/spec/F3-anwendungsfunktionen.md#af-08).
