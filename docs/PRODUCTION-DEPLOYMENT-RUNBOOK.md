# Produktions- und Staging-Runbook

Stand: 04.10.2026. Dieses Runbook ist providerneutral. Es beschreibt den technischen Betriebsvertrag der Anwendung, ohne einen Hosting-, Datenbank-, Mail-, Storage- oder Monitoring-Anbieter vorwegzunehmen.

## 1. Laufzeitvertrag

Die produktive Anwendung benötigt:

| Komponente | Anforderung | Kommando / Probe |
|---|---|---|
| Web-App | Node.js 24, Next.js 16 | `npm run start -- -H 0.0.0.0 -p 3000` |
| PostgreSQL | PostgreSQL 17, TLS/zugriffsgeschützt | `npm run prisma:migrate` vor App-Freigabe |
| Notification-Job | One-shot Job, überwacht | `npm run worker:notifications` |
| Maintenance-Job | One-shot Job, überwacht | `npm run worker:maintenance` |
| Profilbilder | persistenter, schreibbarer Speicher | `PROFILE_IMAGE_DIR` |
| Mail | SMTP mit TLS | `MAIL_*` |
| Liveness | DB erreichbar | `GET /api/health` |
| Readiness | DB + vollständige Produktionskonfiguration | `GET /api/ready` |

Die Worker sind absichtlich keine Endlosschleifen. Der Plattform-Scheduler startet sie wiederholt. Für die kleine V1 wird der Notification-Job mindestens einmal pro Minute eingeplant; der Maintenance-Job einmal täglich. Der Scheduler soll überlappende Instanzen vermeiden bzw. auf eine Instanz begrenzen. Fehlgeschlagene Runs müssen alarmiert werden.

## 2. Umgebungen

Es gibt mindestens drei getrennte Umgebungen:

1. **lokal** – aktuelle Entwicklungsdaten, niemals öffentlich;
2. **staging** – eigene DB, eigenes Storage, eigene Secrets, Test-/Sandbox-Mail, ausschließlich Testdaten;
3. **production** – eigene DB, eigenes Storage, eigene Secrets und freigegebene reale Betreibertexte.

Keine Datenbank, Secrets, Tokens, Profile-Images oder Mail-Credentials werden zwischen Staging und Production geteilt.

## 3. Technischer Preflight

Vor einem Staging-Deploy:

```bash
npm run staging:preflight
```

Dieser Lauf prüft die technische Infrastruktur, simuliert aber keine Betreiberfreigabe im echten Prozess. Er prüft insbesondere:

- Pflichtkonfiguration;
- HTTPS-Ursprung;
- Secret-Mindestlänge;
- gültigen 32-Byte-AES-Key für die Notification-Outbox;
- syntaktisch gültige SMTP-/Mail-Konfiguration;
- gültige Retention-Werte;
- Datenbankzugriff;
- vollständigen Stand aller Repository-Migrationen;
- schreibbaren Profilbild-Speicher.

Vor Production:

```bash
npm run production:preflight
```

Der Produktionslauf bleibt blockiert, solange `PRIVACY_INFORMATION_APPROVED`, `RETENTION_POLICY_APPROVED` oder `HSTS_ENABLED` nicht ausdrücklich freigegeben wurden.

## 4. Deployment-Reihenfolge

### Staging

1. neue unveränderliche App-Version/Image bauen;
2. Staging-Secrets injizieren;
3. Staging-DB sichern, wenn bereits Daten existieren;
4. `npm run prisma:migrate`;
5. `npm run staging:preflight`;
6. Web-App deployen;
7. `/api/health` und `/api/ready` prüfen;
8. Notification- und Maintenance-Jobs konfigurieren;
9. Browser-Smoke-Test durchführen;
10. Upload/Anzeige eines Profilbilds prüfen;
11. Testbuchung inkl. Mail, Änderung und Storno durchführen;
12. Backup und isolierten Restore der Staging-Version testen.

### Production

1. freigegebenen Commit/Tag auswählen;
2. CI-Ergebnis und Dependency-Review prüfen;
3. Datenbank- und Media-Backup anlegen;
4. `npm run production:preflight`;
5. `npm run prisma:migrate`;
6. nochmals `npm run production:preflight`;
7. App-Version ausrollen;
8. `/api/health` und `/api/ready` überwachen;
9. Scheduler-Jobs aktivieren/prüfen;
10. öffentliche Kernpfade und interne Anmeldung smoke-testen;
11. eine reale Testmail an kontrollierte Adresse senden;
12. Deployment im Betriebsprotokoll dokumentieren.

