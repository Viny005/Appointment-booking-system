# Projektdokumentation

Die Dokumentation folgt dem gleichen Grundprinzip wie das Herold-Referenzprojekt:

| Verzeichnis | Ebene | Struktur | Zweck |
|---|---|---|---|
| [`spec/`](spec/) | Spezifikation | Siedersleben-Bausteine | Fachlich: Was soll das System leisten und warum? |
| [`arch/`](arch/) | Architektur | arc42 + ADRs | Technisch: Wie wird die Spezifikation umgesetzt? |

Die Trennung ist verbindlich: konkrete Frameworks, Bibliotheken, Klassen, Datenbankprodukte, Deployment-Details und Quellcodepfade gehören nicht in die fachliche Spezifikation, sondern in die Architektur bzw. in ADRs.

Die Spezifikation und Architektur referenzieren sich über stabile IDs wie `UC-01`, `AF-01`, `NFR-CON-01` und `ADR-001`.

Ausschließlich vor Produktion verbleibende Freigaben: [`OPEN-QUESTIONS.md`](OPEN-QUESTIONS.md).

## Navigation und Verbindlichkeit

[Projekt](../README.md) · [ADRs](../adr/README.md) · [Rückverfolgbarkeit](TRACEABILITY.md) · [Quellen](SOURCES.md) · [Prüfung](VALIDATION.md).

Die Spezifikation ist die fachliche Quelle. Architektur konkretisiert sie; Abweichungen erfordern eine dokumentierte fachliche Änderung. `Accepted` bedeutet eine getroffene Architekturentscheidung; `Proposed` einen noch nicht beschlossenen Vorschlag, `Superseded` eine abgelöste und `Rejected` eine verworfene Entscheidung. Die Implementierungsbaseline ist entschieden; ihre PR bleibt zur abschließenden Review offen. Produktionsfreigaben bleiben getrennt sichtbar.

IDs: G (Ziele), NG (Nichtziele), SC (Erfolgskriterien), CON (Constraints), UC (Anwendungsfälle), AF (Funktionen), NFR (Qualitätsanforderungen), QG (Architekturziele), QS (Prüfszenarien), R (Risiken), ADR (Entscheidungen). Die Quelldefinition steht genau einmal als Überschrift oder erste Tabellenzelle; Register und Matrix referenzieren sie per Link.

[Implementierungsbereitschaft](READY-FOR-IMPLEMENTATION.md) · [Deutschland-Checkliste](LEGAL-COMPLIANCE-DE.md).
