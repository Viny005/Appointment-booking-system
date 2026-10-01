# Sprint 10: Audit, Retention und Security

Basis `feat/internal-appointment-management`, Commit `58f696cf9779906b8bd7cd7108d46f73356a9dd1`; Branch `feat/audit-retention-security`, gestapelte PR gegen diese Basis. Keine alte Migration wird geändert. Maßgeblich: [ADR-008](../adr/008-retention-anonymization.md), [A08](arch/A08-cross-cutting-concepts.md), [B2](spec/B2-batch.md) und [Compliance](LEGAL-COMPLIANCE-DE.md).

## Audit und Datenmodell

Additive Migration `20261001110000_audit_retention_security`: AuditLog, AuditAction, RateLimitBucket, Appointment.piiErasedAt, Erasure-/Cancellation-Constraints. Audit protokolliert Zeitpunkt, Akteurkategorie/interne Referenz, Aktion, Ressourcenreferenz, Version, geänderte Feldnamen und Empfängerzahl; keine Feldwerte, E-Mail-Texte, Freitexte, Passwörter oder Fähigkeiten. SQL begrenzt Aktionen, Ressourcen, Feldnamen, Ergebnis und Grund. Identifizierbare interne Akteure bleiben personenbezogen.

Appointment-Erstellung und Kunden-/interne Mutation schreiben innerhalb derselben Transaktion wie Termin/Outbox. Replay und fachlicher No-op erzeugen keinen zweiten Erfolgsaudit. Gästeentfernung zählt auch den gezielten Cancel-Empfänger; Resend verändert keine Kalendersequenz. Sicherheitsablehnungen werden getrennt vom zurückgerollten Vorgang pro Minute/Akteur/Ressource/Grund aggregiert. Beliebige Actorwerte werden nicht als interne Identitäten übernommen. Audit ist ein Datenbanknachweis, kein manipulationssicheres externes Archiv gegen privilegierte DB-Administratoren.

## Aufbewahrung und Ausführung

`npm run worker:maintenance` ist der reale CLI-Einstieg. Ein Lauf verarbeitet maximal 100 Termine und je Nebenbestand 100 Datensätze; Bibliotheksaufrufe erlauben 1–1000. Betreiber plant mindestens tägliche Ausführung und häufigere Wiederholung bei Rückstand; Wiederanlauf nach Restore führt denselben Prozess aus. Rückgabewerte enthalten nur Zähler, Fehler nur einen festen Code. In Produktion ist `RETENTION_POLICY_APPROVED=true` Voraussetzung, keine automatische rechtliche Freigabe.

Validierte Konfiguration: RETENTION_ENDED_MONTHS=12 und RETENTION_CANCELLED_MONTHS=6; positive ganze Monate bis 120. CONFIRMED nach Ende, COMPLETED und NO_SHOW rechnen ab Ende; CANCELLED ab tatsächlichem cancelledAt. Berlin-Kalendermonate mit Monatsendbegrenzung, bei Herbstmehrdeutigkeit späterer Instant und bei Frühjahrslücke Vorwärtsschiebung. SQL-Auswahl und Temporal-Nachprüfung verwenden dieselbe Regel. Gleichheit ist fällig. Keine Löschung offener zukünftiger Termine, keine Änderung fachlicher Statuswerte oder Kalendersequenz.

Erasure löscht Kundenkontakt, Freitext, Meetingfelder, Tokenhash/-ablauf, Gäste und alle zugehörigen Notification-Nutzlasten, BookingIdempotency und interne Quittungen. Die aktuelle Capability-Quittung wird entfernt; ältere rotierte Capability-Quittungen werden unabhängig anhand ihrer maximalen 24h-TTL bereinigt. Freie Servicebeschreibung wird geleert; der fachliche Servicename-Snapshot bleibt gemäß QS-08 erhalten. Terminzeiten, Service-/Beraterreferenzen, UID und organisatorische Historie bleiben erhalten: ausdrücklich keine vollständige Anonymität. Version steigt einmal. Wiederholung überspringt bereits bereinigte Termine.

