# 8 Querschnittskonzepte

## 8.1 Authentifizierung und Sessions

- Nur interne Accounts benötigen eine Anmeldung; Kunden besitzen kein Konto.
- Better Auth 1.7.6, scrypt der Bibliothek; konkrete Konfiguration und Zuständigkeiten in [ADR-011](../../adr/011-authentication-library.md).
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
- Systemparameter `timeZone` ist in V1 verbindlich `Europe/Berlin` (IANA); keine stillschweigende Änderung während des Betriebs. Termin hält die verwendete Zone im Snapshot. Eine andere Betriebszone erfordert eigene Migration/Folgeentscheidung, nicht eine freie V1-Adminänderung.
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

## 8.11 Token- und Entwurfslebenszyklus

Kundentoken: mindestens 256 Bit kryptografische Zufälligkeit, nur Hash dauerhaft in Appointment. Gültig bis Terminende, bei Stornierung sofort widerrufen; Rotation widerruft den alten Token. Keine Tokens in Logs, Referrern, Analytics oder ICS. Eine initiale Kundenmail benötigt den Rohwert: ausschließlich dafür kurzlebig verschlüsselte Outbox-Payload im Secret-Key-Kontext; nach erfolgreichem Versand löschen, spätestens nach 24 Stunden. Danach keine alten geheimen Payloads manuell erneut senden, sondern autorisiert einen neuen Link erzeugen. Gast- und Beraternachrichten erhalten nie diese Payload. TLS, `Referrer-Policy: no-referrer` und kein Drittinhalt auf Verwaltungsseiten.

Reset-Token: 30 Minuten, einmalig, Identifikator über Bibliotheksoption gehasht; Sessions nach Reset widerrufen. Sitzungs-ID zufällig im nativen Bibliotheksschema (keine Hash-only-Zusage); Cookie `HttpOnly`, `Secure`, `SameSite=Lax`. Zustandsänderungen nur per Mutation mit CSRF-/Origin-Prüfung, niemals per GET. RBAC und Ressourcenbesitz bei jedem Use Case erneut prüfen.

Entwurf: serverseitig, 30 Minuten Inaktivitäts-TTL, Zugriff nur mit eigenem Cookie; nach Erfolg entfernen. Idempotenzschlüssel bindet an Entwurf und Payload-Hash, 24 Stunden gültig. Derselbe Schlüssel mit anderem Inhalt ergibt Konflikt. Initialer Richtwert: 5 Login-/Resetversuche je Konto und Minute, 30 je IP; öffentliche Buchung separat drosseln. Grenzwerte konfigurierbar und vor Produktion anhand legitimer Nutzung abnehmen.

## 8.12 Outbox-Verarbeitung

Schlüssel regulärer Änderungsaufträge: Termin-ID, Mutations-/Ereignis-ID, Typ und Empfänger. Terminversion und Kalendersequenz sind Payload-Metadaten, nicht alleinige Idempotenzschlüssel. Manuelles Resend erhält eine neue Command-ID; Wiederholung derselben ID erzeugt keinen zweiten Auftrag. Reminder verwenden eine eigene Generation je Zeit-/Statusänderung, damit Metadatenänderung oder Resend keinen weiteren Reminder erzeugen. Datensatz enthält Versuchszähler, Fälligkeitszeit, Lease-Ablauf und bereinigten Fehlercode. Worker übernimmt atomar eine begrenzte Menge; abgelaufene Leases sind wieder übernehmbar. Retry nach 1, 5, 30, 120 und 360 Minuten; danach `FAILED` mit Alarm und autorisierter Wiederaufnahme. Vor Versand prüft er Status und Reminder-Generation; entwertete Reminder werden verworfen. Ereignisse werden pro Termin/Empfänger nach monotoner Ereignisnummer geordnet, auch bei gleicher Kalendersequenz. Bereits entfernte Gäste erhalten keine wartenden normalen Updates, nur den expliziten Entfernungs-Cancel. Befindet sich eine Nachricht schon beim Provider, ist Rückruf nicht garantiert; dies wird als In-flight-Grenze protokolliert. `SENT` bedeutet Providerannahme, keinen Zustellnachweis.

