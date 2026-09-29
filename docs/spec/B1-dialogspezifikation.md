# B1 — Dialogspezifikation

## B1.1 Öffentliche Startseite — Profile

**Zweck:** Auswahl des primären Beraters.\
**Inhalte pro Karte:** Foto, Name, Rolle/Titel, Kurzbeschreibung, „Termin buchen“.\
**Regel:** Nur aktive Profile mit mindestens einem aktiven Service erscheinen.

## B1.2 Serviceauswahl

Zeigt ausschließlich Services des gewählten Profils. Jeder Eintrag enthält mindestens Name, Beschreibung, Dauer und verständlichen Meetingmodus.

## B1.3 Teilnehmerauswahl

Zeigt den Primärberater fest und konfigurierte zusätzliche Teilnehmer.

Beispiel:

- `✓ Merveil` — Primärberater, nicht abwählbar
- `☑ Fabrice` — vorausgewählt, aber abwählbar

Beim Ändern der Auswahl werden Kalenderdaten neu berechnet.

## B1.4 Kalenderseite

- Monatsansicht.
- Vergangene bzw. außerhalb des Buchungsfensters liegende Tage deaktiviert.
- Tage ohne mindestens einen gültigen Slot deaktiviert.
- Erst nach Auswahl eines aktiven Tages erscheinen Uhrzeiten.
- Uhrzeiten, die wegen Servicedauer oder Belegung nicht passen, erscheinen nicht.

## B1.5 Kundendaten

Pflicht:
- Vorname
- Nachname
- E-Mail
- Telefon

Optional:
- Adresse
- Wünsche für den Termin
- Gäste: dynamisch „+ Gast hinzufügen“, je Gast E-Mail

Datenschutzinformation wird verlinkt. Es gibt keine künstliche Pflicht-Checkbox „Datenschutz akzeptieren“, sofern keine Einwilligung Rechtsgrundlage des konkreten Verarbeitungsvorgangs ist.

## B1.6 Zusammenfassung

Zeigt vor finaler Bestätigung:
- Profil/Primärberater
- zusätzliche Teilnehmer
- Service
- Datum
- Start/Ende
- Meetingmodus/Ort/Link soweit vorhanden
- Kundendaten
- Gäste

Aktionen: „Zurück/Ändern“ und „Termin bestätigen“.

## B1.7 Bestätigungsseite

- Erfolgsstatus
- Terminübersicht
- Wahrheitsgemäßer Versandstatus: zunächst „Bestätigung wird versendet“, bei Fehler Kontakt-/Wiederholungsmöglichkeit; keine behauptete Zustellung vor Versand
- Button **„Zum Kalender hinzufügen“** (`.ics`)
- Link zur öffentlichen Startseite

## B1.8 Terminverwaltung Kunde

Sicherer Link aus E-Mail. Zeigt ausschließlich den referenzierten Termin. Wenn >24 h bis Beginn:
- Termin ändern
- Termin stornieren

Wenn ≤24 h:
- Selbstbedienungsaktionen deaktiviert
- Kontaktinformation des zuständigen Beraters anzeigen

## B1.9 Login

- E-Mail
- Passwort
- „Passwort vergessen“

Unauthentifizierter Zugriff auf private URLs führt hierher und bewahrt optional das sichere Rücksprungziel.

## B1.10 Berater-Dashboard

- heutige/nächste Termine
- Kalender Tag/Woche/Monat
- Terminliste
- Link zu eigener Verfügbarkeit
- Logout

## B1.11 Verfügbarkeit bearbeiten

Pro Wochentag:
- aktiv/inaktiv
- mehrere `Von–Bis`-Intervalle
- „+ Zeitfenster hinzufügen“

Bei Überlappung:
- bestehendes Intervall anzeigen
- neues Intervall anzeigen
- resultierendes Merge-Intervall anzeigen
- Aktionen: `Zusammenführen`, `Neue Eingabe ändern`, `Abbrechen`

Zusätzlich Monatsansicht für Ausnahmen:
- Standard verwenden
- Tageszeiten ersetzen
- zusätzliche Verfügbarkeit
- ganzen Tag blockieren
- Zeitraum über mehrere Tage blockieren (z. B. Urlaub)

## B1.12 Admin

Bereiche:
- Dashboard
- Profile
- Services
- Beziehungen
- interne Benutzer und Berechtigungen
- Termine
- Systemeinstellungen
- Audit/Fehlerübersicht

Admin kann alle Kalender und Verfügbarkeiten verwalten. Berater verwalten initial eigene Verfügbarkeit und eigene Termine; eigene Serviceverwaltung ist nur bei expliziter Berechtigung freigeschaltet.
