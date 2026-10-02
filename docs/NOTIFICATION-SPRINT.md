# Sprint 7: Transactional Outbox, E-Mail und ICS

## Basis und Scope

Branch `feat/booking-notifications`, Base `feat/booking-draft`, Basiscommit `175ba815d70d0c74406f0d5f941ba884892c6d07`. Aufbau auf [BookingDraft](BOOKING-DRAFT-SPRINT.md), [ADR-005](../adr/005-ics-calendar-integration.md), [ADR-006](../adr/006-notification-outbox.md) und [Ereignismatrix](spec/N2-querschnittskonzepte.md#n211-aenderungen-und-empfaenger).

## Datenmodell und Migration

`Notification` speichert pro Ereignis/Typ/Empfaenger einen eindeutigen Auftrag: Status PENDING/SENT/FAILED/SUPERSEDED, Empfaengerkategorie, Terminversion, Kalendersequenz, monotone Ereignisnummer, Reminder-Generation, sichere Projektion, Faelligkeit, Versuche, Lease und sicheren Fehlercode. Typen: BOOKING_CONFIRMATION, BOOKING_CHANGED, BOOKING_CANCELLED, REMINDER, PASSWORD_RESET. Reset-Planung und Identitaetspruefung folgen in Sprint 11; bis dahin versendet der Worker keine ungeprueften Resetauftraege.

Appointment erhaelt notificationEventNumber und reminderGeneration, getrennt von calendarSequence und fachlicher version. Neue Buchungen behalten version/calendarSequence 0. Die additive Migration `20260930170000_notification_outbox` erhaelt Termine, Drafts und Idempotenzresultate; sie erzeugt keine historischen Nachrichten. Keine vorherige Migration wird veraendert.

SQL sichert Auftrags-Eindeutigkeit, Fremdschluessel, nichtnegative Zaehler, maximal sechs Versuche, Lease-Paare, Reminder-Generation, Versandzeit und Secret-/Empfaengerform. Secrets sind ausschliesslich bei Kundenbestaetigung bzw. spaeterem Benutzerreset erlaubt, hoechstens 24 Stunden.

## Atomare Planung und HTTP

Draft-Bestaetigung reserviert den Termin, plant Bestaetigungen und zulässige Reminder, speichert das Idempotenzresultat und entfernt den Draft in derselben DB-Transaktion. Ein Verschluesselungsfehler rollt auch den Termin zurueck. Der Planner sperrt die Terminzeile; Wiederholung desselben Ereignisses erzeugt auch parallel keine weiteren Auftraege. Externer Versand erfolgt erst nach Commit.

POST `/api/booking/draft` erlaubt jetzt `action=confirm` mit Command-Key, Review-Hash und Version. Origin-, Cookie-, JSON- und Groessenpruefung bleiben erhalten. Eine explizite Antwort-Allowlist verhindert Roh-Token-Ausgabe. GET bleibt lesend. Der Appointment-Reservierungskern ist ein technischer Transaktionsbaustein; der oeffentliche Confirm-Weg verwendet zwingend Outbox-Planung. Fehlende Versand-/Verschluesselungskonfiguration verhindert den Commit.

## Empfaenger, Privacy und Kalender

Nur Kunde, tatsaechliche Berater und aktuelle Gaeste erhalten Auftraege. Adressen werden dedupliziert, mit Kundenrolle als Vorrang fuer die eigene Verwaltungsfaehigkeit. ProfileRelation und ADMIN-Rolle allein erzeugen keine Mail. Jede Mail hat einen To-Empfaenger, keinen BCC-Verteiler. Projektionen enthalten Termintyp, Zeitpunkt und Meetinginformationen; keine freien Wuensche, Kundenadresse, komplette Gaesteliste oder Kundentelefonnummer. Nur der Kundentext enthaelt seinen Verwaltungslink, keine ICS.

ICS verwendet REQUEST/CANCEL, stabile UID, fachliche SEQUENCE, UTC DTSTART/DTEND, ORGANIZER und einen ATTENDEE. Text wird escaped, Zeilen UTF-8-sicher auf 75 Oktette gefaltet. E-Mail-Zeiten zeigen Europe/Berlin mit Offset. Grundlage: [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545), [RFC 5546](https://www.rfc-editor.org/rfc/rfc5546). Klartext ohne Trackingpixel oder Drittinhalte ist die barrierearme Basis.

Ein Entfernungs-CANCEL geht nur an den entfernten Gast mit altem sicherem Snapshot. Seine wartenden normalen Nachrichten werden verworfen; andere Teilnehmer erhalten keine Absage ihres Ereignisses. Planner-/Worker-Vertraege sind getestet; der Gaesteaenderungs-Use-Case folgt in Sprint 9.

## Management-Secret

Im Appointment bleibt dauerhaft nur der SHA-256-Hash des 256-Bit-Tokens. Fuer die Kundenmail verwendet die Outbox AES-256-GCM mit zufaelligem IV und gebundenem Kontext aus Auftrag, Termin und Empfaenger. `OUTBOX_ENCRYPTION_KEY` ist ein eigenstaendiger extern verwalteter Schluessel. Nach Versand, Supersession oder Ablauf werden Ciphertext, Ablauf und Hash-Kopie entfernt. Abgelaufene Payloads werden nie entschluesselt oder erneut versandt; ein neuer Link verlangt autorisiertes Resenden.

Der Link verwendet `/manage#token=...`, sodass der Rohwert nicht im HTTP-Pfad/Query steht. Die Capability-Oberflaeche folgt in Sprint 8. Key-Rotation muss gueltige kurzlebige Payloads beruecksichtigen; verlorene Tokens werden nicht aus Appointment rekonstruiert.

## Worker, Reihenfolge und Retry

`NotificationWorker` beansprucht atomar maximal 50 Auftraege (CLI-Standard 10) mit FOR UPDATE SKIP LOCKED und zweiminuetiger Lease. Abgelaufene Leases sind uebernehmbar; ein alter Worker kann einen neu beanspruchten Auftrag nicht abschliessen. Vor Providerkontakt werden Status, aktuelle Empfaenger, Token- und Reminder-Generation erneut geprueft. Fruehere offene Ereignisse blockieren spaetere desselben Termins/Empfaengers. Kuenftige Reminder blockieren normale Aenderungen nicht.

Retry-Abstaende: 1, 5, 30, 120, 360 Minuten, danach FAILED. Ausgeschoepfte verwaiste Leases werden ebenfalls FAILED. Providerfehlermeldungen werden nicht gespeichert oder geloggt. Metriken enthalten Anzahlen und feste Codes; Fehler bleiben fuer Alarmierung sichtbar. Wiederaufnahme verlangt einen aktuell aktiven ADMIN; abgelaufene Secrets sind davon ausgeschlossen.

Zustellung ist at-least-once: nach Providerannahme und unklarem Ergebnis kann trotz stabiler Message-ID ein Duplikat auftreten. Zwischen letzter Empfaengerpruefung und Providerannahme bleibt eine In-flight-Grenze. Bereits angenommene Nachrichten lassen sich nicht garantiert zurueckrufen.

## Reminder

Nur `start - 24h > now` erzeugt Reminder; Gleichheit/Vergangenheit erzeugt keinen Sofortauftrag. Pro Generation/Empfaenger gibt es einen Auftrag. Versand verwendet aktuelle sichere Termindaten und Berechtigung. Nach Beginn, Absage, Entfernung oder Generationswechsel wird nicht gesendet. Umbuchung und gezielte Generationsrotation folgen in Sprint 8.

## SMTP und Betrieb

Port `MailTransport`, Adapter Nodemailer 10.0.13 mit eingebauten TypeScript-Typen. Providerneutrales SMTP; Produktion erzwingt TLS und Zertifikatspruefung. Explizites Development-Klartext-SMTP ist nur auf Loopback erlaubt. Verbindungs-/Socketfristen und eine gesamte 25-Sekunden-Grenze begrenzen den Versuch. Dateisystem-/URL-Attachments und Debug-Logging sind gesperrt. Quellen: [SMTP](https://nodemailer.com/smtp), [Kalender-MIME](https://nodemailer.com/message/calendar-events).

`npm run worker:notifications` verarbeitet einen Batch und bereinigt Secrets. Produktion braucht einen externen Scheduler, kontrollierte Neustarts, Alarmannahme und sicheren Key-/SMTP-Zugang. Ablauf wird technisch vor Zugriff erzwungen; physische Bereinigung muss betrieblich fristgerecht laufen. Nach Ausfall/Restore wird vor Versand bereinigt. Lokale Tests belegen keinen laufenden Produktionsscheduler.

## Compliance und Go-live

Am 30.09.2026 mit offiziellen Quellen abgeglichen: Gaeste erhalten beim Erstkontakt die Datenquelle, Kategorien/Zweck und einen klar bezeichneten Link zur vollstaendigen Art.-14-Information. Konkrete Rechtsgrundlagen und Betreiberangaben werden nicht erfunden. Quellen: [EUR-Lex DSGVO](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32016R0679), [EU-Kommission Informationspflichten](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/obligations_en). Weitere Nachweise: [LEGAL-COMPLIANCE-DE](LEGAL-COMPLIANCE-DE.md).

Produktionskonfiguration verlangt GUEST_PRIVACY_URL und PRIVACY_INFORMATION_APPROVED. Die technische Sperre ersetzt keine Text-/Anwendbarkeitspruefung. Vor Go-live offen: Verantwortlicher, Rechtsgrundlagen und Texte, Mail-Provider/AVV/Transfers, Absenderdomain/SPF/DKIM/DMARC, Scheduler/Alarme und praktische Abnahme in mindestens zwei Kalenderclients gemaess ADR-005. MIME-/RFC-Tests ersetzen diese Clientabnahme nicht.

## Tests und Grenzen

Unit-Tests: RFC-Struktur, Escaping, UTF-8, DST, Empfaengerdatensparsamkeit, Retry/Reminder, AES-Kontextbindung, Produktionskonfiguration und SMTP an isoliertem Loopback-Listener. PostgreSQL: atomare Planung/Rollback, doppelte Planung, konkurrierende Worker, Lease-Fencing, Retryfristen, Secretablauf, aktuelle Reminder, entfernte Gaeste, Reihenfolge, ADMIN-Wiederaufnahme und Constraints.

Keine echten E-Mails an Personen: synthetische example.test-Daten und lokale Listener. Keine Outlook-/Teams-Kontointegration. Customer-/Internal-Management, Resetflow, UI und Retention folgen getrennt. Kein E-Commerce, kein automatischer Merge. Finale Suite-/CI-Nachweise stehen im Sprintbericht und der PR.

Lokale Gesamtvalidierung vor Publish: 225 Unit-Tests und 111 PostgreSQL-Tests erfolgreich; frisch migrierte PostgreSQL-17.11-DB und Upgrade von BookingDraft mit Bestandserhalt sowie wiederholtem Deploy erfolgreich. npm ci, Prisma generate/validate, lint, typecheck, build, npm audit (0), Dokumentationspruefung und git diff --check erfolgreich. Der SMTP-Empfaengerlistentest ist enthalten. Dokumentationspruefung: 58 Markdown-Dateien, 1210 Links, 192 IDs und 51 externe URLs; keine Fehler.
