# D2 — Datentypkatalog

## Enumerationen

### UserRoleDT
- `ADMIN`
- `ADVISOR`

### AppointmentStatusDT
- `CONFIRMED`
- `CANCELLED`
- `COMPLETED`
- `NO_SHOW`

### ParticipantRoleDT
- `PRIMARY`
- `ADDITIONAL`

### MeetingModeDT
- `IN_PERSON`
- `PHONE`
- `ONLINE`
- `CLIENT_CHOICE`

### AvailabilityExceptionTypeDT
- `BLOCK_DAY`
- `REPLACE_DAY`
- `ADD_INTERVAL`

### NotificationTypeDT
- `BOOKING_CONFIRMATION`
- `BOOKING_CHANGED`
- `BOOKING_CANCELLED`
- `REMINDER`
- `PASSWORD_RESET`

### NotificationStatusDT
- `PENDING`
- `SENT`
- `FAILED`

## Value Objects / fachliche Werte

### LocalTimeRangeDT
- `start`: lokale Uhrzeit
- `end`: lokale Uhrzeit
- Invariante: `start < end`

### EmailAddressDT
Normalisierte, syntaktisch gültige E-Mail-Adresse.

### PhoneNumberDT
Pflichtfeld für Kunden; Eingabe wird normalisiert, aber nicht auf ein einzelnes Länderformat beschränkt.

### BookingWindowDT
- `minimumLeadTime = 24h`
- `maximumHorizon = 3 calendar months`

### SlotStepDT
Konfigurierbare Startzeit-Schrittweite; Standard `30 Minuten`, erlaubte Werte initial `15`, `30`, `60` Minuten.

### SessionPolicyDT
- Inaktivität: `30 Minuten`
- absolute Maximaldauer: `8 Stunden`

### RetentionPolicyDT
Initiale Standardwerte:
- abgeschlossene Termine: personenbezogene Daten nach `12 Monaten` anonymisieren
- stornierte Termine: personenbezogene Daten nach `6 Monaten` anonymisieren
- fachliche Terminmetadaten dürfen danach erhalten bleiben

## Pflichtfelder Kundendaten

- Vorname
- Nachname
- E-Mail
- Telefon

Optional:
- Adresse
- Wünsche/Anmerkungen
- zusätzliche Gast-E-Mail-Adressen

## Review-Präzisierungen der Werte

- Intervalle sind halboffen `[start, end)`; angrenzende Termine sind erlaubt. Dienstlänge ist eine positive ganze Anzahl Minuten (V1: 1 bis 480). Ein Tagesintervall überschreitet Mitternacht nicht; solche Verfügbarkeit wird auf zwei Tage verteilt.
- Der Start liegt einschließlich zwischen „jetzt + 24 verstrichenen Stunden“ und „jetzt + 3 Kalendermonaten in Europe/Berlin“. Ein fehlender Monatstag wird auf den letzten Tag gekürzt. Die gesamte Dauer muss in der Verfügbarkeit liegen. Interne Umbuchung darf den Mindestvorlauf unterschreiten, aber nicht in die Vergangenheit oder über den Horizont hinaus buchen.
- Bei unbekannter lokaler Uhrzeit im Frühjahrswechsel wird kein Slot erzeugt. Doppelte lokale Zeiten im Herbst werden mit UTC-Offset unterschieden; beide sind wählbar. Dauer wird in verstrichenen Minuten gemessen.
- Aufbewahrung: 12 Kalendermonate ab Ende für `COMPLETED`, `NO_SHOW` und vergangenes `CONFIRMED`; 6 Kalendermonate ab Stornierungszeit für `CANCELLED`. Fristende ist einschließlich; Betreiber muss Fristen vor Produktion bestätigen.
- V1-Eingabegrenzen: Namen je 100 Zeichen, E-Mail 254, Telefon 32, Adresse 500, Wünsche 2000, höchstens 10 eindeutige Gäste. Keine Freitext-HTML-Ausführung. Leerraum an Rändern entfernen; E-Mail-Domain normalisieren, keine unbestätigten Mailbox-Aliasregeln anwenden.
- `CLIENT_CHOICE` gehört zur Servicekonfiguration; der bestätigte Termin speichert genau `IN_PERSON`, `PHONE` oder `ONLINE` plus passende Kontakt-/Ortsangabe. Ohne nötige Meetinginformationen ist der Service nicht öffentlich buchbar.

Die Begrenzungen sind prüfbare Baseline-Vorschläge; sie werden im Dokumentationsreview fachlich bestätigt.
