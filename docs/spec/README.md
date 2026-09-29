# Appointment Booking System — Spezifikation

Fachliche Spezifikation nach dem Bausteinmodell von **Johannes Siedersleben**. Die Dokumente beschreiben das gewünschte System unabhängig von einer konkreten technischen Implementierung.

## E1 — Leseführung

Adressaten sind Betreiber, Berater, Fachverantwortliche und Entwicklung. Die folgenden Bausteine beschreiben das Sollsystem; Abnahmefälle stehen in der [Rückverfolgbarkeit](../TRACEABILITY.md).

### Lesereihenfolge

1. **P1** — Ziele, Scope, Rollen und Rahmenbedingungen.
2. **P2** — fachlicher Systemüberblick.
3. **F1–F3** — Geschäftsprozesse, Anwendungsfälle, Anwendungsfunktionen.
4. **D1–D2** — Datenmodell und Datentypen.
5. **B1** — Dialog- und Seitenfluss.
6. **S1/S3** — Nachbarsysteme und Inbetriebnahme.
7. **N1/N2** — Qualitätsanforderungen und Querschnittskonzepte.
8. **E2** — Glossar.

## Bausteinindex

| Block | Titel | Status | Datei |
|---|---|---|---|
| P1 | Ziele und Rahmenbedingungen | ✅ | [`P1-ziele-rahmenbedingungen.md`](P1-ziele-rahmenbedingungen.md) |
| P1-A | Constraints | ✅ | [`P1-constraints.md`](P1-constraints.md) |
| P2 | Architekturüberblick auf Spezifikationsebene | ✅ | [`P2-architekturueberblick.md`](P2-architekturueberblick.md) |
| F1 | Geschäftsprozesse | ✅ | [`F1-geschaeftsprozesse.md`](F1-geschaeftsprozesse.md) |
| F2 | Anwendungsfälle | ✅ | [`F2-anwendungsfaelle.md`](F2-anwendungsfaelle.md) |
| F3 | Anwendungsfunktionen | ✅ | [`F3-anwendungsfunktionen.md`](F3-anwendungsfunktionen.md) |
| D1 | Datenmodell | ✅ | [`D1-datenmodell.md`](D1-datenmodell.md) |
| D2 | Datentypen | ✅ | [`D2-datentypen.md`](D2-datentypen.md) |
| B1 | Dialogspezifikation | ✅ | [`B1-dialogspezifikation.md`](B1-dialogspezifikation.md) |
| B2 | Automatisierte Hintergrundprozesse | ✅ | [B2-batch.md](B2-batch.md) |
| E1 | Leseführung | ✅ | [README.md](README.md) |
| S1 | Nachbarsysteme | ✅ | [`S1-nachbarsysteme.md`](S1-nachbarsysteme.md) |
| S3 | Inbetriebnahme | ✅ | [`S3-inbetriebnahme.md`](S3-inbetriebnahme.md) |
| N1 | Nichtfunktionale Anforderungen | ✅ | [`N1-nichtfunktional.md`](N1-nichtfunktional.md) |
| N2 | Querschnittskonzepte | ✅ | [`N2-querschnittskonzepte.md`](N2-querschnittskonzepte.md) |
| E2 | Glossar | ✅ | [`E2-glossar.md`](E2-glossar.md) |

## Nicht anwendbare Bausteine

- **B3 Druckausgabe:** Keine Berichte oder Druckdokumente. Kalenderdateien (`.ics`) sind Integrationsartefakte, keine Druckausgabe.
- **S2 Datenmigration:** Greenfield-Projekt ohne Altsystemdaten.

## Zentrale Abgrenzung

Das System dient ausschließlich der **Terminbuchung und Terminverwaltung**. Es verkauft nichts und verarbeitet keine Zahlungen.

[Strukturreferenz](SIEDERSLEBEN.md) · [Architektur](../arch/README.md) · [ID-Register](../ID-REGISTRY.md).

Diagrammquellen: [Anwendungsfälle, Auswahl](diagrams/f2-use-cases.puml) und [Domänenmodell](diagrams/d1-domain-model.puml).