## 8.13 iCalendar und Datenschutzgrenzen

Neue Buchung und Änderung verwenden `METHOD:REQUEST`; kein nicht standardisiertes `METHOD:UPDATE`. Storno verwendet `METHOD:CANCEL` mit gleicher UID, höherer Sequenz und `STATUS:CANCELLED`. UTC-DTSTART/DTEND, DTSTAMP und stabile Organizer-Adresse; Text und Zeilenumbrüche korrekt maskieren. Nur Empfänger und relevante Termininformationen aufnehmen; keine vollständige Gästeliste, Kundenfreitexte oder Tokens. ICS ist ein Austauschformat, keine garantierte Kalendersynchronisation. Dateidownload nur über autorisierten Zugriff; Storno-ICS wird per Nachricht verteilt.

Retention umfasst Kunden-/Gastadressen, Notizen, verschlüsselte Mailkopien und Identifikatoren in technischen Nebenbeständen. Historische Beraterreferenzen bleiben personenbezogen; die Bezeichnung „Anonymisierung“ bezieht sich hier nur auf Kunden/Gäste und verspricht keine vollständige Anonymität des Gesamtdatensatzes. Backup-Löschfenster und Wiederherstellungsbereinigung werden in [A07](A07-deployment-view.md) festgelegt.

