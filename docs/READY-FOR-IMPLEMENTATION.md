# Bereit für die Implementierung

**Status: READY — Implementation blockers = 0.** Stand: 2026-09-29.

READY bedeutet, dass die fachlichen und technischen Entscheidungen für den ersten Code getroffen sind. Es ist keine Produktionsfreigabe. PR #1 wurde gemergt; aktueller Implementierungsumfang und Prüfungen stehen im [Foundation-Bericht](FOUNDATION.md).

## Fest entschiedener Scope und Stack

Terminbuchung/-verwaltung ohne Kundenkonto; Service bedeutet Termintyp. Keine Verkäufe, Preise, Zahlungen, Warenkörbe, Bestellungen, CRM, Abonnements, Rechnungen, Chat, Marketing/Tracking oder erweiterte Reports. V1 hat ICS-Austausch, keine Kalenderkontosynchronisation und keine automatische Teams-Erstellung.

Modularer Next.js-Monolith mit TypeScript, React, Tailwind-Tokens, PostgreSQL/Prisma und Better Auth. Geprüfte Entwicklungsbaseline: Next.js 16.3.7, React/ReactDOM 19.3.0, TypeScript 5.9.3, Prisma/Client/pg-Adapter 7.10.0, Better Auth 1.7.6, Node.js 24 LTS, PostgreSQL 17.11. Quellen, Alternativen und dokumentarische Kompatibilitätsgrenzen: [ADR-011](../adr/011-authentication-library.md). Kein offener Auth-Bibliotheksentscheid; Laufzeittests erfolgen erst im Implementierungssprint.

## Fachliche Invarianten

- Servicepolicy FIXED/CLIENT_CHOICE und nichtleere allowedMeetingModes; Appointment immer IN_PERSON, PHONE oder ONLINE mit validiertem Snapshot.
- UTC-Instants, V1-Systemzone Europe/Berlin. Herbstinstanzen mit Offset unterscheidbar; Frühjahrslücke erzeugt keinen Slot.
- Neue Buchung ab einschließlich now+24 verstrichenen Stunden bis drei Kalendermonate. Kundenänderung/-storno nur bei mehr als 24 Stunden Restzeit. Bei reminderAt <= now nach Anlage/Umbuchung kein zusätzlicher Sofortreminder.
- Gemeinsame Verfügbarkeit aller tatsächlichen Berater, halboffene Intervalle ohne Pflichtpuffer, transaktionale Revalidierung plus Datenbank-Kollisionsschutz.
- ADMIN verwaltet alle Termine, ADVISOR nur tatsächliche eigene Beteiligung; Profilrelationen geben kein Recht. Interne Details, erlaubte Bearbeitung, Gäste, Resend und COMPLETED/NO_SHOW sind ausdrücklich definiert.
- Resend erzeugt ein neues idempotentes Versandereignis ohne calendarSequence-Änderung. Entfernte Gäste erhalten nur ihren Cancel; verbleibende Beteiligte behalten ihr Ereignis. Keine spätere Nachricht an entfernte Gäste.
- DRAFT/ACTIVE/INACTIVE-Profil und Konto unabhängig. Konto optional; Veröffentlichung nur mit Pflichtdaten/aktivem vollständigem Service. Keine historische Hard-Löschung; letzter aktiver ADMIN geschützt.

Quelle: [Spezifikation](spec/README.md), insbesondere [D1](spec/D1-datenmodell.md), [D2](spec/D2-datentypen.md) und [Ereignismatrix](spec/N2-querschnittskonzepte.md#n211-aenderungen-und-empfaenger).

## Sicherheits- und Datenentscheidungen

Bibliotheksbasierte Passwortkryptografie, DB-Sessions ohne Cookiecache, 30-Minuten-Idle und acht Stunden absolut; serverseitiger Konto-/Rollen-/Ownership-Guard. Reset/Deaktivierung fail-closed, sichere kurzlebige Tokens, keine offene Registrierung. Kunden-PII bleibt aus Logs und fremden Empfängerprojektionen. Getrennte optimistische Version/Kalendersequenz, Termin/Audit/Outbox atomar; Zustellung at-least-once ohne falsches Exactly-once-Versprechen.

Uploads nur ADMIN, JPEG/PNG/WebP bis 5 MiB und 4096 Pixel je Dimension, serverseitig dekodiert/neu enkodiert, metadatenfrei und mit generierten Keys außerhalb ausführbarer Bereiche. Produktions-HTTPS, CSP/Framing-/MIME-/Referrer-/Permissions-Header, HSTS nach Domänenfreigabe; Capability-Seiten ohne Drittinhalte und Cache. WCAG 2.2 AA bleibt verbindlich. Details: [A08](arch/A08-cross-cutting-concepts.md).

Konfigurierbare Retention mit Entwicklungswerten 12/6 Monate, einschließlich freier Texte, Gäste, Outbox und Restore-Nachbereinigung. Betreiberfreigabe der realen Fristen bleibt getrennt.

## Externe Schnittstellen und lokale Entwicklung

[A05](arch/A05-building-block-view.md) definiert MailGateway (lokaler SMTP-Capture/Mailpit und InMemory), MediaStorage (isoliertes Datenvolume/Bildhandler und InMemory), ManualMeetingProvider und CalendarFileGenerator. Entwicklung benötigt keine Produktionsprovider oder Zugangsdaten. Staging/Tests verwenden synthetische Daten, keine echten externen Empfänger. Providerwechsel darf die Domain nicht verändern.

## Was bis Go-live warten kann

Nur die in [OPEN-QUESTIONS](OPEN-QUESTIONS.md) aufgelisteten Betreiber-/Produktionsnachweise: echte Rechtstexte, gesetzliche Qualifikation/Anwendbarkeit, Rechtsgrundlagen/Retention, Provider/AVV/Transfers, Domain/Absender, reale Inhalte sowie technische Betriebs-/Barrierefreiheitsabnahme. [LEGAL-COMPLIANCE-DE](LEGAL-COMPLIANCE-DE.md) und [S3](spec/S3-inbetriebnahme.md) enthalten die Nachweise; kein Platzhalter gilt als erledigt.

## Implementation can start

- [x] Scope, Sprache Deutsch und Arbeitstitel festgelegt.
- [x] Meetings, Änderungen, Rechte, Lebenszyklen und Grenzfälle entschieden.
- [x] Konkrete Auth-Bibliothek und deklarierte Versionskompatibilität dokumentiert.
- [x] Adapterverträge und lokale Implementierungsziele festgelegt.
- [x] Sicherheits-/Datenregeln mit Abnahmefällen verbunden.
- [x] Alle neuen UC/AF/NFR/QS/ADR in [Register](ID-REGISTRY.md) und [Matrix](TRACEABILITY.md) verknüpft.
- [x] Keine offenen fachlichen oder Architekturentscheidungen vor dem ersten Code.

Die Dokumentationsprüfungen stehen in [VALIDATION](VALIDATION.md); der erste Implementierungssprint ist separat im Foundation-Bericht abgegrenzt.
