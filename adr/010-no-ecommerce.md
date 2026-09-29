<a id="adr-010"></a>
# ADR-010 — Ausschließlich Terminorganisation

**Status:** Accepted (dokumentarische Baseline aus dem Archiv; zur Review)\
**Datum:** 2026-09-29

## Kontext

Der Nutzer grenzt das Produkt ausdrücklich als Terminbuchungs- und Verwaltungssystem ab.

Anforderungstreiber: CON-01, NG-01, NG-02. Auflösbare Definitionen im [ID-Register](../docs/ID-REGISTRY.md).

## Entscheidung

Keine Preise, Verkäufe, Warenkörbe, Checkout-, Zahlungs- oder Bestellmodelle. Services beschreiben Termine und Dauer. Keine Paymentprovider in Kontext, Datenmodell oder Deployment.

## Betrachtete Alternativen

Ein Shop- oder Payment-Baukasten erweitert den Scope gegen die ausdrückliche Vorgabe und wird verworfen.

## Konsequenzen

Kleineres Fachmodell und keine Zahlungsintegration. Neue Anforderungen werden gegen diese Grenze geprüft; dies ist kein für V2 vorgemerktes Feature.

## Nachweis und Änderungsregel

Konkretisierung: [Architektur](../docs/arch/A02-architecture-constraints.md). Geplante Nachweise: [Rückverfolgbarkeit](../docs/TRACEABILITY.md). Noch kein Implementierungsnachweis. Änderungen an dieser Entscheidung erhalten eine neue ADR mit expliziter Ablösung; die bisherige Begründung bleibt erhalten.

[ADR-Index](README.md)

Definitionslinks: [CON-01](../docs/spec/P1-constraints.md#con-01), [NG-01](../docs/spec/P1-ziele-rahmenbedingungen.md#ng-01), [NG-02](../docs/spec/P1-ziele-rahmenbedingungen.md#ng-02).
