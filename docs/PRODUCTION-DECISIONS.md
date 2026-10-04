# Produktionsentscheidungen

Stand: 04.10.2026. Diese Matrix trennt bereits implementierte Technik von Entscheidungen, die erst mit realen Betreiber- und Providerdaten geschlossen werden können.

| Bereich | Technisch vorbereitet | Noch zu entscheiden / nachzuweisen | Status |
|---|---|---|---|
| Domain | HTTPS-origin, sichere Cookies, HSTS-Gate | endgültiger Domainname, Inhaber, DNS-Ziel | OFFEN |
| Web-Hosting | Node 24 / Next 16, Health/Ready, Dockerfile | Provider, Region, Tarif, Scaling, Logs | OFFEN |
| PostgreSQL | PG17, 13 Migrationen, Backup/Restore | Provider, Region, HA/PITR, Connection-Limit, AVV/DPA | OFFEN |
| Profilbilder | persistenter Dateispeicher abstrahiert | persistenter Volume/Object-Storage, Region, Backup | OFFEN |
| Mail | SMTP/TLS, Outbox, Retry, ICS | Provider, Absenderdomain, Credentials, SPF/DKIM/DMARC | OFFEN |
| Notification-Scheduler | one-shot Worker vorhanden | Scheduler, Frequenz, Alarmierung | OFFEN |
| Maintenance-Scheduler | one-shot Worker vorhanden | Tageszeit, Scheduler, Alarmierung | OFFEN |
| Monitoring | Health-/Ready-Endpunkte, strukturierte Workerlogs | Provider, Alarmempfänger, On-call-Prozess | OFFEN |
| Backups | pg_dump/pg_restore getestet | externes verschlüsseltes Ziel, Frequenz, Retention | OFFEN |
| Staging | providerneutraler Preflight | konkrete Staging-Ressourcen und Test-Mailbox | OFFEN |
| Secrets | Validierung/Readiness vorhanden | Secret-Store, Rotation, Verantwortliche | OFFEN |
| Admin-Sicherheit | Rollen, Sessionwiderruf, Reset, Rate Limits | MFA ja/nein und ggf. Implementierung | OFFEN |
| Betreiber | Platzhalter-/Gate-Konzept | Name/Rechtsform, Anschrift, Kontakt, Vertretung usw. | GO-LIVE-BLOCKER |
| Datenschutz | technische Minimierung/Retention/Informationspunkte | Verantwortlicher, Rechtsgrundlagen, Empfänger, Transfers, finale Texte | GO-LIVE-BLOCKER |
| Retention | konfigurierbare Löschlogik | endgültige fachlich/rechtlich freigegebene Fristen | GO-LIVE-BLOCKER |
| BFSG/BFSGV | WCAG-orientierte technische Basis | Anwendbarkeit/Mikrounternehmen und ggf. Pflichtinformationen | GO-LIVE-BLOCKER |
| VSBG | Platz für öffentliche Pflichttexte | §§36/37-Anwendbarkeit, Teilnahme/Stelle/Prozess | GO-LIVE-BLOCKER |
| Berufliche Angaben | keine erfundenen Angaben im Code | tatsächlicher Status, Register/Aufsicht/Erstinformation soweit anwendbar | GO-LIVE-BLOCKER |
| Dependency Security | Runtime-Audit sauber; bekannte ESLint-Dev-Advisory exakt gegated | Upstream-Fix für GHSA-vfj7-8cjw-p6xm beobachten und Ausnahme entfernen | ÜBERWACHT |
| Tracking/Cookies | V1 ohne Marketing-/Analytics-Tracking | Entscheidung, ob Tracking überhaupt eingeführt wird | OFFEN – Default: NEIN |
| Öffentliche Inhalte | Profile, Bilder, Katalog, vCard | endgültige Texte, Telefonnummern, Orte, Online-Links | OFFEN |
| Branding | responsive UI vorhanden | Produktname, Logo, Favicon, finale Farben/Texte | OFFEN |

## Reihenfolge der Entscheidungen

1. Betreiber und geplanter öffentlicher Domainname;
2. Web-Hosting + Region;
3. PostgreSQL + Backup/PITR;
4. Media-Storage;
5. SMTP/Absenderdomain;
6. Monitoring/Alarmierung;
7. Staging aufbauen und Provider technisch testen;
8. Datenschutz-/Impressums-/Retention-Providerdaten finalisieren;
9. BFSG/VSBG/berufliche Angaben abschließend prüfen;
10. Production-Preflight, Go-live-Abnahme und Veröffentlichung.

Eine Zeile wird erst als **ERLEDIGT** markiert, wenn nicht nur ein Produktname gewählt wurde, sondern auch die dazugehörigen Betriebs- und Compliance-Nachweise dokumentiert sind.