Historische Migrationen werden niemals geändert. Es gibt keine automatische Down-Migration.

## 5. Rollback

Ein App-Rollback verwendet die vorherige unveränderliche App-Version gegen das vorwärtskompatible Schema. Bei einer fehlerhaften additiven Migration wird zuerst die Anwendung gestoppt bzw. schreibend gesperrt und die Lage bewertet. Ein Datenbank-Restore ist kein normaler Rollback-Schritt, weil er nach dem Backup entstandene Buchungen verlieren kann.

Restore wird nur gegen ein isoliertes Ziel geprobt:

```bash
npm run db:restore -- <dump-file>
npm run prisma:migrate
npm run staging:preflight
```

Danach werden Datenintegrität, Profilbilder, Termine, Notifications und Retention geprüft.

## 6. Persistente Daten

Ein vollständiges Betriebsbackup umfasst mindestens:

- PostgreSQL Custom-Format-Dump;
- gesamten Inhalt von `PROFILE_IMAGE_DIR`;
- Referenz auf die App-Version/Commit;
- dokumentierte Secret-Versionen, aber **keine Secrets im Backup-Manifest des Repositories**.

DB-Dump und Profilbilder müssen zu einem gemeinsamen Wiederherstellungszeitpunkt passen.

## 7. Secrets

Production erhält neue, voneinander unabhängige Werte für:

- `DATABASE_URL`;
- `POSTGRES_PASSWORD`, soweit selbst verwaltetes PostgreSQL verwendet wird;
- `BETTER_AUTH_SECRET` (mindestens 32 Zeichen);
- `OUTBOX_ENCRYPTION_KEY` (exakt 32 zufällige Bytes, Base64);
- `MAIL_USER` / `MAIL_PASSWORD`;
- mögliche Provider-/Storage-Credentials.

Secrets liegen ausschließlich im Secret-Store der Plattform. Keine Production-`.env` wird committet.

## 8. Mail

Vor Freigabe sind nachzuweisen:

- TLS-Verbindung zum SMTP-Provider;
- Absenderdomain und `MAIL_FROM`;
- SPF;
- DKIM;
- DMARC-Entscheidung;
- erfolgreiche Bestätigung, Änderung, Storno und Passwort-Reset;
- Bounce-/Fehlerbeobachtung;
- Alarm auf wiederholt fehlgeschlagene Outbox-Zustellungen.

## 9. Monitoring und Alarme

Mindestens überwacht werden:

- `/api/health`;
- `/api/ready`;
- HTTP-5xx-Rate;
- DB-Erreichbarkeit/Connection-Pool;
- Notification-Job Exitcode und Rückstau;
- Maintenance-Job Exitcode;
- Backup-Alter und Backup-Fehler;
- Storage-Füllstand;
- Zertifikatsablauf;
- ungewöhnliche Auth-/Rate-Limit-Ereignisse ohne Speicherung unnötiger personenbezogener Inhalte.

Logs dürfen keine Passwörter, Managementtokens, Draft-Capabilities, vollständigen Formulardaten oder entschlüsselten Outbox-Secrets enthalten.

## 10. Noch erforderliche Betreiberentscheidungen

Technischer Code schließt diese Punkte nicht:

- Domain und Domaininhaber;
- Hosting-Provider und Region;
- PostgreSQL-Provider und Region;
- persistenter Media-/Object-Storage;
- SMTP-/Mail-Provider;
- Monitoring-/Alerting-Provider;
- Backupziel, Frequenz und freigegebene Aufbewahrung;
- echte Betreiber-/Impressumsangaben;
- finale Datenschutztexte und Rechtsgrundlagen;
- finale Retention-Fristen;
- BFSG/BFSGV-Anwendbarkeit;
- VSBG-Position;
- berufliche/regulatorische Angaben;
- öffentliche Profil-/Serviceinhalte.

Die Entscheidungsmatrix steht in [PRODUCTION-DECISIONS.md](PRODUCTION-DECISIONS.md).
