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

## Ergänzende V1-Dialogverträge

- Service zeigt FIXED als einzige Option oder CLIENT_CHOICE als Auswahl aus allowedMeetingModes. Zusammenfassung speichert/zeigt immer IN_PERSON, PHONE oder ONLINE mit Ort, Anrufrichtung/Ziel beziehungsweise Link; niemals CLIENT_CHOICE als Terminmodus.
- Bei Herbstwechsel beide 02:30 mit MESZ/MEZ und UTC-Offset kennzeichnen; Spring-Lücke deaktivieren. Alle Oberflächen verwenden Systemzone Europe/Berlin.
- Hinweis nach Art. 13 bereits vor Übermittlung an den serverseitigen Entwurf; Adresse freiwillig, Telefonzweck erklären, Freitextwarnung gegen unnötige sensible Angaben. Keine Pflichtcheckbox zum Akzeptieren der Datenschutzerklärung.
- Interner Detaildialog zeigt Kundenname, Telefon, E-Mail, Gäste, Service, tatsächliche Teilnehmer, Wünsche, Modus, Ort/URL und Status. Aktionen: Zeit/erlaubte Details bearbeiten, Gäste verwalten, absagen, Bestätigung erneut senden; nach Ende Ergebnis COMPLETED/NO_SHOW. Sichtbarkeit ersetzt nie Serverautorisierung.
- Gästeentfernung zeigt ausdrücklich „Nur diese Einladung wird abgesagt“. Verbleibende Beteiligte erhalten keinen Cancel. Resend-Auswahl zeigt nur aktuelle Empfänger, Standard Kunde, keine freie Adresse; erklärt Rotation des Kundenlinks und unveränderte Kalenderdaten.
- Terminale/anonymisierte Termine nur lesend, leere PII als gelöscht markieren. Versionskonflikt zeigt Neuladen statt stiller Überschreibung. Profilverwaltung trennt DRAFT/ACTIVE/INACTIVE von aktivem/deaktiviertem Konto und zeigt fehlende Publikationsdaten.
- Foto-Upload nur ADMIN, JPEG/PNG/WebP bis 5 MiB und 4096 Pixel pro Seite. Serverfehler erhält das bisherige Bild. Tastatur, Feldlabels und WCAG 2.2 AA bleiben verpflichtend.
