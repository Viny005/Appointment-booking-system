# D2 — Datentypkatalog

## Enumerationen

| Typ | Werte |
|---|---|
| `UserRoleDT` | `ADMIN`, `ADVISOR` |
| `ProfileStatusDT` | `DRAFT`, `ACTIVE`, `INACTIVE` |
| `AppointmentStatusDT` | `CONFIRMED`, `CANCELLED`, `COMPLETED`, `NO_SHOW` |
| `ParticipantRoleDT` | `PRIMARY`, `ADDITIONAL` |
| `MeetingModeDT` | `IN_PERSON`, `PHONE`, `ONLINE` |
| `MeetingModePolicyDT` | `FIXED`, `CLIENT_CHOICE` |
| `PhoneDirectionDT` | `ADVISOR_CALLS_CLIENT` (Standard), `CLIENT_CALLS_ADVISOR` |
| `AvailabilityExceptionTypeDT` | `BLOCK_DAY`, `REPLACE_DAY`, `ADD_INTERVAL` |
| `NotificationTypeDT` | `BOOKING_CONFIRMATION`, `BOOKING_CHANGED`, `BOOKING_CANCELLED`, `REMINDER`, `PASSWORD_RESET` |
| `NotificationStatusDT` | `PENDING`, `SENT`, `FAILED`, `SUPERSEDED` |

`SUPERSEDED` bezeichnet ausdrücklich verworfene, noch nicht versandte Aufträge, z. B. nach einer Umbuchung oder Tokenrotation. Es ist kein Versandfehler.

## Meetingwerte und Validierung

| Wert | Vertrag |
|---|---|
| `MeetingModeConfigurationDT` | `meetingModePolicy` und nichtleere, duplikatfreie `allowedMeetingModes`. Bei `FIXED` genau ein Modus; bei `CLIENT_CHOICE` Auswahl aus allen konfigurierten Modi. |
| `InPersonMeetingDT` | Nichtleere Ortsbezeichnung und vollständige, verständliche Besuchsadresse, zusammen höchstens 1000 Zeichen. Die optionale Kundenadresse ersetzt den Treffpunkt nicht. |
| `PhoneMeetingDT` | Anrufrichtung erforderlich. Standard: Berater ruft die obligatorische Kundentelefonnummer an. Bei ausdrücklich konfiguriertem `CLIENT_CALLS_ADVISOR` ist eine Beraternummer erforderlich und wird klar angezeigt. |
| `OnlineMeetingDT` | Manuell konfigurierte HTTPS-URL (maximal 2048 Zeichen, absolut, ohne URL-Benutzername/Passwort) und Providerbezeichnung (maximal 100 Zeichen, z. B. „Manueller Videolink“). V1 erzeugt keine Teams-Meetings. Meetinglinks werden als Text/Link ausgegeben, nie eingebettet oder serverseitig abgerufen. |
| `AppointmentMeetingDT` | Genau ein konkreter Modus plus genau dessen erforderliche Angaben. Serverseitige Prüfung bei Serviceaktivierung, Buchung und Modus-/Meetingänderung. |

Eine Servicekonfiguration ist keine fertige Termin-Instanz. Das System darf insbesondere niemals `CLIENT_CHOICE` in `Appointment.meetingMode` persistieren. [D1](D1-datenmodell.md) und [N2](N2-querschnittskonzepte.md) regeln Snapshot und Änderungen.

## Zeit und Intervalle

