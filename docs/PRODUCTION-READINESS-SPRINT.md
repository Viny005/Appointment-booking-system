# Sprint 15 – Production Readiness

Branch `feat/production-readiness`, Basis: Sprint 14.

## Technische Produktionsgrenzen

`/api/health` prüft ausschließlich Datenbank-Liveness. `/api/ready` prüft zusätzlich die für Produktion erforderliche Konfiguration, HTTPS-Ursprung, Secret-Mindestlänge, HSTS sowie explizite Privacy-/Retention-Freigaben. Antworten enthalten keine Secrets oder internen Datenbankdetails.

CSP mit Request-Nonce, no-store, no-referrer, nosniff, Frame-/Permissions-Schutz und optionales HSTS sind zentral konfiguriert. HSTS wird in Produktion nur mit HTTPS-Ursprung aktiviert. Interne Sessions und Draft-Cookies bleiben serverseitig kontrolliert.

PostgreSQL 17 ist die Zielversion. Die vorhandene Availability-Migration aktiviert `btree_gist`; `prisma migrate deploy` ist der einzige Produktions-Migrationspfad. Historische Migrationen wurden nicht verändert.

## Backup / Restore

`npm run db:backup -- <datei>` erzeugt mit `pg_dump --format=custom` einen portablen Dump ohne Owner-/Privilege-Übernahme. `npm run db:restore -- <datei>` verlangt zusätzlich `RESTORE_CONFIRMED=true` und ist ausschließlich gegen ein isoliertes Restore-Ziel auszuführen. Nach Restore folgen `prisma migrate deploy`, Health/Readiness, Smoke-Test und Datenintegritätsprüfung. Backups selbst müssen außerhalb der App verschlüsselt, zugriffsbeschränkt und gemäß freigegebener Retention behandelt werden.

Profilbilder liegen über die Storage-Abstraktion außerhalb der Datenbank und müssen in dasselbe betriebliche Backup-/Restore-Konzept aufgenommen werden. Ein DB-Dump allein ist daher kein vollständiges Restore.

## Monitoring und Provider

Provider bleiben konfigurationsgetrieben. Vor Go-live sind SMTP, Hosting, Datenbank, Storage und gegebenenfalls Monitoring mit realen AVV/DPA-, Unterauftragnehmer-, Standort-/Transfer- und Löschangaben freizugeben. Logs dürfen keine Managementtokens, Draft-Capabilities, Passwörter oder Formulardaten enthalten. Alarmierung muss mindestens Readiness, fehlgeschlagene Notification-/Maintenance-Jobs und Backup-/Restore-Tests abdecken.

## Go-live Gates

Die technische Fertigstellung ersetzt keine Betreiberfreigabe. Alle `GO-LIVE-BLOCKER` aus `LEGAL-COMPLIANCE-DE.md` und `OPEN-QUESTIONS.md` bleiben gesperrt, bis reale Betreiberangaben, Rechtsgrundlagen, Providerverträge, Retention, BFSG/BFSGV-Anwendbarkeit, VSBG-Position und WCAG-Abnahme dokumentiert sind.