Terminzeilen werden mit FOR UPDATE SKIP LOCKED gesperrt; PII-Entfernung, Nebenbestände und Audit committen atomar. Fehler rollen zurück; nächster Lauf wiederholt sicher. Unabhängige kleine Wartungsschritte sind absichtlich einzeln wiederholbar. Abgelaufene Drafts, Buchungs-/Kunden-/interne Quittungen und Rate-Buckets werden begrenzt mit erneutem Ablaufprädikat gelöscht. Verschlüsselte Notification-Secrets werden bei Ablauf entfernt; wartende Aufträge erhalten SECRET_EXPIRED. Historische Notification-Nutzlasten fallen unter Terminretention.

Audit: technischer Entwicklungsstandard zwölf Kalendermonate für Erfolge, dreißig verstrichene Tage für aggregierte Ablehnungen; konfigurierbar über RETENTION_AUDIT_MONTHS (1–120) und RETENTION_DENIAL_DAYS (1–365). Die tatsächliche Zweck-/Fristfreigabe bleibt Betreiberaufgabe. Quellenabgleich am 01.10.2026: [DSGVO Art. 5/25](https://eur-lex.europa.eu/legal-content/DE-EN/TXT/?from=de&uri=CELEX%3A32016R0679). Die Werte sind keine gesetzlichen Fristen.

Bei verspäteter Wartung maskieren interne Listen/Details ab Frist Kunden-/Gast-/Meetingdaten; historische Beraterdaten bleiben berechtigten Akteuren sichtbar. Notification.prepare unterdrückt fällige Daten vor Übergabe an den Transport. Ein bereits an den externen Provider übergebener Versand kann nicht zurückgerufen werden; Bereinigung verhindert neue Vorbereitung und veraltete Lease-Abschlüsse. Providerkopien/Backups benötigen eigene freigegebene Löschregeln.

## HTTP und Rate Limits

Alle bestehenden öffentlichen Draft-/Kundenmutationen und Auth-POSTs verwenden den verpflichtenden Serverwrapper. Exakter konfigurierter Origin, Cross-Site-Ablehnung, JSON, tatsächliches Byte-Limit (Draft 32 KiB, andere 8 KiB), sichere Fehler, no-store/no-referrer. Datenbankausfall beim Schutz führt zu 503 ohne Handleraufruf. 429 enthält Retry-After. PostgreSQL UPSERT serialisiert Zähler über alle Appinstanzen; feste Minutenfenster sind bewusst keine gleitende Rate und ersetzen keinen Netzwerk-DDoS-Schutz.

Defaults gemäß A08: fünf Authversuche je Konto/Minute, dreißig je vertrauenswürdiger IP/Minute. Zusätzlich global 300 Authanfragen/Minute. Öffentliche APIs: 60 je Capability, 120 je vertrauenswürdiger IP, 1200 global/Minute. Alle Schwellen sind über RATE_* aus `.env.example` als positive ganze Zahlen bis 100000 konfigurierbar. Werte vor Produktion mit legitimer Nutzung abnehmen. Kontoschlüssel/IP werden mit Secret-HMAC abgeleitet, Capability-/Scope-Schlüssel nochmals gehasht; kein Klartext in RateLimitBucket. Verschiedene Accounts/IPs teilen nur die explizite globale Notbremse.

Standardmäßig werden X-Forwarded-For/X-Real-IP ignoriert. IP-Limits sind nur aktiv mit TRUSTED_CLIENT_IP_HEADER und TRUSTED_PROXY_ONLY=true: Betrieb muss direkten Appzugriff netzseitig ausschließen und am einzigen vertrauten Gateway den Header **überschreiben**, niemals ungeprüft weiterreichen. Genau eine valide IP, keine Listen; fehlt sie, wird der Request abgewiesen. Ohne diese Topologie bleiben globale und Capability-/Kontolimits aktiv; Produktionsabnahme der Proxy-/Edge-Limits ist ein offener Betriebsnachweis. Keine fingierte IP aus Browserdaten.

## Security Headers

Next.js Proxy erzeugt pro Antwort einen kryptografischen Nonce, überschreibt eingehende Nonce-/CSP-Werte und übergibt die Policy an Rendering und Browser. Rootlayout rendert dynamisch; kein statisch geteilter Nonce. Produktion ohne unsafe-inline/unsafe-eval, base-uri/object/frame-ancestors none, form-action self, eigene Ressourcen. Dev erlaubt ausschließlich zusätzlich Eval und WebSockets für HMR. [Offizielle Next.js-CSP-Dokumentation](https://nextjs.org/docs/app/guides/content-security-policy), geprüft 01.10.2026.

MIME-/Frame-/Permissions-Schutz und no-referrer bleiben aktiv, private dynamische Antworten no-store. HSTS_ENABLED=true nur nach freigegebener HTTPS-Domäne in Produktion; max-age=31536000, keine automatische Subdomain-/Preload-Ausweitung. Lokale HTTP-Tests aktivieren HSTS nicht. Keine Analytics, externen Fonts, CSP-Berichte mit geheimen URLs oder Kundenkonten.

## Anforderungen, Implementierung und Tests

| Anforderung | Implementierung | Nachweis |
|---|---|---|
| AF-22 / ADR-008 / QS-08 | privacy/domain/retention, privacy/infrastructure/retention und maintenance | retention.test.ts in Unit und PostgreSQL: Fristen/DST, tatsächliche Erasure, Historie, Nebenbestände, Rollback, Retry, Parallelität, SKIP LOCKED, verzögerte Jobs |
| NFR-PRIV-03 / QS-14 | Audit-Allowlist, sichere Fehler, Maskierung | audit-security.test.ts, internal-management.test.ts, retention.test.ts |
| NFR-SEC-10 / QS-23 | security/http, rate-limit, Proxy, Rootlayout | security-http.test.ts, security-headers.test.ts, security-headers.spec.ts; echte PostgreSQL-Zählerkonkurrenz |
| NFR-CON-01 / QS-13 | neue SQL-Constraints und Wartungstransaktionen | direkte DB-Schreibtests, alte Upgradepfade plus internal-before/after-audit.sql |

Alle bestehenden Unit-/PostgreSQL-/Browserprüfungen bleiben aktiv. Finale Laufzahlen, Kommandos und beide CI-Links werden im Abschlussbericht und in der PR erfasst. Die lokale Erstprüfung allein bedeutet keine abgeschlossene PR-Validierung.

## Bewusste Grenzen

Vollständige Auth-/Kontoverwaltung folgt Sprint 11; interne/öffentliche UI und Bilder folgen Sprint 12–14. Produktionsprovider, Netzisolation, Scheduler/Alarme, rechtliche Betreiberangaben, Frist-/Backupfreigaben und manuelle Gesamt-Barrierefreiheitsabnahme bleiben Go-live-Gates. Keine Spezifikationslockerung, kein E-Commerce, kein automatischer Merge.

Prisma-Driftprüfung fand einen bereits bestehenden SQL-Fremdschlüssel `reservation_participant`, der bisher nicht im Prisma-Modell abgebildet war. Die Relation ist jetzt mit identischem Namen und referenzierten Spalten modelliert; die historische Migration und ihr DEFERRABLE-Constraint bleiben unverändert. SQL-spezifische CHECK-/Trigger-/GiST-Eigenschaften werden zusätzlich durch Datenbanktests geprüft, da Prisma-Diff diese nicht vollständig abbildet.

## Lokale Abschlussvalidierung 02.10.2026

`npm ci`, Prisma generate/validate, lint, typecheck, 300 Unit-Tests, 183 echte PostgreSQL-Tests, Production Build, fünf Chromium-Browsertests und npm audit (0 Schwachstellen) erfolgreich. Frische PostgreSQL-17-DB sowie geklonter bevölkerter Sprint-9-Bestand: Deploy, Wiederholung, Erhalt von Terminen/Gästen/Outbox/Quittungen und Prisma-Diff ohne Unterschied. Wartungs-CLI gegen frische DB erfolgreich. Historische Migrationen unverändert. Nicht blockierende Toolmeldungen: ESLint-9-Supporthinweis, pg-8-Warnung über zukünftiges Query-Verhalten und Playwright-Farbvariablen; keine Warnung wurde unterdrückt. Finale CI bleibt bis zum PR-Lauf separat nachzuweisen.