- `LocalTimeRangeDT`: lokale Werte `start < end`; ein Tagesintervall überschreitet Mitternacht nicht, andernfalls zwei Tage verwenden.
- Konkrete Zeitpunkte sind UTC-Instants. `SystemSettings.timeZone` ist eine IANA-Zeitzone; V1 erlaubt ausschließlich den Wert `Europe/Berlin`. Ein Zeitzonenwechsel ist keine V1-Adminfunktion, da er wiederkehrende Regeln verändern würde.
- Intervalle sind halboffen `[start,end)`; angrenzende Termine sind erlaubt. Servicedauer ist eine positive ganze Minutenzahl von 1 bis 480 und wird in verstrichenen Minuten gemessen.
- `BookingWindowDT`: `minimumLeadTime = 24h` als verstrichene Stunden, `maximumHorizon = 3` Kalendermonate in `timeZone`. Öffentlicher Start liegt einschließlich zwischen `now + 24h` und dem Horizont; fehlenden Monatstag auf letzten Monatstag kürzen. Gesamte Dauer muss in der gemeinsamen Verfügbarkeit liegen.
- Interne Umbuchung darf Mindestvorlauf unterschreiten, aber keine neue Startzeit in der Vergangenheit oder jenseits des Horizonts setzen. Kundenänderung/-storno verlangt streng mehr als 24 Stunden Restzeit; genau 24 Stunden ist gesperrt.
- `SlotStepDT`: initial 30 Minuten; zulässig 15, 30 oder 60 Minuten, Raster ab lokaler Mitternacht.
- Im Frühjahrswechsel existiert `29.03.2026 02:30 Europe/Berlin` nicht und erzeugt keinen Slot. Im Herbst sind `25.10.2026 02:30 CEST (UTC+02:00)` und `25.10.2026 02:30 CET (UTC+01:00)` zwei verschiedene Instants. UI, Zusammenfassung und interne Ansicht kennzeichnen beide eindeutig; serverseitig zählt der ausgewählte Instant.
- `ReminderPolicyDT`: Standard 24 Stunden vor Start. Ermittlung mit einem nach Sperrerwerb erfassten `now`. Bei Neuanlage oder Umbuchung wird ein Erinnerungsauftrag nur erzeugt, wenn `start - 24h > now`; bei Gleichheit oder Vergangenheit entfällt er, die Bestätigung/Änderungsbestätigung reicht. Nach Terminbeginn kein nachträglicher Versand.

## Kontaktdaten und Eingabegrenzen

| Wert | Zweck und Grenze |
|---|---|
| Vorname / Nachname | Zuordnung des Termins zur buchenden Person; Pflicht, je 100 Zeichen. |
| `EmailAddressDT` | Bestätigung und Kundenverwaltung; Pflicht, syntaktisch gültig, maximal 254 Zeichen. Domain normalisieren, keine unbestätigten Mailbox-Aliasregeln anwenden. |
| `PhoneNumberDT` | Kurzfristige organisatorische Kontaktaufnahme und bei Telefonterminen vereinbarter Anruf; in allen Modi Pflicht, maximal 32 Zeichen, normalisiert ohne Beschränkung auf ein Land. |
| Kundenadresse | Optional, ausschließlich vom Kunden gewünschte organisatorische Adressangabe zum Termin; keine Pflicht und keine Nutzung für Marketing. Maximal 500 Zeichen. |
| Wünsche/Anmerkungen | Optionale Vorbereitung des konkreten Termins, maximal 2000 Zeichen; Hinweis, keine unnötigen sensiblen Informationen einzutragen. |
| Gäste | Höchstens zehn eindeutige E-Mail-Adressen. Keine Adresse darf der Kundenadresse oder einer tatsächlichen Berateradresse entsprechen. Nur Terminorganisation, keine Verwaltungsberechtigung. |

Alle Texte: Rand-Leerraum entfernen, HTML nicht ausführen, kontextbezogen ausgeben. Rechtsinformationen zum Erhebungszeitpunkt und zu eingeladenen Gästen stehen in der [Deutschland-Checkliste](../LEGAL-COMPLIANCE-DE.md).

## Sitzung und Aufbewahrung

- `SessionPolicyDT`: 30 Minuten Inaktivität, maximal acht Stunden absolut; serverseitige Prüfung und sofortige Widerrufbarkeit.
- `RetentionPolicyDT`: 12 Kalendermonate ab Ende für `COMPLETED`, `NO_SHOW` und vergangenes `CONFIRMED`; sechs Kalendermonate ab Stornierungszeit für `CANCELLED`. Fristende einschließlich. Umsetzung verwendet diese Startwerte; finale Betreiber-/Rechtsprüfung ist Go-live-Voraussetzung.
- Kunden-/Gäste-PII, freie Texte und geheime Versandkopien entfernen; fachliche Terminmetadaten und historische Beraterreferenzen können bleiben. Das verspricht keine vollständige Anonymität dieser internen Referenzen.

## Profilfoto

`ProfileImageDT`: ausschließlich JPEG, PNG oder WebP; höchstens 5 MiB Upload, Breite und Höhe jeweils höchstens 4096 Pixel und größer null. Server prüft tatsächlichen Dateityp, dekodiert mit Ressourcenlimit und kodiert ein statisches Bild neu, entfernt Metadaten und generiert den Objektnamen. Mehrbild-/Animationsdateien, SVG und ausführbare Inhalte werden abgelehnt. Weitere Regeln: [NFR-SEC-09](N1-nichtfunktional.md#nfr-sec-09).
