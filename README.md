# Appointment Booking System

Webanwendung zur Buchung und Verwaltung von Beratungsterminen. Kunden wählen ohne Benutzerkonto einen Berater, dessen Terminservice, tatsächliche Teilnehmer und einen gemeinsam verfügbaren Zeitpunkt. Berater pflegen eigene Kalender; Administratoren verwalten Profile, Services, Beziehungen und Zugriffsrechte.

**Ausschließlich Terminorganisation:** keine Verkäufe, Preise, Warenkörbe, Bestellungen, Zahlungen oder sonstigen E-Commerce-Funktionen. Ein „Service“ bezeichnet einen Termintyp mit Dauer und Besprechungsmodus, kein Verkaufsprodukt.

## Projektstatus

Stand: 2026-10-04. Die lokale Anwendung deckt den vollständigen Kernablauf ab: öffentliche Buchung ohne Kundenkonto, DST-sichere Verfügbarkeit, atomare Mehrberater-Reservierung, serverseitige Drafts, Notifications/ICS, sichere Kundenverwaltung, interne Terminverwaltung, Rollen-/Sessionverwaltung, Audit/Retention, Profilbilder sowie öffentliche Beraterseiten.

Der [Sprint 18](docs/SPRINT18-SERVICE-CATALOG.md) ergänzt einen zentralen Leistungskatalog: Administratoren können Leistungen unabhängig von Profilen anlegen, bearbeiten, löschen und profilweise freischalten/sperren; individuelle Profilleistungen bleiben parallel möglich. Historische Termine behalten ihre Leistungssnapshots.

Technische Produktionsgrenzen und noch ausstehende Betreiberentscheidungen sind ausdrücklich getrennt. Der providerneutrale [Deployment-Runbook](docs/PRODUCTION-DEPLOYMENT-RUNBOOK.md) und die [Entscheidungsmatrix](docs/PRODUCTION-DECISIONS.md) beschreiben den Weg von Staging bis Go-live. Eine technisch erfolgreiche lokale Abnahme ist keine rechtliche oder betriebliche Produktionsfreigabe.

## Dokumentation

| Einstieg | Inhalt |
|---|---|
| [Dokumentationsübersicht](docs/README.md) | Lesepfade und Konventionen |
| [Spezifikation nach Siedersleben](docs/spec/README.md) | Ziele, Prozesse, Anwendungsfälle, Daten, Dialoge, Qualität |
| [Architektur nach arc42](docs/arch/README.md) | Alle zwölf Architekturkapitel |
| [Architecture Decision Records](adr/README.md) | Kontext, Alternativen, Entscheidung und Folgen |
| [Rückverfolgbarkeit](docs/TRACEABILITY.md) | Anforderungen → Architektur → geplante Abnahme |
| [Offene Entscheidungen](docs/OPEN-QUESTIONS.md) | Verantwortlichkeiten und Entscheidungstermine |
| [Design-Leitlinien](DESIGN.md) | Vorgaben für die spätere Oberfläche |
| [Quellen und Anpassungen](docs/SOURCES.md) | Archivherkunft, strukturelle Referenzen und Ergänzungen |
| [Dokumentationsprüfung](docs/VALIDATION.md) | Prüfumfang und reproduzierbarer Ablauf |

Die deutsche Dokumentationssprache und Dateinamen der gelieferten Vorlage bleiben erhalten. Die Gliederung orientiert sich an Herold; Fachinhalt und Architektur beziehen sich ausschließlich auf Terminbuchungen.

## Beitrag und Review

Fachliche Änderungen beginnen in `docs/spec/`; technische Entscheidungen folgen in `docs/arch/` und `adr/`. Stabile IDs werden nicht für andere Anforderungen wiederverwendet. Die Rückverfolgbarkeit wird im selben Commit aktualisiert. Dokumentationsprüfungen: `python tools/check_docs.py` und `git diff --check`. Der Prüfer benötigt nur Python 3 und ist kein Anwendungscode.