Normative Formatreferenzen: [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545) und [RFC 5546](https://www.rfc-editor.org/rfc/rfc5546). Die fachlichen Regeln stehen in [N2](../spec/N2-querschnittskonzepte.md).

## 8.14 Profilfoto-Pipeline

Nur ADMIN darf Profilbilder hochladen/ersetzen; Serviceverwaltungsrechte reichen nicht. Server begrenzt vor Decodierung auf 5 MiB, erlaubt ausschließlich JPEG, PNG und WebP, prüft Signatur und vollständige Decodierung statt Browser-MIME/Dateiendung. Jede Dimension maximal 4096 Pixel; zusätzlich Pixelbudget 16.777.216 und begrenzte Decoder-Ressourcen. Animierte Bilder, SVG und ausführbare Inhalte sind in V1 abgewiesen. Bild serverseitig orientieren, neu enkodieren, EXIF/IPTC/XMP entfernen; Original nie veröffentlichen. Fehler lässt altes Profilbild bestehen.

Objektschlüssel kryptografisch zufällig serverseitig erzeugen, Dateiendung aus dem validierten Ausgabeformat. Browserdateiname wird nicht als Pfad verwendet; Storage akzeptiert ausschließlich definierte opaque Keys, keine Separatoren, `..` oder absoluten Pfade. Schreiben nur in nicht ausführbaren Store. Bildauslieferung mit korrektem MIME und nosniff; öffentliche URL trägt keinen Signatur-/Sitzungssecret.

Ablauf: neues geprüftes Objekt schreiben, Profilreferenz per Versionsprüfung atomar tauschen, alten unreferenzierten Key danach zur idempotenten Löschung vormerken. Fehlschlag beim Referenztausch entfernt das neue verwaiste Objekt; fehlgeschlagene Löschungen werden erneut versucht. Termin-/Profilhistorie benötigt Textsnapshots, kein unveränderliches Originalfoto. Bereinigungsjob entfernt verwaiste temporäre Objekte spätestens nach 24 Stunden.

## 8.15 HTTP-Baseline

| Schutz | Produktionsregel |
|---|---|
| Transport | HTTPS, sichere Cookies; HSTS `max-age=31536000` erst nach Domänenvalidierung, Subdomain-/Preload-Ausweitung nicht automatisch |
| CSP | `default-src 'self'`, `base-uri 'none'`, `object-src 'none'`, `frame-ancestors 'none'`, `form-action 'self'`; Skripte nur eigene Quellen und pro Antwort frischer Nonce, kein unsafe-eval; Styles über eigene Assets/Nonce. Eigene Bilder/Medienhandler; keine pauschalen Drittanbieter-Wildcards. |
| MIME | `X-Content-Type-Options: nosniff`; Content-Type je Ressource korrekt |
| Framing | CSP frame-ancestors none, ergänzend `X-Frame-Options: DENY` |
| Referrer | `strict-origin-when-cross-origin` allgemein; `no-referrer` auf Login, Reset und jeder Verwaltungs-/Bestätigungsseite mit Capability |
| Permissions | `camera=(), microphone=(), geolocation=(), payment=(), usb=()`; diese Browserfunktionen sind für V1 nicht nötig |
| Private Antworten | `Cache-Control: private, no-store`, keine geteilten CDN-/RSC-Caches mit personenbezogenen Daten |

Nonce-CSP verlangt dynamische Antworten auf betroffenen Next.js-Seiten; Build-/Preview-/Produktionsprüfung muss die Hydration ohne Lockerung der Produktionspolicy nachweisen. Development-HMR-Ausnahmen sind ausschließlich lokal. Auf Capability-Seiten keinerlei Drittinhalte, externe Schriftarten, Analytics oder eingebettete Meetings; auch CSP-Reporting darf keine geheimen URLs weitergeben. Bekannte HTTPS-Meetinglinks nur als bewusste Navigation mit `noreferrer`, kein serverseitiges Fetch.

PII gehört nicht in URLs; einziger bewusster Geheimnisfall ist die kurzlebige Management-/Reset-Capability. Zugang am Gateway schon vor Access-Logging redigieren. GET/HEAD verändern keinen fachlichen Zustand; Mutationen verwenden gesicherte POST/PUT/PATCH/DELETE oder Framework-Äquivalent mit CSRF-/Origin-Prüfung. Keine beliebigen Rücksprung-URLs, ausschließlich erlaubte lokale Ziele.

## 8.16 Speicherinventar und Information

Erlaubt sind nur technisch notwendige interne Sessioncookies sowie begrenzte Entwurfs-/CSRF-Speicher. Kein Tracking, Marketing, dauerhafter PII-LocalStorage oder Cookiebanner als Standard. Technische Notwendigkeit, Zweck, Lebensdauer und Empfänger werden im Datenschutztext dokumentiert; neue nicht notwendige Speicher erfordern Prüfung vor Aktivierung.

Kundenhinweis bei Datenerfassung (Art. 13), Gästehinweis bei erster Nachricht (Art. 14) sind versionierte Templatebestandteile. Produktive Betreiberwerte werden durch Konfiguration gesetzt und in S3 geprüft. Pflicht-Telefon dient der Terminabstimmung/Telefonberatung, optionale Adresse der tatsächlich gewünschten Terminorganisation; Freitext erhält Hinweis gegen unnötig sensible Inhalte. Kein künstliches Einwilligungsfeld.

Technische Quellen: [OWASP Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html), [OWASP HTTP-Header](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html), [Next.js CSP](https://nextjs.org/docs/app/guides/content-security-policy). Rechtliche Bewertung und Produktionsgates: [Deutschland-Checkliste](../LEGAL-COMPLIANCE-DE.md).

## 8.17 Konkreter Auth-Guard und Kalenderprojektion

Better Auth übernimmt die Kryptografie; der projektweite Guard erzwingt [ADR-011](../../adr/011-authentication-library.md) inklusive unveränderlicher Acht-Stunden-Grenze, 30-Minuten-Idle, deaktiviertem Cookiecache und aktueller DB-Identität. Die zusätzliche Sicherheitsgeneration bleibt bei Reset-/Deaktivierungsfehlern widerrufen; ohne gültige Generation kein privater Zugriff. Hintergrundpolls verlängern keine Sitzung.

Kundenrufnummern werden nie in ICS übernommen. ADVISOR_CALLS_CLIENT zeigt dort nur die Anrufrichtung; eine geänderte Kundennummer ist allein ein Metadatenupdate. CLIENT_CALLS_ADVISOR darf die konfigurierte öffentliche Beraternummer zeigen. Entfernte Gäste erhalten nur eine empfängerbezogene Absage ihrer alten Einladung, kein CANCEL an verbleibende Empfänger. Manuelles Resend verwendet dieselbe UID/SEQUENCE und erzeugt nur ein neues Versandereignis.
