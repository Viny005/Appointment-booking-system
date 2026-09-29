<a id="adr-011"></a>
# ADR-011 — Better Auth für interne Passwortanmeldung

**Status:** Accepted

**Datum:** 2026-09-29

## Kontext

Die konkrete Bibliothek muss vor Codebeginn entschieden sein. E-Mail/Passwort, DB-Sitzungen, sofortige Widerrufbarkeit, 30 Minuten Idle, acht Stunden absolut und terminbezogene Autorisierung sind Pflicht. [ADR-004](004-database-sessions-rbac.md) bleibt gültig; diese Entscheidung konkretisiert sie.

## Betrachtete Alternativen

| Option | Bewertung für dieses Projekt |
|---|---|
| Better Auth 1.7.6 | Gewählt: gepflegtes Release, offizielle Next.js- und Prisma-Adapter, Passwort-/Resetablauf und Datenbanksitzungen. Anwendung ergänzt ihre strikten Idle-/Ownership-Regeln. |
| Auth.js Credentials | Credentials delegiert Passwortprüfung, Persistenz und Reset weitgehend an die Anwendung. Für die verlangte vollständige Passwortverwaltung entsteht mehr Integrationslogik; kein Vorteil gegenüber Better Auth. |
| Supabase Auth | Reale Alternative mit Passwortverwaltung und Postgres-Sessions, aber JWT-Zugriff bleibt ohne zusätzliche DB-Prüfung bis Ablauf nutzbar. Separater Auth-Dienst/Providerabhängigkeit ist für diesen Monolithen unnötig. |