Die aktuelle lokale Vorbereitung der Produktionslaufzeit erfolgt auf `sprint19/production-runtime-preflight`, gestapelt auf dem lokal validierten Sprint 18. Sprint-Commits werden lokal validiert und erst nach manueller Abnahme/CI gepusht bzw. gemergt. Eine Freigabe der Dokumentation oder der lokalen Tests ist keine Produktionsfreigabe.

## Lokal starten

Voraussetzungen: Node.js **24.15.0** (`.nvmrc`, Node 24 LTS), npm 11 und Docker mit laufendem Linux-Daemon. PostgreSQL **17.11** läuft über Compose; alternativ PostgreSQL 17 lokal bereitstellen.

1. `npm ci` ausführen.
2. `.env.example` nach `.env` kopieren: PowerShell `Copy-Item .env.example .env`, POSIX `cp .env.example .env`.
3. `BETTER_AUTH_SECRET` ersetzen: `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Den Zufallswert ausschließlich in die ignorierte `.env` übernehmen. Die DB-Beispielwerte niemals produktiv verwenden.
4. `docker compose up -d --wait postgres`.
5. `npm run prisma:generate`, `npm run prisma:validate`, `npm run prisma:migrate`.
6. Optional den Development-Seed ausführen, siehe unten.
7. `npm run dev`; Anwendung unter `http://localhost:3000`.

`GET /api/health` liefert bei erreichbarer DB HTTP 200 mit `{"status":"ok"}`, sonst HTTP 503 mit `{"status":"unavailable"}`. Keine Verbindungsdetails werden ausgegeben. Compose bindet PostgreSQL ausschließlich an 127.0.0.1. `docker compose stop` erhält die Daten.

Neue Migrationen: `npm run prisma:migrate:dev -- --name beschreibung`; SQL prüfen und einchecken. Vorhandene Migrationen werden mit `prisma:migrate` nichtinteraktiv angewendet. Generierter Prisma Client unter `src/generated/prisma` bleibt ignoriert und wird nach Checkout/Schemawechsel neu erzeugt.

## Development-Administrator

Der Seed erlaubt ausschließlich `NODE_ENV=development`, eine Loopback-DB namens `appointment_dev` und eine Adresse unter `example.test`. `SEED_ADMIN_PASSWORD` muss mindestens 16 Zeichen haben und nur lokal bereitgestellt werden. Kein echtes Passwort liegt im Repository. PowerShell:

```powershell
$env:NODE_ENV = 'development'
$env:SEED_ADMIN_PASSWORD = '<eigenes zufälliges lokales Passwort>'
npm run prisma:seed
Remove-Item Env:SEED_ADMIN_PASSWORD
Remove-Item Env:NODE_ENV
```

POSIX: `NODE_ENV=development SEED_ADMIN_PASSWORD='<eigenes zufälliges lokales Passwort>' npm run prisma:seed`. Der Seed erstellt `admin@example.test` als ADMIN mit Better-Auth-Passworthash. Er protokolliert keine Zugangsdaten und verändert bei Wiederholung weder bestehende Konten noch Passwörter. Niemals für Produktion verwenden.

## Auth-Basis

Interne Nutzer melden sich unter `/login` mit E-Mail/Passwort an. `/internal` ist serverseitig geschützt und routet ADMIN bzw. ADVISOR in getrennte Einstiegsbereiche. `POST /api/auth/sign-out` widerruft die Sitzung. Öffentliche Registrierung, Kundenkonten und Browser-gesteuerte Rollenfelder bleiben gesperrt.

Sessions liegen in PostgreSQL ohne Cookiecache. Der gemeinsame Guard prüft Kontostatus, Sicherheitsgeneration, Passwortmutationsstatus, exakt 30 Minuten Idle und acht Stunden absolut. Deaktivierung und Rollenwechsel widerrufen Sitzungen. `/forgot-password` und `/reset-password` verwenden einen allgemeinen, 30 Minuten gültigen Einmalablauf; Resetlinks liegen nur kurzlebig verschlüsselt in der Outbox und erfolgreicher Reset widerruft Sitzungen sowie weitere Resetnachweise. Details: [Admin-Foundation-Sprint](docs/INTERNAL-ADMIN-FOUNDATION-SPRINT.md).

## Tests und Build

