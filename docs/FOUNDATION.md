# Foundation-Sprint

Basis: Merge `ca80b1e4bc71498ec8c03c217e2582d4ee6706b8`, Branch `feat/project-foundation`; neuer GitHub-Clone außerhalb OneDrive.

## Umfang

App Router, TypeScript, Tailwind und ESLint, schlichte Statusseite, frameworkfreie Sessionpolicy und Application-Ports, Prisma-/Better-Auth-Adapter, Server-Guard und DB-Health. Noch kein Booking Wizard oder fachliches Feature.

Prisma-Modelle: User (interne Identität, ADMIN/ADVISOR, active), Account, Session (lastActivityAt), Verification. Foreign Keys und eindeutige E-Mail/Token/Provideridentität. Migration `20260929193000_identity_foundation`; keine Appointment-/Profil-/Availability-Tabellen. User.image ist nur ein optionales Bibliotheksfeld.

Better Auth übernimmt scrypt, Credentials und DB-Sessions. Registrierung ist über Bibliotheksoption und HTTP-Allowlist gesperrt. Nur Sign-in, Sign-out und minimale Sessionprojektion sind verfügbar. Der gemeinsame Guard prüft aktive Nutzer und exakt 30 Minuten Idle/acht Stunden absolut. Normale Abfragen verlängern die Sitzung nicht. Kontoverwaltung, Rollenänderung, Reset und deren Sicherheitsgeneration sowie Appointment-Ownership bleiben nach Sprintauftrag ausstehend; entsprechende Mutationen sind nicht angeboten. Kein vollständiger QS-27-Nachweis.

## Versionen und Anpassungen

Registry-Verfügbarkeit und Peers vor Installation geprüft: Next 16.3.7, React/ReactDOM 19.3.0, TypeScript 5.9.3, Prisma/Client/pg-Adapter 7.10.0, Better Auth 1.7.6. Node 24.15.0, PostgreSQL-Image 17.11. Keine Abweichung der Hauptbaseline.

Zusätzlich Tailwind/PostCSS-Plugin 4.3.3, Vitest 5.0.2, tsx 4.23.15, pg 8.23.0. ESLint 9.39.5 bleibt gepinnt: Die mit eslint-config-next 16.3.7 gelieferten React-/Import-/a11y-Plugins unterstützen ESLint 10 noch nicht (Peerbereich und tatsächlicher Rule-Fehler). npm meldet ESLint 9 als deprecated; koordinierter Toolchain-Upgrade bleibt Wartungsarbeit.

Die erste Installation meldete vier hohe Audit-Einträge über transitive Pakete. Overrides auf deepmerge-ts 8.0.0 und mysql2 3.24.5 beheben die gemeldeten Rekursions-/MySQL-Probleme ohne Änderung von Prisma/Better Auth. deepmerge-ts überschreibt bewusst den bisherigen 7er-Bereich der Prisma-Konfiguration; Config-Laden, Generate, Validate und Migration werden daher geprüft. MySQL wird fachlich nicht verwendet. Danach meldet npm audit 0 Schwachstellen. Overrides nach Upstream-Fix überprüfen und möglichst entfernen.

## Tests und Grenzen

Unit-Tests: Sessiongrenzen, Kontostatus, abgelaufene/revozierte Session, Polling versus Aktivität, Health-Port, Auth-Konfiguration und gesperrte Routen. DB-Suite: PostgreSQL 17, echte Anmeldung, persistierte Session, Idle/Kontostatus, Logout, Registrierungsverbot und Health-Probe. CI prüft Migrationen und Seed-Wiederholung gegen getrennte Datenbanken.

Der lokale Docker-Client ist vorhanden, der Linux-Daemon jedoch nicht erreichbar. Lokale DB-Tests werden nicht behauptet. Der GitHub-Runner hat dagegen alle Schritte erfolgreich gegen PostgreSQL 17.11 ausgeführt: Migration, zweite Anwendung ohne Änderungen, DB-/Auth-Suite, Development-Seed und Wiederholung ohne Überschreiben.

Nachweis vom 29.09.2026: GitHub Actions Lauf 36620295755, Commit 529a4c32257a9ea073b5702a44254988c691c08e, Ergebnis success. npm ci, Prisma Generate/Validate/Migrate, lint, typecheck, Unit-/Integrationstests, Seed und Build jeweils erfolgreich. Lokal ebenfalls npm install, lint (0 Fehler/Warnungen), typecheck, 15 Unit-Tests, Build, prisma validate und git diff --check bestanden; npm audit 0 Schwachstellen. Produktionsserver-Smoke: Startseite HTTP 200, ohne DB Health HTTP 503 mit ausschließlich status/unavailable und no-store. CI prüft den gesunden DB-Pfad mit HTTP 200. Kein Secret in den versionierten Dateien; .env und lokale Varianten sind ignoriert.

Noch ausstehend: vollständige Auth-Verwaltung/Reset samt Sicherheitsgeneration, verteiltes Rate-Limit bei Skalierung, Nonce-CSP und produktive HSTS-Freigabe, Rechtstexte und fachliche Buchungsfunktionen. Basisheader sind vorhanden; keine Produktionsfreigabe. Mail-/Storage-Variablen sind reservierte lokale Konfiguration ohne Outbox, Versand oder Uploadadapter. Keine Kundenkonten oder E-Commerce-Funktionen.

Anleitung: [README](../README.md). Sollbild: [A05](arch/A05-building-block-view.md), [ADR-011](../adr/011-authentication-library.md). Die [Go-live blockers](OPEN-QUESTIONS.md) bestehen weiter.
