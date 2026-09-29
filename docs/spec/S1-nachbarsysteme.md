# S1 — Nachbarsysteme

## S1.1 E-Mail-Versand

**Richtung:** System → Empfänger\
**Daten:** Empfänger, Betreff, Terminmetadaten, Verwaltungslink (nur Kunde), `.ics`-Anhang.\
**Fehlerregel:** Eine bereits atomar gespeicherte Buchung bleibt gültig, wenn der E-Mail-Versand fehlschlägt. Versand wird nachvollziehbar als fehlgeschlagen markiert und erneut versucht.

## S1.2 Kalenderanwendungen über iCalendar

Das System benötigt keine direkte Anmeldung bei Google, Apple oder Microsoft. Es erzeugt standardisierte `.ics`-Artefakte.

- neue Buchung: `METHOD:REQUEST`
- Änderung: gleiche UID, erhöhte Sequence
- Stornierung: gleiche UID, `METHOD:CANCEL`

## S1.3 Microsoft Teams — spätere Version

V1 benötigt keine Teams-Verknüpfung. Die fachlichen Daten besitzen dennoch einen neutralen Online-Meeting-Link, damit später ein Microsoft-Graph-Adapter einen individuellen Teams-Link erzeugen kann, ohne das Terminmodell zu ändern.

## S1.4 Hosting/Datenbank

Technische Nachbarsysteme müssen HTTPS, sichere Secret-Verwaltung, Backups und DSGVO-konforme Vertrags-/Regionseinstellungen ermöglichen.

## S1.5 Keine Zahlungsanbieter

Stripe, PayPal oder andere Payment-Systeme sind ausdrücklich **keine** Nachbarsysteme dieses Projekts.
