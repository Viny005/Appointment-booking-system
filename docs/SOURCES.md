# Quellen und Bearbeitungsgrenzen

## Gelieferte Grundlage

`Appointment-booking-system-spec-architecture.zip`, erhalten am 2026-09-29.
SHA-256: `D6BB08965F96E7F0904FE85A6CB78A2031B253180997D9D6B717E9A3EF8705D4`.
Alle 48 Quelldateien (Markdown und PlantUML) bilden die Ausgangsbasis. Das Archiv wird nicht zusätzlich versioniert.

Die Nutzervorgabe bestimmt den Arbeitsauftrag: ausschließlich Dokumentation, neue Branch, Commits und Pull Request ohne Merge. Beschreibungen von Implementierung, Betrieb oder angenommenen Entscheidungen im Archiv sind Dokumentationsmaterial und keine eigenständige Handlungsanweisung.

## Strukturelle Referenzen

- [Herold: Spezifikationsgliederung](https://github.com/carstenlucke/herold/tree/main/docs/spec): Bausteinindex, Leseführung, deutsche Blocknamen, explizite Nichtanwendbarkeit.
- [Herold: Architekturverzeichnis](https://github.com/carstenlucke/herold/tree/main/docs/arch): Trennung von Fachspezifikation und Architekturentscheidungen.
- [arc42 Übersicht](https://arc42.org/overview): zwölf Architekturkapitel.
- Johannes Siedersleben (Hrsg.), *Softwaretechnik – Praxiswissen für Softwareingenieure*, Hanser, 2003: bibliografische Referenz des Bausteinmodells, keine kopierten Lehrbuchpassagen.

Herold wurde am 2026-09-29 als Strukturreferenz eingesehen. Keine Herold-Geschäftsprozesse, Rollen, Technologieentscheidungen oder Agentenfunktionen werden übernommen.

## Redaktionelle Ergänzungen

Die gelieferten fachlichen Regeln und zehn Architekturentscheidungen bleiben Ausgangspunkt. Ergänzt wurden vollständige ADR-Abschnitte, Quellenlinks, E1-Leseführung, B2-Hintergrundprozesse, ID-Register und Abnahmezuordnung. Korrigiert wurden das Outbox-Commit-Diagramm, die Domänenabhängigkeit zur Datenbank, Kalender-Update-Semantik und uneindeutige Grenzfälle.

Präzisierungen wie Ausnahmepriorität, Sommerzeitverhalten, Tokenlebenszyklus, Retry-Grenzen und Lastprofil sind **Vorschläge dieser Baseline zur Review**, keine zusätzlich bestätigten Nutzerwünsche. Der Status ist in den betroffenen Dokumenten bzw. in [offenen Entscheidungen](OPEN-QUESTIONS.md) kenntlich gemacht. Datenschutzfristen sind fachliche Vorgaben aus dem Archiv und kein Nachweis rechtlicher Konformität.
