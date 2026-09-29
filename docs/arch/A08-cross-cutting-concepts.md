# 8 Querschnittskonzepte

## 8.1 Authentifizierung und Sessions

- Nur interne Accounts benötigen eine Anmeldung; Kunden besitzen kein Konto.
- Passwort-Hash: Argon2id oder gleichwertig aktueller sicherer Algorithmus.
- DB-gestützte Sessions.
- Idle Timeout 30 min, absolute Dauer 8 h.
- Route Guard serverseitig.

## 8.2 Autorisierung

Rollen:
- ADMIN
- ADVISOR

Zusätzliche Permissions, z. B. `canManageOwnServices`. Jeder Use Case prüft Berechtigung im Application Layer; UI darf nur Komfort liefern.

## 8.3 Booking Draft

Mehrseitiger öffentlicher Flow verwendet einen kurzlebigen serverseitigen/gesicherten Buchungsentwurf. PII wird nicht in URLs geschrieben. Entwurf wird nach Erfolg oder TTL verworfen.

## 8.4 Transaktionen und Kollisionsschutz

- Finale Verfügbarkeit innerhalb DB-Transaktion erneut prüfen.
- PostgreSQL-Constraint/Locking verhindert Überschneidung pro Profil.
- Teilnehmer werden in stabiler Reihenfolge gesperrt, um Deadlocks zu vermeiden.

## 8.5 Zeitmodell

- Konkrete Termine in UTC speichern.
- Ausgabe/Berechnung mit IANA-Zeitzone, Standard `Europe/Berlin`.
- Wochenregeln als lokale „wall clock“-Zeiten.

## 8.6 E-Mail/Outbox

Termintransaktion legt Notification-Outbox-Einträge an. Externer Versand erfolgt nach Commit. Eindeutige Auftragskeys verhindern doppelte fachliche Versandaufträge. Zustellung ist at-least-once: bei Timeout nach Providerannahme kann ohne Provider-Idempotenz eine doppelte E-Mail auftreten; genau einmal wird nicht versprochen.

## 8.7 iCalendar

- stabile UID pro Appointment
- Sequence beginnt 0 und steigt bei relevanten Änderungen
- DTSTART/DTEND mit Zeitzoneninformation
- CANCEL verwendet dieselbe UID
- kein Verwaltungs-Secret im `.ics`

## 8.8 Logging

- strukturiert
- keine Passwörter, Reset-Tokens, Verwaltungstokens oder vollständigen sensiblen Formulardaten
- Korrelation über Request-/Appointment-ID

## 8.9 Datenschutz

- minimale Kundendaten
- keine Kundenkonten
- Anonymisierungsjob
- Auditdaten ohne unnötige Kunden-PII
- rechtliche Texte konfigurierbar

## 8.10 Accessibility

Serverseitige Validierungsfehler werden feldbezogen zurückgegeben. Fokusmanagement und ARIA nur dort, wo semantisches HTML nicht ausreicht.

## 8.11 Token- und Entwurfslebenszyklus (Review-Baseline)

Kundentoken: mindestens 256 Bit kryptografische Zufälligkeit, nur Hash dauerhaft in Appointment. Gültig bis Terminende, bei Stornierung sofort widerrufen; Rotation widerruft den alten Token. Keine Tokens in Logs, Referrern, Analytics oder ICS. Eine initiale Kundenmail benötigt den Rohwert: ausschließlich dafür kurzlebig verschlüsselte Outbox-Payload im Secret-Key-Kontext; nach erfolgreichem Versand löschen, spätestens nach 24 Stunden. Danach keine alten geheimen Payloads manuell erneut senden, sondern autorisiert einen neuen Link erzeugen. Gast- und Beraternachrichten erhalten nie diese Payload. TLS, `Referrer-Policy: no-referrer` und kein Drittinhalt auf Verwaltungsseiten.

Reset-Token: 30 Minuten, einmalig, nur Hash; Sessions nach Reset widerrufen. Sitzungs-ID zufällig, als Hash gespeichert; Cookie `HttpOnly`, `Secure`, `SameSite=Lax`. Zustandsänderungen nur per Mutation mit CSRF-/Origin-Prüfung, niemals per GET. RBAC und Ressourcenbesitz bei jedem Use Case erneut prüfen.

Entwurf: serverseitig, 30 Minuten Inaktivitäts-TTL, Zugriff nur mit eigenem Cookie; nach Erfolg entfernen. Idempotenzschlüssel bindet an Entwurf und Payload-Hash, 24 Stunden gültig. Derselbe Schlüssel mit anderem Inhalt ergibt Konflikt. Initialer Richtwert: 5 Login-/Resetversuche je Konto und Minute, 30 je IP; öffentliche Buchung separat drosseln. Grenzwerte konfigurierbar und vor Produktion anhand legitimer Nutzung abnehmen.

## 8.12 Outbox-Verarbeitung (Review-Baseline)

Schlüssel: Termin-ID, Kalendersequenz, Ereignistyp, Empfänger. Datensatz enthält Versuchszähler, Fälligkeitszeit, Lease-Ablauf und bereinigten Fehlercode. Worker übernimmt atomar eine begrenzte Menge; abgelaufene Leases sind wieder übernehmbar. Retry nach 1, 5, 30, 120 und 360 Minuten; danach `FAILED` mit Alarm und autorisierter Wiederaufnahme. Vor Versand prüft er Terminversion/Status: überholte Reminder werden verworfen, pro Termin/Empfänger werden Ereignisse in Sequenz verarbeitet. `SENT` bedeutet Providerannahme, keinen Zustellnachweis.

## 8.13 iCalendar und Datenschutzgrenzen

Neue Buchung und Änderung verwenden `METHOD:REQUEST`; kein nicht standardisiertes `METHOD:UPDATE`. Storno verwendet `METHOD:CANCEL` mit gleicher UID, höherer Sequenz und `STATUS:CANCELLED`. UTC-DTSTART/DTEND, DTSTAMP und stabile Organizer-Adresse; Text und Zeilenumbrüche korrekt maskieren. Nur Empfänger und relevante Termininformationen aufnehmen; keine vollständige Gästeliste, Kundenfreitexte oder Tokens. ICS ist ein Austauschformat, keine garantierte Kalendersynchronisation. Dateidownload nur über autorisierten Zugriff; Storno-ICS wird per Nachricht verteilt.

Retention umfasst Kunden-/Gastadressen, Notizen, verschlüsselte Mailkopien und Identifikatoren in technischen Nebenbeständen. Historische Beraterreferenzen bleiben personenbezogen; die Bezeichnung „Anonymisierung“ bezieht sich hier nur auf Kunden/Gäste und verspricht keine vollständige Anonymität des Gesamtdatensatzes. Backup-Löschfenster und Wiederherstellungsbereinigung werden in [A07](A07-deployment-view.md) festgelegt.

Normative Formatreferenzen: [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545) und [RFC 5546](https://www.rfc-editor.org/rfc/rfc5546). Die fachlichen Regeln stehen in [N2](../spec/N2-querschnittskonzepte.md).