Quellen: [Better-Auth-Release](https://github.com/better-auth/better-auth/releases/tag/v1.7.6), [Auth.js Credentials](https://authjs.dev/getting-started/authentication/credentials), [Supabase Sessions](https://supabase.com/docs/guides/auth/sessions).

## Entscheidung

Better Auth 1.7.6 mit offiziellem Prisma-Adapter auf PostgreSQL, ausschließlich interne E-Mail-/Passwortkonten. Öffentliche Registrierung ist deaktiviert. Konten werden durch autorisierte ADMIN-Provisionierung angelegt; der erste ADMIN über einen einmaligen, geschützten Betriebsprozess. Credential-Hashing verwendet die Bibliotheksimplementierung von scrypt, keine eigene Kryptografie. [Passwort-/Reset-API](https://better-auth.com/docs/authentication/email-password).

Konfiguration: `emailAndPassword.enabled=true`, `disableSignUp=true`, `revokeSessionsOnPasswordReset=true`, `resetPasswordTokenExpiresIn=1800`; `verification.storeIdentifier=hashed`; ausschließlich Datenbankpersistenz, kein sekundärer Sessionstore. Serverbetrieb in Node, nicht Edge. Bibliotheksschema und Prisma-Migrationen werden beim ersten Code-Commit erzeugt, geprüft und gelockt. [Prisma-Adapter](https://better-auth.com/docs/adapters/prisma), [Next.js-Integration](https://better-auth.com/docs/integrations/next), [Konfigurationsoptionen](https://better-auth.com/docs/reference/options).

## Verantwortungsgrenzen

- Bibliothek: Passwort-Hash/Prüfung, signierte sichere Sessioncookies, DB-Sessionanlage, Login/Logout, Reset-Token-Erzeugung und Einmalverbrauch. Sessiontoken liegen im nativen Bibliotheksschema, nicht entgegen der API als behauptete Hash-only-Spalte; DB-/Backupzugriffe sind entsprechend geschützt. Resetidentifikatoren werden über die unterstützte Hashoption gespeichert. [Datenbankschema](https://better-auth.com/docs/concepts/database).
- Projektpolicy: `expiresIn=28800`, `disableSessionRefresh=true`, `cookieCache.enabled=false`. Zusätzlicher serverseitiger Sitzungsdatensatz mit unveränderlichem Loginzeitpunkt und `lastActivityAt`; jeder geschützte Zugriff lehnt bei now >= loginAt+8h oder now >= lastActivityAt+30min ab. Nur ausdrückliche authentifizierte Nutzeraktionen aktualisieren Aktivität, keine Hintergrundpolls. API, Serveraktionen und private Renderpfade verwenden denselben Guard. Diese Policy ist bewusste Anwendungslogik, kein angeblich eingebauter Idle-Schalter. [Sessionverwaltung](https://better-auth.com/docs/concepts/session-management).
- Kontostatus/Rolle aus der DB pro Request; ADMIN/ADVISOR und tatsächliche AppointmentParticipant-Zuordnung prüft Application. Logout, Deaktivierung und Rechteänderung invalidieren Sessions; kein Cookiecache verzögert dies. Der letzte aktive ADMIN ist unter gemeinsamer Administrationssperre geschützt.
- Reset-/Passwortänderung und Deaktivierung werden pro Nutzer serialisiert. Eine persistente Sicherheitsgeneration invalidiert alte Sitzungen bereits vor sicherheitskritischer Passwortmutation; bei Teilfehler bleiben alte Sitzungen gesperrt, der Nutzer fordert einen neuen Link an. Login/Sessionanlage und Passwortmutation verwenden dieselbe Nutzersperre; die Session speichert die unter dieser Sperre gelesene Sicherheitsgeneration. Ein persistenter Passwortmutationsstatus sperrt neue Logins bis zum erfolgreichen Abschluss; bei Teilfehler kann nur ein frischer erfolgreicher Reset den Status aufheben. Damit kann ein parallel mit altem Passwort begonnener Login keine neue gültige Generation übernehmen. Erfolgreicher Reset entfernt weitere Resetaufträge/-nachweise dieses Kontos. Der Bibliotheksablauf konsumiert den Einmaltoken vor dem Passwortwechsel; eine globale Transaktion über alle Bibliotheksschritte wird nicht vorausgesetzt. [Quellcode des gewählten Releases](https://raw.githubusercontent.com/better-auth/better-auth/v1.7.6/packages/better-auth/src/api/routes/password.ts).
- Resetmail nutzt MailGateway/Outbox mit maximal 30 Minuten geheimer Payload-TTL; abgelaufene oder supersedierte Resetnachrichten niemals senden. Aktivitäts-/Sicherheitsgeneration sind nicht vom Browser setzbar. Allgemeine Antwort bei unbekanntem/deaktiviertem Konto, Rate-Limit, Origin-/CSRF-Prüfung bleiben aktiv.

## Verifizierte Kombination und Grenzen

Dokumentations-/Paketmetadatenprüfung am 29.09.2026, kein Laufzeittest: Better Auth 1.7.6 deklariert Next 14/15/16, React 18/19 und Prisma 5/6/7 als Peers. Gewählt sind Next.js 16.3.7, React/ReactDOM 19.3.0, TypeScript 5.9.3, Prisma/Client/pg-Adapter 7.10.0, Node.js 24 LTS und PostgreSQL 17.11. Prisma 7 verlangt Node 24 oder passende 20/22-Version sowie TypeScript mindestens 5.4. PostgreSQL 17 ist bis 2029 unterstützt. Prisma 8 wird nicht gewählt, da es nicht im deklarierten Better-Auth-Peerbereich liegt.

Belege: [Release-Paketmanifest](https://raw.githubusercontent.com/better-auth/better-auth/v1.7.6/packages/better-auth/package.json), [Next-Metadaten](https://registry.npmjs.org/next/latest), [React-Metadaten](https://registry.npmjs.org/react/latest), [TypeScript 5.9.3](https://github.com/microsoft/TypeScript/releases/tag/v5.9.3), [Prisma 7.10.0](https://github.com/prisma/orm/releases/tag/7.10.0), [Prisma-Systemvoraussetzungen](https://www.prisma.io/docs/orm/v7/reference/system-requirements), [Node-LTS](https://nodejs.org/en/about/previous-releases), [PostgreSQL-Support](https://www.postgresql.org/support/versioning/).

## Konsequenzen

Foundation: Die Hauptbaseline ist unverändert installiert. Credentials, Prisma-Sessions, Logout und serverseitige 30-Minuten-/8-Stunden-Prüfung sind implementiert. Reset/Passwortänderung, Konto-/Rollenverwaltung und Sicherheitsgeneration bleiben nach Sprintbegrenzung ausstehend; entsprechende HTTP-Routen sind gesperrt. Vollständiger QS-27-Nachweis folgt später. Transitive Korrekturen und Prüfungen: [Foundation-Bericht](../docs/FOUNDATION.md).

Kein offener Bibliotheksentscheid und keine selbst entwickelte Passwortkryptografie. Die ursprüngliche Entscheidung beruhte auf Paketmetadaten; der Foundation-Sprint ergänzt Laufzeitprüfungen für den oben abgegrenzten Umfang. Ownership und Fail-closed-Reset bleiben zu implementieren und einschließlich konkurrierender Resets/Ausfälle gemäß QS-27 nachzuweisen. Versionsänderungen benötigen erneute Metadaten-/Sicherheitsprüfung. Die Auth-Basis ist keine vollständige Auth-Verwaltung oder Produktionsfreigabe.

Anforderungen: [NFR-SEC-01](../docs/spec/N1-nichtfunktional.md#nfr-sec-01), [NFR-SEC-02](../docs/spec/N1-nichtfunktional.md#nfr-sec-02), [NFR-SEC-04](../docs/spec/N1-nichtfunktional.md#nfr-sec-04), [AF-21](../docs/spec/F3-anwendungsfunktionen.md#af-21). Nachweis: [QS-27](../docs/arch/A10-quality-requirements.md#qs-27).
