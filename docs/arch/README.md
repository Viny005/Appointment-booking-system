# Appointment Booking System — Architektur (arc42)

Die Architektur wird nach **arc42** dokumentiert. Die fachliche Quelle ist [`../spec/`](../spec/).

| # | Kapitel | Datei |
|---|---|---|
| 1 | Einführung und Ziele | [`A01-introduction-and-goals.md`](A01-introduction-and-goals.md) |
| 2 | Randbedingungen | [`A02-architecture-constraints.md`](A02-architecture-constraints.md) |
| 3 | Kontext und Abgrenzung | [`A03-context-and-scope.md`](A03-context-and-scope.md) |
| 4 | Lösungsstrategie | [`A04-solution-strategy.md`](A04-solution-strategy.md) |
| 5 | Bausteinsicht | [`A05-building-block-view.md`](A05-building-block-view.md) |
| 6 | Laufzeitsicht | [`A06-runtime-view.md`](A06-runtime-view.md) |
| 7 | Verteilungssicht | [`A07-deployment-view.md`](A07-deployment-view.md) |
| 8 | Querschnittskonzepte | [`A08-cross-cutting-concepts.md`](A08-cross-cutting-concepts.md) |
| 9 | Architekturentscheidungen | [`A09-architecture-decisions.md`](A09-architecture-decisions.md) |
| 10 | Qualitätsanforderungen | [`A10-quality-requirements.md`](A10-quality-requirements.md) |
| 11 | Risiken und technische Schulden | [`A11-risks-and-technical-debts.md`](A11-risks-and-technical-debts.md) |
| 12 | Glossar | [`A12-glossary.md`](A12-glossary.md) |

Die Architektur ist bewusst als modularer Full-Stack-Monolith vorgesehen: eine Anwendung, klare interne Domänenmodule, relationale Datenbank und Adapter für externe Dienste.

[Rückverfolgbarkeit](../TRACEABILITY.md) · [ADR-Index](../../adr/README.md) · [Quellen](../SOURCES.md) · [Offene Entscheidungen](../OPEN-QUESTIONS.md).

Alle zwölf Kapitel bilden ein Sollbild vor Implementierung; Betriebsziele und Präzisierungen benötigen Review. Die Spezifikation ist die Quelle fachlicher Anforderungen.
