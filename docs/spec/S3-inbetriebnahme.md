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
