<a id="adr-009"></a>
# ADR-009 — MeetingProvider-Abstraktion

**Status:** Accepted\
**Datum:** 2026-09-29

## Kontext

V1 soll ohne Microsoft-Kontoverknüpfung funktionieren, spätere Integration soll möglich bleiben.

Anforderungstreiber: CON-17, AF-24. Auflösbare Definitionen im [ID-Register](../docs/ID-REGISTRY.md).

## Entscheidung

Providerneutrale Meetinginformationen. Service konfiguriert `meetingModePolicy` (FIXED/CLIENT_CHOICE) und eine nicht leere Menge `allowedMeetingModes`; FIXED erlaubt genau einen Modus. Appointment speichert ausschließlich IN_PERSON, PHONE oder ONLINE mit eigenem validierten Snapshot. V1 nutzt einen konfigurierten HTTPS-Link (provider MANUAL), Präsenzort oder Telefon. Im Standard ruft der Berater die Pflichtnummer des Kunden an. Die vollständigen Varianten und Adapterverträge stehen in A05 und D2.

## Betrachtete Alternativen

Direkte Graph-Abhängigkeit würde V1 von externem OAuth und Organisationsfreigaben abhängig machen.

## Konsequenzen

Konfigurierte Links können wiederverwendbar sein; Betreiber muss ihre Eignung prüfen. Teams bleibt außerhalb V1, ohne Zusage einer späteren Lieferung.

## Nachweis und Änderungsregel

Konkretisierung: [Architektur](../docs/arch/A05-building-block-view.md). Geplante Nachweise: [Rückverfolgbarkeit](../docs/TRACEABILITY.md). Noch kein Implementierungsnachweis. Änderungen an dieser Entscheidung erhalten eine neue ADR mit expliziter Ablösung; die bisherige Begründung bleibt erhalten.

[ADR-Index](README.md)

Definitionslinks: [AF-24](../docs/spec/F3-anwendungsfunktionen.md#af-24), [CON-17](../docs/spec/P1-constraints.md#con-17).