```sh
npm run prisma:generate
npm run prisma:validate
npm run lint
npm run typecheck
npm test
npm run build
```

`npm start` startet den Produktionsbuild. Für produktive Auth muss BETTER_AUTH_URL HTTPS verwenden; lokale HTTP-Entwicklung nutzt `npm run dev`. Build und Unit-Tests benötigen weder Live-DB noch echte Secrets.

## Staging und Produktion

Das Repository enthält ein providerneutrales `Dockerfile`. Die Runtime läuft als unprivilegierter Benutzer und enthält die Produktionswerkzeuge für Prisma-Migrationen sowie die one-shot Notification-/Maintenance-Jobs. `PROFILE_IMAGE_DIR` muss in Produktion auf persistenten Speicher zeigen; das Docker-Image setzt absichtlich keinen stillen persistenten Default.

Vor Staging: `npm run staging:preflight`. Vor Go-live: `npm run production:preflight`. Der strikte Produktionslauf prüft zusätzlich HTTPS, HSTS sowie explizite Privacy-/Retention-Freigaben. Der vollständige Ablauf steht im [Deployment-Runbook](docs/PRODUCTION-DEPLOYMENT-RUNBOOK.md); noch offene Provider-/Betreiberentscheidungen in [PRODUCTION-DECISIONS](docs/PRODUCTION-DECISIONS.md).

Beispiel Build: `docker build -t appointment-booking:<version> .`. Secrets werden niemals in das Image kopiert, sondern erst zur Laufzeit über den Secret-Store der gewählten Plattform injiziert.

DB-Tests benötigen eine separate `appointment_test`: `docker compose exec postgres createdb -U appointment appointment_test`. Beispiel PowerShell mit lokalen Beispielzugangsdaten:

```powershell
$env:DATABASE_URL = 'postgresql://appointment:local-development-only@127.0.0.1:5432/appointment_test'
$env:TEST_DATABASE_URL = $env:DATABASE_URL
npm run prisma:migrate
npm run test:integration
Remove-Item Env:DATABASE_URL
Remove-Item Env:TEST_DATABASE_URL
```

Unter POSIX beide Umgebungsvariablen entsprechend exportieren und nach dem Test wieder entfernen. Die Suite verweigert Datenbanknamen ohne `_test`, erstellt eigene Fixtures und löscht ausschließlich diese. Kein Datenbankreset. Ein expliziter Integrationslauf ohne Test-DB schlägt fehl statt still zu überspringen. GitHub Actions stellt PostgreSQL 17.11 bereit und prüft zusätzlich Migrationen und Seed-Wiederholung.

## Struktur

`src/app`: App Router mit öffentlicher Buchung, Kundenverwaltung und internen Admin-/Advisor-Oberflächen. `src/modules/{booking,availability,profiles,appointments,identity,notifications}` trennen Domain/Application/Infrastruktur. `src/shared`: gemeinsame Ports, DB-Infrastruktur und serverseitige Web-Komposition. Domain/Application importieren weder Next/React noch Prisma/Infrastruktur; ESLint schützt diese Grenze. `prisma`: Schema, additive Migrationen und Development-Seed. `tests`: Unit-, PostgreSQL-Integration- und Browsertests.

## Implementierungsbereitschaft

[READY-FOR-IMPLEMENTATION](docs/READY-FOR-IMPLEMENTATION.md) dokumentiert die getroffenen Entwicklungsentscheidungen und die Startcheckliste. [LEGAL-COMPLIANCE-DE](docs/LEGAL-COMPLIANCE-DE.md) trennt technische Pflichten von noch ausstehenden Betreiberfreigaben vor Produktion. Die Dokumentationsbaseline ist von den implementierten Sprints und deren jeweiligen Nachweisen getrennt.

[Audit-/Retention-/Security-Sprint](docs/AUDIT-RETENTION-SECURITY-SPRINT.md): transaktionaler Audit, konfigurierbare Bereinigung, HTTP-Schutz und Nonce-CSP. `npm run worker:maintenance` führt einen begrenzten Wartungslauf aus; Scheduler und Produktionsfreigaben bleiben Betriebsaufgaben.
