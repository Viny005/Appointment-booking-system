# S3 — Inbetriebnahme

## Ziel

Kontrollierte Einführung ohne Datenmigration aus einem Altsystem.

## Stufen

1. Entwicklungsumgebung mit Testdaten.
2. Initialer Testberater „Fabrice“ mit mindestens einem Service.
3. Funktionstests des gesamten Buchungsflusses.
4. E-Mail- und `.ics`-Tests auf Mobilgerät und Desktop.
5. Rollen-/Rechte- und Sessiontests.
6. Datenschutz-/Impressumsinhalte mit realen Betreiberangaben ergänzen.
7. Produktivumgebung mit HTTPS und Datenbank-Backup konfigurieren.
8. Weitere Berater und Profilbeziehungen durch Administrator anlegen.

## Go-Live-Kriterien

- Keine bekannte Doppelbuchungsmöglichkeit.
- Private Seiten sind ohne Login nicht erreichbar.
- Testbuchung inkl. E-Mail und `.ics` erfolgreich.
- Änderung/Stornierung erfolgreich.
- Nicht beteiligte Profile erhalten nachweislich keine Termin-E-Mails.
- Backup und Wiederherstellung der Datenbank dokumentiert.
- Impressum/Datenschutz mit echten Betreiber-/Dienstleisterangaben vorhanden.

## Verbindliche Produktionsgates

Die [Deutschland-Checkliste](../LEGAL-COMPLIANCE-DE.md) ist vollständig mit Betreiber, Datum und Nachweis auszufüllen: DDG-Impressum, Art.-13-/14-Information, Zweck/Retention, Dienstleister/AVV/Transfers, TOM/Restore, notwendige Speicher, BFSG/BFSGV-Anwendbarkeit und gegebenenfalls Barrierefreiheitsinformationen, VSBG §§36/37 und Qualifikation der Terminbestätigung. Kein GO-LIVE-BLOCKER-Platzhalter darf öffentlich als reale Angabe erscheinen. Auch Nichtanwendbarkeit braucht Begründung.

Produktive Abnahme umfasst konkrete Authentifizierung/Timeout/Widerruf, Meetingvarianten, Mehrberaterrechte, Gästeentfernung ohne Cancel für andere, manuelles Resend ohne Sequenzänderung, Reminder-Grenze, DST, Upload/Headers und lokale/produktive Adapterverträge. Nachweise referenzieren [A10](../arch/A10-quality-requirements.md). WCAG 2.2 AA ist unabhängig vom rechtlichen Ergebnis verbindlich.

Alle offenen Angaben sind [Go-live blockers](../OPEN-QUESTIONS.md); Entwicklung mit synthetischen Daten kann gemäß [Readiness](../READY-FOR-IMPLEMENTATION.md) beginnen. Es ist noch keine technische oder juristische Produktionsfreigabe erteilt.
