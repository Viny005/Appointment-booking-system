# Appointment Booking System

Webanwendung zur Buchung und Verwaltung von Beratungsterminen. Kunden wählen ohne Benutzerkonto einen Berater, dessen Terminservice, tatsächliche Teilnehmer und einen gemeinsam verfügbaren Zeitpunkt. Berater pflegen eigene Kalender; Administratoren verwalten Profile, Services, Beziehungen und Zugriffsrechte.

**Ausschließlich Terminorganisation:** keine Verkäufe, Preise, Warenkörbe, Bestellungen, Zahlungen oder sonstigen E-Commerce-Funktionen. Ein „Service“ bezeichnet einen Termintyp mit Dauer und Besprechungsmodus, kein Verkaufsprodukt.

## Projektstatus

Stand: 2026-09-29. Dokumentarische Baseline vor der Implementierung. Dieses Repository enthält noch keine funktionale Website, keine Installation und kein Deployment. Beschriebene Laufzeitabläufe, Tests und Technologien sind Zielbild, keine bereits implementierten Fähigkeiten.

## Dokumentation

| Einstieg | Inhalt |
|---|---|
| [Dokumentationsübersicht](docs/README.md) | Lesepfade und Konventionen |
| [Spezifikation nach Siedersleben](docs/spec/README.md) | Ziele, Prozesse, Anwendungsfälle, Daten, Dialoge, Qualität |
| [Architektur nach arc42](docs/arch/README.md) | Alle zwölf Architekturkapitel |
| [Architecture Decision Records](adr/README.md) | Kontext, Alternativen, Entscheidung und Folgen |
| [Rückverfolgbarkeit](docs/TRACEABILITY.md) | Anforderungen → Architektur → geplante Abnahme |
| [Offene Entscheidungen](docs/OPEN-QUESTIONS.md) | Verantwortlichkeiten und Entscheidungstermine |
| [Design-Leitlinien](DESIGN.md) | Vorgaben für die spätere Oberfläche |
| [Quellen und Anpassungen](docs/SOURCES.md) | Archivherkunft, strukturelle Referenzen und Ergänzungen |
| [Dokumentationsprüfung](docs/VALIDATION.md) | Prüfumfang und reproduzierbarer Ablauf |

Die deutsche Dokumentationssprache und Dateinamen der gelieferten Vorlage bleiben erhalten. Die Gliederung orientiert sich an Herold; Fachinhalt und Architektur beziehen sich ausschließlich auf Terminbuchungen.

## Beitrag und Review

Fachliche Änderungen beginnen in `docs/spec/`; technische Entscheidungen folgen in `docs/arch/` und `adr/`. Stabile IDs werden nicht für andere Anforderungen wiederverwendet. Die Rückverfolgbarkeit wird im selben Commit aktualisiert. Dokumentationsprüfungen: `python tools/check_docs.py` und `git diff --check`. Der Prüfer benötigt nur Python 3 und ist kein Anwendungscode.

Die initiale Dokumentation wird auf `docs/initial-specification` zur Prüfung gegen `main` vorgelegt. Eine Freigabe der Dokumentation ist kein Nachweis einer getesteten Implementierung.
